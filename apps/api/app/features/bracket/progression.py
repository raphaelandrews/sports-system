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
    Check if all matches in a phase are complete.
    If so, advance winners to the next phase and create matches.
    """
    competition = await session.get(Competition, competition_id)
    if not competition or competition.status != CompetitionStatus.ACTIVE:
        return

    # Get all events for this competition, grouped by phase
    events_result = await session.execute(
        select(Event)
        .where(Event.competition_id == competition_id)
        .order_by(Event.event_date, Event.start_time)
    )
    events = list(events_result.scalars().all())

    # Group events by phase
    events_by_phase: dict[EventPhase, list[Event]] = {}
    for event in events:
        events_by_phase.setdefault(event.phase, []).append(event)

    # Process phases in order
    phase_order = [
        EventPhase.GROUPS,
        EventPhase.QUARTER,
        EventPhase.SEMI,
        EventPhase.BRONZE,
        EventPhase.FINAL,
    ]

    for phase in phase_order:
        phase_events = events_by_phase.get(phase, [])
        if not phase_events:
            continue

        # Check if all matches in this phase are complete
        all_complete = True
        for event in phase_events:
            matches_result = await session.execute(
                select(Match).where(Match.event_id == event.id)
            )
            matches = list(matches_result.scalars().all())

            if not matches:
                # No matches yet - either this phase hasn't started or it's a future phase
                # Check if it has teams assigned (via enrollments for groups)
                if phase == EventPhase.GROUPS:
                    enroll_result = await session.execute(
                        select(Enrollment)
                        .where(
                            Enrollment.event_id == event.id,
                            Enrollment.status == EnrollmentStatus.APPROVED,
                        )
                        .limit(1)
                    )
                    if enroll_result.scalar_one_or_none() is not None:
                        # Has enrollments but no matches - need bracket generation
                        all_complete = False
                        break
                continue

            # Check if all matches are complete
            if any(m.status != MatchStatus.COMPLETED for m in matches):
                all_complete = False
                break

        if not all_complete:
            continue

        # This phase is complete - advance to next phase
        next_phase_idx = phase_order.index(phase) + 1
        if next_phase_idx >= len(phase_order):
            continue

        next_phase = phase_order[next_phase_idx]
        next_events = events_by_phase.get(next_phase, [])

        if not next_events:
            continue

        # Collect winners from current phase
        winners: list[int] = []
        for event in phase_events:
            matches_result = await session.execute(
                select(Match).where(Match.event_id == event.id)
            )
            matches = list(matches_result.scalars().all())

            for match in matches:
                if match.winner_delegation_id:
                    winners.append(match.winner_delegation_id)

        if not winners:
            continue

        # Create matches for next phase events
        for next_event in next_events:
            # Check if matches already exist
            existing = await session.execute(
                select(Match).where(Match.event_id == next_event.id).limit(1)
            )
            if existing.scalar_one_or_none() is not None:
                continue

            # Pair winners: 1st vs last, 2nd vs 2nd-last, etc.
            pairs = []
            n = len(winners)
            for i in range(n // 2):
                pairs.append((winners[i], winners[n - 1 - i]))

            for team_a, team_b in pairs:
                session.add(
                    Match(
                        event_id=next_event.id,
                        team_a_delegation_id=team_a,
                        team_b_delegation_id=team_b,
                        status=MatchStatus.SCHEDULED,
                    )
                )

            logger.info(
                "phase_advanced competition_id=%s from=%s to=%s event_id=%s matches=%s",
                competition_id,
                phase.value,
                next_phase.value,
                next_event.id,
                len(pairs),
            )

    await session.commit()


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
