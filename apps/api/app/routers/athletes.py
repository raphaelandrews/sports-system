from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, require_admin, require_chief_or_admin
from app.database import get_session
from app.models.user import User, UserRole
from app.repositories.delegation_repository import get_current_delegation_id
from app.schemas.athlete import (
    AthleteCreate,
    AthleteHistoryResponse,
    AthleteResponse,
    AthleteStatisticsResponse,
    AthleteUpdate,
)
from app.schemas.common import PaginatedResponse
from app.services import athlete_service

router = APIRouter(prefix="/athletes", tags=["athletes"])


@router.get("", response_model=PaginatedResponse[AthleteResponse])
async def list_athletes(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> PaginatedResponse[AthleteResponse]:
    delegation_id: int | None = None
    if current_user.role == UserRole.CHIEF:
        delegation_id = await get_current_delegation_id(session, current_user.id)
    return await athlete_service.list_athletes(session, current_user, delegation_id, page, per_page)


@router.post("/ai-generate", response_model=AthleteResponse, status_code=status.HTTP_201_CREATED)
async def ai_generate(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> AthleteResponse:
    return await athlete_service.ai_generate(session)


@router.post("", response_model=AthleteResponse, status_code=status.HTTP_201_CREATED)
async def create_athlete(
    data: AthleteCreate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_chief_or_admin),
) -> AthleteResponse:
    return await athlete_service.create_athlete(session, data)


@router.get("/{athlete_id}", response_model=AthleteResponse)
async def get_athlete(
    athlete_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_user),
) -> AthleteResponse:
    return await athlete_service.get_athlete(session, athlete_id)


@router.patch("/{athlete_id}", response_model=AthleteResponse)
async def update_athlete(
    athlete_id: int,
    data: AthleteUpdate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_chief_or_admin),
) -> AthleteResponse:
    return await athlete_service.update_athlete(session, athlete_id, data)


@router.delete("/{athlete_id}", status_code=status.HTTP_204_NO_CONTENT)
async def archive_athlete(
    athlete_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> None:
    await athlete_service.archive_athlete(session, athlete_id)


@router.get("/{athlete_id}/history", response_model=AthleteHistoryResponse)
async def get_history(
    athlete_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_user),
) -> AthleteHistoryResponse:
    return await athlete_service.get_history(session, athlete_id)


@router.get("/{athlete_id}/statistics", response_model=AthleteStatisticsResponse)
async def get_statistics(
    athlete_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_user),
) -> AthleteStatisticsResponse:
    return await athlete_service.get_statistics(session, athlete_id)
