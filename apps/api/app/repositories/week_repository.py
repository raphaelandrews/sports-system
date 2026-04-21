from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.week import CompetitionWeek


async def get_by_id(session: AsyncSession, week_id: int) -> Optional[CompetitionWeek]:
    return await session.get(CompetitionWeek, week_id)


async def list_all(
    session: AsyncSession,
    offset: int = 0,
    limit: int = 20,
) -> tuple[list[CompetitionWeek], int]:
    q = select(CompetitionWeek).order_by(CompetitionWeek.week_number)
    total_result = await session.execute(select(func.count()).select_from(q.subquery()))
    total = total_result.scalar_one()
    result = await session.execute(q.offset(offset).limit(limit))
    return list(result.scalars().all()), total


async def create(session: AsyncSession, week: CompetitionWeek) -> CompetitionWeek:
    session.add(week)
    await session.flush()
    await session.refresh(week)
    return week


async def save(session: AsyncSession, week: CompetitionWeek) -> CompetitionWeek:
    session.add(week)
    await session.flush()
    await session.refresh(week)
    return week
