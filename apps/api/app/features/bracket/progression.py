import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.competition import Competition, CompetitionStatus
from app.domain.models.event import Event, EventPhase, EventStatus, Match, MatchStatus
from app.domain.models.enrollment import Enrollment, EnrollmentStatus
from app.domain.models.result import Result, Medal

logger = logging.getLogger(__name__)


async def check_and_advance_phases(session: AsyncSession, competition_id: int) -> None:
    """
    Per-modality bracket advancement.

    Rules:
    - GROUPS complete -> QF (if empty)
    - QUARTER complete -> SEMI (if empty), else FINAL (if no SEMI and empty)
    - SEMI complete -> FINAL (winners) + BRONZE (losers)
    """
    competition = await session.get(Competition, competition_id)
    if not competition or competition.status != CompetitionStatus.ACTIVE:
        return

    events_result = await session.execute(
        select(Event)
        .where(Event.competition_id == competition_id)
        .order_by(Event.event_date, Event.start_time)
    )
    events = list(events_result.scalars().all())

    # Group events by modality, then by phase
    by_modality: dict[int, dict[EventPhase, list[Event]]] = {}
    for event in events:
        by_modality.setdefault(event.modality_id, {}).setdefault(
            event.phase, []
        ).append(event)

    for modality_id, events_by_phase in by_modality.items():
        # GROUPS -> QF
        if await _phase_complete(session, events_by_phase, EventPhase.GROUPS):
            if await _phase_empty(session, events_by_phase, EventPhase.QUARTER):
                winners = await _get_winners(
                    session, events_by_phase, EventPhase.GROUPS
                )
                if len(winners) >= 2:
                    await _create_matches(
                        session, events_by_phase, EventPhase.QUARTER, winners
                    )

        # QUARTER -> SEMI or FINAL
        if await _phase_complete(session, events_by_phase, EventPhase.QUARTER):
            if await _phase_has_events(session, events_by_phase, EventPhase.SEMI):
                if await _phase_empty(session, events_by_phase, EventPhase.SEMI):
                    winners = await _get_winners(
                        session, events_by_phase, EventPhase.QUARTER
                    )
                    if len(winners) >= 2:
                        await _create_matches(
                            session, events_by_phase, EventPhase.SEMI, winners
                        )
            elif await _phase_empty(session, events_by_phase, EventPhase.FINAL):
                winners = await _get_winners(
                    session, events_by_phase, EventPhase.QUARTER
                )
                if len(winners) >= 2:
                    await _create_matches(
                        session, events_by_phase, EventPhase.FINAL, winners
                    )

        # SEMI -> FINAL (winners) + BRONZE (losers)
        if await _phase_complete(session, events_by_phase, EventPhase.SEMI):
            if await _phase_empty(session, events_by_phase, EventPhase.FINAL):
                winners = await _get_winners(session, events_by_phase, EventPhase.SEMI)
                if len(winners) >= 2:
                    await _create_matches(
                        session, events_by_phase, EventPhase.FINAL, winners
                    )
            if await _phase_empty(session, events_by_phase, EventPhase.BRONZE):
                losers = await _get_losers(session, events_by_phase, EventPhase.SEMI)
                if len(losers) >= 2:
                    await _create_matches(
                        session, events_by_phase, EventPhase.BRONZE, losers
                    )

    await session.commit()


async def _phase_complete(
    session: AsyncSession, by_phase: dict[EventPhase, list[Event]], phase: EventPhase
) -> bool:
    events = by_phase.get(phase, [])
    if not events:
        return False
    events_with_matches = []
    for event in events:
        matches_result = await session.execute(
            select(Match).where(Match.event_id == event.id)
        )
        matches = list(matches_result.scalars().all())
        if matches:
            events_with_matches.append((event, matches))
    if not events_with_matches:
        return False
    for event, matches in events_with_matches:
        if any(m.status != MatchStatus.COMPLETED for m in matches):
            return False
    return True


async def _phase_empty(
    session: AsyncSession, by_phase: dict[EventPhase, list[Event]], phase: EventPhase
) -> bool:
    events = by_phase.get(phase, [])
    if not events:
        return True
    for event in events:
        existing = await session.execute(
            select(Match).where(Match.event_id == event.id).limit(1)
        )
        if existing.scalar_one_or_none() is not None:
            return False
    return True


async def _phase_has_events(
    session: AsyncSession, by_phase: dict[EventPhase, list[Event]], phase: EventPhase
) -> bool:
    return len(by_phase.get(phase, [])) > 0


async def _get_winners(
    session: AsyncSession, by_phase: dict[EventPhase, list[Event]], phase: EventPhase
) -> list[int]:
    winners: list[int] = []
    for event in by_phase.get(phase, []):
        matches_result = await session.execute(
            select(Match).where(Match.event_id == event.id)
        )
        for match in matches_result.scalars().all():
            if match.winner_delegation_id is not None:
                winners.append(match.winner_delegation_id)
    return winners


async def _get_losers(
    session: AsyncSession, by_phase: dict[EventPhase, list[Event]], phase: EventPhase
) -> list[int]:
    losers: list[int] = []
    for event in by_phase.get(phase, []):
        matches_result = await session.execute(
            select(Match).where(Match.event_id == event.id)
        )
        for match in matches_result.scalars().all():
            if match.winner_delegation_id is not None:
                loser = (
                    match.team_b_delegation_id
                    if match.winner_delegation_id == match.team_a_delegation_id
                    else match.team_a_delegation_id
                )
                if loser is not None:
                    losers.append(loser)
    return losers


async def _create_matches(
    session: AsyncSession,
    by_phase: dict[EventPhase, list[Event]],
    phase: EventPhase,
    teams: list[int],
) -> None:
    events = by_phase.get(phase, [])
    if not events:
        return
    target_event = events[0]
    n = len(teams)
    for i in range(n // 2):
        team_a = teams[i]
        team_b = teams[n - 1 - i]
        session.add(
            Match(
                event_id=target_event.id,
                team_a_delegation_id=team_a,
                team_b_delegation_id=team_b,
                status=MatchStatus.SCHEDULED,
            )
        )
    await session.flush()
    logger.info(
        "phase_advanced competition_id=%s modality_id=%s to=%s event_id=%s matches=%s",
        target_event.competition_id,
        target_event.modality_id,
        phase.value,
        target_event.id,
        n // 2,
    )


async def check_competition_completion(
    session: AsyncSession, competition_id: int
) -> bool:
    """Check if all matches in all phases are complete. If so, mark competition as COMPLETED."""
    competition = await session.get(Competition, competition_id)
    if not competition or competition.status != CompetitionStatus.ACTIVE:
        return False

    events_result = await session.execute(
        select(Event).where(Event.competition_id == competition_id)
    )
    events = list(events_result.scalars().all())

    total_matches = 0
    completed_matches = 0

    for event in events:
        matches_result = await session.execute(
            select(Match).where(Match.event_id == event.id)
        )
        matches = list(matches_result.scalars().all())
        total_matches += len(matches)
        completed_matches += sum(
            1 for m in matches if m.status == MatchStatus.COMPLETED
        )

    if total_matches > 0 and total_matches == completed_matches:
        competition.status = CompetitionStatus.COMPLETED
        session.add(competition)
        await session.commit()
        logger.info("competition_completed competition_id=%s", competition_id)
        return True

    return False
