from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.delegation import DelegationMember
from app.domain.models.event import Event
from app.domain.models.competition import Competition


async def is_athlete_eligible_for_week(
    session: AsyncSession,
    athlete_id: int,
    user_id: int | None,
    delegation_id: int,
    competition: Competition,
) -> tuple[bool, str]:
    """
    Checks:
    1. Athlete has an active membership in delegation that started before week lock time.
    2. Week lock time = first event start_time of the week.
    Returns (eligible: bool, reason: str).
    """
    if user_id is None:
        return False, "Athlete has no user account and cannot be enrolled via membership check"

    first_event_result = await session.execute(
        select(Event)
        .where(Event.competition_id == competition.id)
        .order_by(Event.event_date, Event.start_time)
        .limit(1)
    )
    first_event = first_event_result.scalar_one_or_none()
    if first_event is None:
        return False, "No events scheduled for this week"

    lock_dt = datetime.combine(first_event.event_date, first_event.start_time)

    member_result = await session.execute(
        select(DelegationMember).where(
            DelegationMember.user_id == user_id,
            DelegationMember.delegation_id == delegation_id,
            DelegationMember.joined_at < lock_dt,
            DelegationMember.left_at == None,  # noqa: E711
        )
    )
    member = member_result.scalar_one_or_none()
    if member is None:
        return False, "Athlete was not a member of this delegation before the week lock time"

    return True, "Eligible"
