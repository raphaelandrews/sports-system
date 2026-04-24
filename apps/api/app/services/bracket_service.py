import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enrollment import Enrollment, EnrollmentStatus
from app.models.event import Event, Match, MatchStatus

logger = logging.getLogger(__name__)


async def generate(session: AsyncSession, competition_id: int) -> int:
    """
    For each Event in the competition, read approved Enrollment delegation_ids
    and create round-robin Match pairings.
    Returns total matches created.
    """
    events_result = await session.execute(
        select(Event).where(Event.competition_id == competition_id)
    )
    events = list(events_result.scalars().all())

    total = 0
    for event in events:
        enroll_result = await session.execute(
            select(Enrollment.delegation_id)
            .where(
                Enrollment.event_id == event.id,
                Enrollment.status == EnrollmentStatus.APPROVED,
            )
            .distinct()
        )
        delegation_ids = list(enroll_result.scalars().all())

        if len(delegation_ids) < 2:
            logger.info("bracket_skip event_id=%s delegations=%s", event.id, len(delegation_ids))
            continue

        for i in range(len(delegation_ids)):
            for j in range(i + 1, len(delegation_ids)):
                match = Match(
                    event_id=event.id,
                    team_a_delegation_id=delegation_ids[i],
                    team_b_delegation_id=delegation_ids[j],
                    status=MatchStatus.SCHEDULED,
                )
                session.add(match)
                total += 1

        logger.info("bracket_generated event_id=%s matches=%s", event.id, total)

    await session.flush()
    return total
