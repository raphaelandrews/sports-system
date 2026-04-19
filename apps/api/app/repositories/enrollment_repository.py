from datetime import date, time
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enrollment import Enrollment, EnrollmentStatus
from app.models.event import Event


async def get_by_id(session: AsyncSession, enrollment_id: int) -> Optional[Enrollment]:
    return await session.get(Enrollment, enrollment_id)


async def list_all(
    session: AsyncSession,
    offset: int,
    limit: int,
    event_id: int | None = None,
    status: EnrollmentStatus | None = None,
    delegation_id: int | None = None,
) -> tuple[list[Enrollment], int]:
    q = select(Enrollment)
    if event_id is not None:
        q = q.where(Enrollment.event_id == event_id)
    if status is not None:
        q = q.where(Enrollment.status == status)
    if delegation_id is not None:
        q = q.where(Enrollment.delegation_id == delegation_id)
    total_result = await session.execute(select(func.count()).select_from(q.subquery()))
    total = total_result.scalar_one()
    result = await session.execute(q.order_by(Enrollment.created_at.desc()).offset(offset).limit(limit))
    return list(result.scalars().all()), total


async def list_by_delegation(
    session: AsyncSession,
    delegation_id: int,
    offset: int,
    limit: int,
    event_id: int | None = None,
    status: EnrollmentStatus | None = None,
) -> tuple[list[Enrollment], int]:
    q = select(Enrollment).where(Enrollment.delegation_id == delegation_id)
    if event_id is not None:
        q = q.where(Enrollment.event_id == event_id)
    if status is not None:
        q = q.where(Enrollment.status == status)
    total_result = await session.execute(select(func.count()).select_from(q.subquery()))
    total = total_result.scalar_one()
    result = await session.execute(q.order_by(Enrollment.created_at.desc()).offset(offset).limit(limit))
    return list(result.scalars().all()), total


async def create(session: AsyncSession, enrollment: Enrollment) -> Enrollment:
    session.add(enrollment)
    await session.flush()
    await session.refresh(enrollment)
    return enrollment


async def save(session: AsyncSession, enrollment: Enrollment) -> Enrollment:
    session.add(enrollment)
    await session.flush()
    await session.refresh(enrollment)
    return enrollment


async def get_by_athlete_and_event(
    session: AsyncSession, athlete_id: int, event_id: int
) -> Optional[Enrollment]:
    result = await session.execute(
        select(Enrollment).where(
            Enrollment.athlete_id == athlete_id,
            Enrollment.event_id == event_id,
            Enrollment.status != EnrollmentStatus.REJECTED,
        )
    )
    return result.scalar_one_or_none()


async def count_by_event_and_delegation(
    session: AsyncSession,
    event_id: int,
    delegation_id: int,
    statuses: list[EnrollmentStatus],
) -> int:
    result = await session.execute(
        select(func.count()).select_from(Enrollment).where(
            Enrollment.event_id == event_id,
            Enrollment.delegation_id == delegation_id,
            Enrollment.status.in_(statuses),
        )
    )
    return result.scalar_one()


async def get_athlete_conflicting_enrollment(
    session: AsyncSession,
    athlete_id: int,
    event_date: date,
    start_time: time,
    exclude_event_id: int,
) -> Optional[Enrollment]:
    conflicting_event_ids = (
        select(Event.id)
        .where(
            Event.event_date == event_date,
            Event.start_time == start_time,
            Event.id != exclude_event_id,
        )
        .scalar_subquery()
    )
    result = await session.execute(
        select(Enrollment).where(
            Enrollment.athlete_id == athlete_id,
            Enrollment.event_id.in_(conflicting_event_ids),
            Enrollment.status.in_([EnrollmentStatus.PENDING, EnrollmentStatus.APPROVED]),
        )
    )
    return result.scalar_one_or_none()
