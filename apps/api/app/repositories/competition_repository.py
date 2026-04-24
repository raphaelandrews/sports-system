from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.competition import Competition


async def get_by_id(session: AsyncSession, competition_id: int) -> Optional[Competition]:
    return await session.get(Competition, competition_id)


async def list_all(
    session: AsyncSession,
    offset: int = 0,
    limit: int = 20,
) -> tuple[list[Competition], int]:
    q = select(Competition).order_by(Competition.number)
    total_result = await session.execute(select(func.count()).select_from(q.subquery()))
    total = total_result.scalar_one()
    result = await session.execute(q.offset(offset).limit(limit))
    return list(result.scalars().all()), total


async def create(session: AsyncSession, competition: Competition) -> Competition:
    session.add(competition)
    await session.flush()
    await session.refresh(competition)
    return competition


async def save(session: AsyncSession, competition: Competition) -> Competition:
    session.add(competition)
    await session.flush()
    await session.refresh(competition)
    return competition
