"""Verify seeded database integrity and logical consistency."""

from __future__ import annotations

import asyncio
import logging
from collections import defaultdict
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_factory
from app.domain.models.competition import Competition, CompetitionStatus
from app.domain.models.delegation import Delegation, DelegationMember
from app.domain.models.event import Event, EventPhase, EventStatus, Match, MatchStatus
from app.domain.models.league import League
from app.domain.models.result import Medal, Result
from app.domain.models.sport import Modality, Sport
from app.domain.models.user import User
from app.features.admin.seed_data import LEAGUE_NAME, NUM_DELEGATIONS
from app.features.results import repository as result_repository

logger = logging.getLogger(__name__)

COMP_START = date(2025, 12, 1)
COMP_END = date(2025, 12, 20)

ERRORS: list[str] = []
WARNINGS: list[str] = []


def error(msg: str) -> None:
    ERRORS.append(msg)
    logger.error("VERIFY: %s", msg)


def warning(msg: str) -> None:
    WARNINGS.append(msg)
    logger.warning("VERIFY: %s", msg)


async def verify_all() -> bool:
    async with async_session_factory() as session:
        await _verify_league(session)
        await _verify_competition(session)
        await _verify_events(session)
        await _verify_matches(session)
        await _verify_players(session)
        await _verify_delegations(session)
        await _verify_medals(session)
        await _verify_bracket_logic(session)
        await _verify_schedule_logic(session)

        logger.info("=" * 60)
        logger.info("VERIFY SUMMARY")
        logger.info("=" * 60)
        logger.info("Errors: %s", len(ERRORS))
        logger.info("Warnings: %s", len(WARNINGS))
        if ERRORS:
            logger.info("FAILED")
            return False
        logger.info("PASSED")
        return True


async def _verify_league(session: AsyncSession) -> None:
    logger.info("--- League ---")
    leagues = list((await session.execute(select(League))).scalars().all())
    logger.info("Leagues: %s", len(leagues))
    if not leagues:
        error("No leagues found")
        return
    league = leagues[0]
    logger.info("Name: %s", league.name)
    logger.info("Slug: %s", league.slug)
    if league.name != LEAGUE_NAME:
        warning(f"Unexpected league name: {league.name}")
    admin_result = await session.execute(
        select(User).where(User.email == "raphael@andrews.sh")
    )
    admin = admin_result.scalar_one_or_none()
    if admin is None:
        error("Admin raphael@andrews.sh not found")
    else:
        logger.info("Admin: %s (role=%s)", admin.name, admin.role)


async def _verify_competition(session: AsyncSession) -> None:
    logger.info("--- Competition ---")
    competitions = list((await session.execute(select(Competition))).scalars().all())
    logger.info("Competitions: %s", len(competitions))
    if not competitions:
        error("No competitions found")
        return
    comp = competitions[0]
    logger.info("ID: %s", comp.id)
    logger.info("Dates: %s to %s", comp.start_date, comp.end_date)
    logger.info("Status: %s", comp.status)
    if comp.status != CompetitionStatus.COMPLETED:
        error(f"Competition status is {comp.status}, expected COMPLETED")
    if comp.start_date != COMP_START:
        error(f"Start date is {comp.start_date}, expected {COMP_START}")
    if comp.end_date != COMP_END:
        error(f"End date is {comp.end_date}, expected {COMP_END}")
    logger.info("Sport focus: %s sports", len(comp.sport_focus or []))


async def _verify_events(session: AsyncSession) -> None:
    logger.info("--- Events ---")
    events = list(
        (await session.execute(select(Event).order_by(Event.id))).scalars().all()
    )
    logger.info("Total events: %s", len(events))

    by_modality: dict[int, list[Event]] = defaultdict(list)
    for e in events:
        by_modality[e.modality_id].append(e)

    logger.info("Modalities with events: %s", len(by_modality))

    active_modalities = list(
        (
            await session.execute(select(Modality).where(Modality.is_active == True))  # noqa: E712
        )
        .scalars()
        .all()
    )
    if len(by_modality) != len(active_modalities):
        error(
            "Not all active modalities received seed events: "
            f"{len(by_modality)} of {len(active_modalities)}"
        )

    modality_map = {modality.id: modality for modality in active_modalities}
    for modality_id, modality_events in by_modality.items():
        modality = modality_map.get(modality_id)
        if modality is None:
            continue
        bracket_format = modality.rules_json.get("bracket_format", "group-stage")
        phases = {event.phase for event in modality_events}
        if bracket_format in ("group-stage-se", "group-stage-de"):
            required_phases = {
                EventPhase.GROUPS,
                EventPhase.QUARTER,
                EventPhase.SEMI,
                EventPhase.BRONZE,
                EventPhase.FINAL,
            }
            missing = sorted(
                phase.value for phase in required_phases if phase not in phases
            )
            if missing:
                error(
                    f"{modality.name} is missing scheduled phases: {', '.join(missing)}"
                )

    # Check event statuses
    scheduled = sum(1 for e in events if e.status == EventStatus.SCHEDULED)
    completed = sum(1 for e in events if e.status == EventStatus.COMPLETED)
    cancelled = sum(1 for e in events if e.status == EventStatus.CANCELLED)
    logger.info(
        "Event statuses: SCHEDULED=%s COMPLETED=%s CANCELLED=%s",
        scheduled,
        completed,
        cancelled,
    )

    # Check date range
    dates = [e.event_date for e in events if e.event_date]
    if dates:
        min_date = min(dates)
        max_date = max(dates)
        logger.info("Event date range: %s to %s", min_date, max_date)
        if min_date < COMP_START:
            error(f"Event before competition start: {min_date}")
        if max_date > COMP_END:
            error(f"Event after competition end: {max_date}")

    chronological = sorted(events, key=lambda event: (event.event_date, event.start_time, event.id or 0))
    if [event.id for event in events] != [event.id for event in chronological]:
        warning("Events are not stored in chronological order")


async def _verify_matches(session: AsyncSession) -> None:
    logger.info("--- Matches ---")
    matches = list(
        (await session.execute(select(Match).order_by(Match.id))).scalars().all()
    )
    logger.info("Total matches: %s", len(matches))

    pending = sum(1 for m in matches if m.status != MatchStatus.COMPLETED)
    completed = sum(1 for m in matches if m.status == MatchStatus.COMPLETED)
    logger.info("Match statuses: COMPLETED=%s PENDING=%s", completed, pending)

    if pending > 0:
        error(f"{pending} matches are not COMPLETED")

    # Check scores exist for completed matches
    no_score = 0
    for m in matches:
        if m.status == MatchStatus.COMPLETED and (
            m.score_a is None or m.score_b is None
        ):
            no_score += 1
    if no_score:
        error(f"{no_score} completed matches have no score")
    else:
        logger.info("All completed matches have scores")

    # Check winner consistency
    bad_winner = 0
    for m in matches:
        if m.status == MatchStatus.COMPLETED and m.winner_delegation_id is not None:
            if m.winner_delegation_id not in (
                m.team_a_delegation_id,
                m.team_b_delegation_id,
            ):
                bad_winner += 1
    if bad_winner:
        error(f"{bad_winner} matches have invalid winner_delegation_id")


async def _verify_players(session: AsyncSession) -> None:
    logger.info("--- Players / Athletes ---")
    users = list((await session.execute(select(User))).scalars().all())
    logger.info("Total users: %s", len(users))

    from app.domain.models.athlete import Athlete, AthleteModality

    athletes = list((await session.execute(select(Athlete))).scalars().all())
    logger.info("Total athletes: %s", len(athletes))

    # Check athlete-user linkage
    orphan_athletes = 0
    for a in athletes:
        user = await session.get(User, a.user_id)
        if user is None:
            orphan_athletes += 1
    if orphan_athletes:
        error(f"{orphan_athletes} athletes without users")
    else:
        logger.info("All athletes linked to users")

    # Check modalities
    ams = list((await session.execute(select(AthleteModality))).scalars().all())
    logger.info("AthleteModality links: %s", len(ams))

    # Check delegation membership
    dms = list((await session.execute(select(DelegationMember))).scalars().all())
    logger.info("DelegationMember links: %s", len(dms))

    # Verify chiefs exist
    chief_users = [u for u in users if "chief." in u.email]
    logger.info("Chief users: %s", len(chief_users))
    if len(chief_users) != NUM_DELEGATIONS:
        error(f"Expected {NUM_DELEGATIONS} chiefs, got {len(chief_users)}")

    # Verify admin exists
    admin = await session.execute(
        select(User).where(User.email == "raphael@andrews.sh")
    )
    if admin.scalar_one_or_none() is None:
        error("Superadmin not found")
    else:
        logger.info("Superadmin verified")


async def _verify_delegations(session: AsyncSession) -> None:
    logger.info("--- Delegations ---")
    delegations = list((await session.execute(select(Delegation))).scalars().all())
    logger.info("Delegations: %s", len(delegations))

    if len(delegations) != NUM_DELEGATIONS:
        error(f"Expected {NUM_DELEGATIONS} delegations, got {len(delegations)}")

    for d in delegations:
        members = await session.execute(
            select(DelegationMember).where(DelegationMember.delegation_id == d.id)
        )
        member_count = len(list(members.scalars().all()))
        logger.info("%s: %s members", d.name, member_count)
        if member_count < 1:
            error(f"Delegation {d.name} has no members")


async def _verify_medals(session: AsyncSession) -> None:
    logger.info("--- Medals ---")
    results = list((await session.execute(select(Result))).scalars().all())
    logger.info("Total results: %s", len(results))

    medal_results = [r for r in results if r.medal is not None]
    logger.info("Results with medals: %s", len(medal_results))

    gold = sum(1 for r in medal_results if r.medal == Medal.GOLD)
    silver = sum(1 for r in medal_results if r.medal == Medal.SILVER)
    bronze = sum(1 for r in medal_results if r.medal == Medal.BRONZE)
    logger.info("Gold=%s Silver=%s Bronze=%s", gold, silver, bronze)

    # Each modality with a FINAL should have exactly 1 gold, 1 silver
    # Each modality with a BRONZE should have exactly 2 bronze (or 1 if double-elim)
    # Let's just verify totals are reasonable
    if gold == 0:
        error("No gold medals found")
    if silver == 0:
        error("No silver medals found")
    if bronze == 0:
        error("No bronze medals found")

    # Verify medal board
    leagues = list((await session.execute(select(League))).scalars().all())
    if leagues:
        rows = await result_repository.get_medal_board(session, leagues[0].id)
        logger.info("Medal board delegations: %s", len(rows))
        for row in rows:
            d = await session.get(Delegation, row.delegation_id)
            name = d.name if d else "Unknown"
            logger.info(
                "  %s: %s gold, %s silver, %s bronze",
                name,
                row.gold,
                row.silver,
                row.bronze,
            )


async def _verify_bracket_logic(session: AsyncSession) -> None:
    logger.info("--- Bracket Logic ---")
    events = list((await session.execute(select(Event))).scalars().all())

    by_modality: dict[int, list[Event]] = defaultdict(list)
    for e in events:
        by_modality[e.modality_id].append(e)

    for mod_id, mod_events in by_modality.items():
        modality = await session.get(Modality, mod_id)
        mod_name = modality.name if modality else f"modality_{mod_id}"
        by_phase: dict[EventPhase, list[Event]] = defaultdict(list)
        for e in mod_events:
            by_phase[e.phase].append(e)

        # Check phase ordering: GROUPS < QUARTER < SEMI < BRONZE/FINAL
        phase_dates: dict[EventPhase, list[date]] = defaultdict(list)
        for phase, phase_events in by_phase.items():
            for e in phase_events:
                if e.event_date:
                    phase_dates[phase].append(e.event_date)

        order = [
            EventPhase.GROUPS,
            EventPhase.QUARTER,
            EventPhase.SEMI,
            EventPhase.BRONZE,
            EventPhase.FINAL,
        ]
        prev_max: date | None = None
        for phase in order:
            dates = phase_dates.get(phase, [])
            if not dates:
                continue
            phase_min = min(dates)
            phase_max = max(dates)
            if prev_max and phase_min < prev_max:
                warning(
                    f"{mod_name}: {phase.value} starts {phase_min} before previous phase ends {prev_max}"
                )
            prev_max = phase_max

        # Verify FINAL has a winner result
        if EventPhase.FINAL in by_phase:
            final_events = by_phase[EventPhase.FINAL]
            for fe in final_events:
                matches_result = await session.execute(
                    select(Match).where(Match.event_id == fe.id)
                )
                final_matches = list(matches_result.scalars().all())
                if not final_matches:
                    warning(f"{mod_name} FINAL event {fe.id} has no matches")
                for fm in final_matches:
                    if fm.status != MatchStatus.COMPLETED:
                        error(f"{mod_name} FINAL match {fm.id} not completed")
                    if fm.winner_delegation_id is None:
                        error(f"{mod_name} FINAL match {fm.id} has no winner")

    logger.info("Bracket logic check complete")


async def _verify_schedule_logic(session: AsyncSession) -> None:
    logger.info("--- Schedule Logic ---")
    events = list(
        (
            await session.execute(
                select(Event).order_by(Event.event_date, Event.start_time)
            )
        )
        .scalars()
        .all()
    )

    # Check no overlapping events on same day at same time
    overlaps = 0
    for i, e1 in enumerate(events):
        for e2 in events[i + 1 :]:
            if (
                e1.event_date == e2.event_date
                and e1.start_time == e2.start_time
                and e1.id != e2.id
            ):
                overlaps += 1
    if overlaps:
        warning(f"{overlaps} events have exact date/time overlap")
    else:
        logger.info("No exact event overlaps found")

    # Check events are within competition dates
    comp = await session.execute(select(Competition))
    competition = comp.scalar_one_or_none()
    if competition:
        out_of_range = 0
        for e in events:
            if (
                e.event_date
                and competition.start_date
                and e.event_date < competition.start_date
            ):
                out_of_range += 1
            if (
                e.event_date
                and competition.end_date
                and e.event_date > competition.end_date
            ):
                out_of_range += 1
        if out_of_range:
            error(f"{out_of_range} events outside competition dates")
        else:
            logger.info("All events within competition dates")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    ok = asyncio.run(verify_all())
    exit(0 if ok else 1)
