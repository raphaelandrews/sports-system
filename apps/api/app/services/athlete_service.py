import secrets

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.athlete import Athlete
from app.models.user import User, UserRole
from app.repositories import athlete_repository
from app.schemas.athlete import (
    AthleteCreate,
    AthleteHistoryResponse,
    AthleteResponse,
    AthleteStatisticsResponse,
    AthleteUpdate,
    DelegationHistoryItem,
    MatchHistoryItem,
)
from app.schemas.common import Meta, PaginatedResponse

_AI_NAMES = [
    "Carlos Mendes",
    "Juliana Alves",
    "Roberto Santos",
    "Fernanda Lima",
    "Marcos Oliveira",
    "Priscila Costa",
    "Eduardo Ferreira",
    "Beatriz Rocha",
    "Rafael Souza",
    "Amanda Nunes",
    "Leandro Pereira",
    "Camila Ribeiro",
    "Thiago Martins",
    "Vanessa Carvalho",
    "Lucas Gomes",
]


async def list_athletes(
    session: AsyncSession,
    current_user: User,
    delegation_id: int | None,
    page: int,
    per_page: int,
) -> PaginatedResponse[AthleteResponse]:
    offset = (page - 1) * per_page
    if current_user.role == UserRole.ADMIN:
        athletes, total = await athlete_repository.list_all(session, offset, per_page)
    else:
        if delegation_id is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="delegation_id required for chief")
        athletes, total = await athlete_repository.list_by_delegation(session, delegation_id, offset, per_page)
    return PaginatedResponse(
        data=[AthleteResponse.model_validate(a) for a in athletes],
        meta=Meta(total=total, page=page, per_page=per_page),
    )


async def get_athlete(session: AsyncSession, athlete_id: int) -> AthleteResponse:
    athlete = await athlete_repository.get_by_id(session, athlete_id)
    if athlete is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Athlete not found")
    return AthleteResponse.model_validate(athlete)


async def create_athlete(session: AsyncSession, data: AthleteCreate) -> AthleteResponse:
    existing = await athlete_repository.get_by_code(session, data.code)
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Athlete code already in use")
    athlete = Athlete(
        name=data.name,
        code=data.code,
        birthdate=data.birthdate,
        user_id=data.user_id,
    )
    athlete = await athlete_repository.create(session, athlete)
    await session.commit()
    return AthleteResponse.model_validate(athlete)


async def update_athlete(
    session: AsyncSession,
    athlete_id: int,
    data: AthleteUpdate,
) -> AthleteResponse:
    athlete = await athlete_repository.get_by_id(session, athlete_id)
    if athlete is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Athlete not found")
    if data.name is not None:
        athlete.name = data.name
    if data.birthdate is not None:
        athlete.birthdate = data.birthdate
    if data.is_active is not None:
        athlete.is_active = data.is_active
    athlete = await athlete_repository.save(session, athlete)
    await session.commit()
    return AthleteResponse.model_validate(athlete)


async def archive_athlete(session: AsyncSession, athlete_id: int) -> None:
    athlete = await athlete_repository.get_by_id(session, athlete_id)
    if athlete is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Athlete not found")
    athlete.is_active = False
    await athlete_repository.save(session, athlete)
    await session.commit()


async def get_history(session: AsyncSession, athlete_id: int) -> AthleteHistoryResponse:
    athlete = await athlete_repository.get_by_id(session, athlete_id)
    if athlete is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Athlete not found")
    del_history = await athlete_repository.get_delegation_history(session, athlete)
    match_history = await athlete_repository.get_match_history(session, athlete_id)
    return AthleteHistoryResponse(
        delegation_history=[DelegationHistoryItem(**d) for d in del_history],
        match_history=[MatchHistoryItem(**m) for m in match_history],
    )


async def get_statistics(session: AsyncSession, athlete_id: int) -> AthleteStatisticsResponse:
    athlete = await athlete_repository.get_by_id(session, athlete_id)
    if athlete is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Athlete not found")
    stats = await athlete_repository.get_statistics(session, athlete_id)
    return AthleteStatisticsResponse(**stats)


async def ai_generate(session: AsyncSession) -> AthleteResponse:
    for name in _AI_NAMES:
        code = f"AI-{secrets.token_hex(4).upper()}"
        existing = await athlete_repository.get_by_code(session, code)
        if existing is None:
            athlete = Athlete(name=name, code=code)
            athlete = await athlete_repository.create(session, athlete)
            await session.commit()
            return AthleteResponse.model_validate(athlete)
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not generate unique code")
