from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.sport import Modality, Sport, SportType
from app.features.sports import repository as sport_repository
from app.domain.schemas.sport import (
    ModalityCreate,
    ModalityResponse,
    ModalityUpdate,
    SportCreate,
    SportDetailResponse,
    SportResponse,
    SportUpdate,
)

_MOCK_SPORTS = [
    ("Rúgbi", SportType.TEAM, 15),
    ("Badminton", SportType.INDIVIDUAL, 1),
    ("Esgrima", SportType.INDIVIDUAL, 1),
    ("Hóquei", SportType.TEAM, 11),
    ("Luta Olímpica", SportType.INDIVIDUAL, 1),
]


async def list_sports(session: AsyncSession, page: int, per_page: int) -> tuple[list[Sport], int]:
    return await sport_repository.list_active(session, page, per_page)


async def get_sport(session: AsyncSession, sport_id: int) -> Sport:
    sport = await sport_repository.get_by_id(session, sport_id)
    if sport is None or not sport.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sport not found")
    return sport


async def get_sport_detail(session: AsyncSession, sport_id: int) -> SportDetailResponse:
    sport = await get_sport(session, sport_id)
    modalities = await sport_repository.get_modalities(session, sport_id)
    stats_schema_row = await sport_repository.get_stats_schema(session, sport_id)
    return SportDetailResponse(
        **SportResponse.model_validate(sport).model_dump(),
        modalities=[ModalityResponse.model_validate(m) for m in modalities],
        stats_schema=stats_schema_row.stats_schema if stats_schema_row else None,
    )


async def create_sport(session: AsyncSession, data: SportCreate) -> Sport:
    sport = Sport(
        name=data.name,
        sport_type=data.sport_type,
        description=data.description,
        rules_json=data.rules_json,
        player_count=data.player_count,
    )
    return await sport_repository.create(session, sport)


async def update_sport(session: AsyncSession, sport_id: int, data: SportUpdate) -> Sport:
    sport = await get_sport(session, sport_id)
    if not data.has_updates():
        return sport
    if data.name is not None:
        sport.name = data.name
    if data.description is not None:
        sport.description = data.description
    if data.rules_json is not None:
        sport.rules_json = data.rules_json
    if data.player_count is not None:
        sport.player_count = data.player_count
    return await sport_repository.save(session, sport)


async def archive_sport(session: AsyncSession, sport_id: int) -> None:
    sport = await get_sport(session, sport_id)
    sport.is_active = False
    await sport_repository.save(session, sport)


async def create_modality(session: AsyncSession, sport_id: int, data: ModalityCreate) -> Modality:
    await get_sport(session, sport_id)
    modality = Modality(
        sport_id=sport_id,
        name=data.name,
        gender=data.gender,
        category=data.category,
        rules_json=data.rules_json,
    )
    return await sport_repository.create_modality(session, modality)


async def update_modality(session: AsyncSession, modality_id: int, data: ModalityUpdate) -> Modality:
    modality = await sport_repository.get_modality_by_id(session, modality_id)
    if modality is None or not modality.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Modality not found")
    if not data.has_updates():
        return modality
    if data.name is not None:
        modality.name = data.name
    if data.gender is not None:
        modality.gender = data.gender
    if data.category is not None:
        modality.category = data.category
    if data.rules_json is not None:
        modality.rules_json = data.rules_json
    return await sport_repository.save_modality(session, modality)


async def archive_modality(session: AsyncSession, modality_id: int) -> None:
    modality = await sport_repository.get_modality_by_id(session, modality_id)
    if modality is None or not modality.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Modality not found")
    modality.is_active = False
    await sport_repository.save_modality(session, modality)


async def ai_generate(session: AsyncSession, count: int) -> list[Sport]:
    from app.domain.models.sport import Gender

    created: list[Sport] = []
    for name, sport_type, player_count in _MOCK_SPORTS[:count]:
        sport = Sport(name=name, sport_type=sport_type, player_count=player_count, rules_json={})
        await sport_repository.create(session, sport)
        for gender in (Gender.M, Gender.F):
            session.add(Modality(sport_id=sport.id, name=f"{name} {gender.value}", gender=gender, rules_json={}))
        created.append(sport)
    return created
