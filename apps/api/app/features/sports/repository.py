from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.sport import Modality, Sport, SportStatisticsSchema


async def get_by_id(session: AsyncSession, sport_id: int) -> Sport | None:
    return await session.get(Sport, sport_id)


async def list_active(
    session: AsyncSession, page: int = 1, per_page: int = 20
) -> tuple[list[Sport], int]:
    offset = (page - 1) * per_page
    count_result = await session.execute(
        select(func.count()).select_from(Sport).where(Sport.is_active == True)  # noqa: E712
    )
    total = count_result.scalar_one()
    result = await session.execute(
        select(Sport)
        .where(Sport.is_active == True)  # noqa: E712
        .order_by(Sport.name)
        .offset(offset)
        .limit(per_page)
    )
    return result.scalars().all(), total  # type: ignore[return-value]


async def create(session: AsyncSession, sport: Sport) -> Sport:
    session.add(sport)
    await session.flush()
    return sport


async def save(session: AsyncSession, sport: Sport) -> Sport:
    session.add(sport)
    await session.flush()
    return sport


async def get_modalities(session: AsyncSession, sport_id: int) -> list[Modality]:
    result = await session.execute(
        select(Modality)
        .where(Modality.sport_id == sport_id, Modality.is_active == True)  # noqa: E712
        .order_by(Modality.name)
    )
    return result.scalars().all()  # type: ignore[return-value]


async def get_modality_by_id(session: AsyncSession, modality_id: int) -> Modality | None:
    return await session.get(Modality, modality_id)


async def create_modality(session: AsyncSession, modality: Modality) -> Modality:
    session.add(modality)
    await session.flush()
    return modality


async def save_modality(session: AsyncSession, modality: Modality) -> Modality:
    session.add(modality)
    await session.flush()
    return modality


async def get_stats_schema(session: AsyncSession, sport_id: int) -> SportStatisticsSchema | None:
    result = await session.execute(
        select(SportStatisticsSchema).where(SportStatisticsSchema.sport_id == sport_id)
    )
    return result.scalar_one_or_none()
