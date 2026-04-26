from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.competition import Competition


async def get_by_id(
    session: AsyncSession, league_id: int, competition_id: int
) -> Optional[Competition]:
    result = await session.execute(
        select(Competition).where(
            Competition.id == competition_id,
            Competition.league_id == league_id,
        )
    )
    return result.scalar_one_or_none()


async def list_all(
    session: AsyncSession,
    league_id: int,
    offset: int = 0,
    limit: int = 20,
) -> tuple[list[Competition], int]:
    q = (
        select(Competition)
        .where(Competition.league_id == league_id)
        .order_by(Competition.number)
    )
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
