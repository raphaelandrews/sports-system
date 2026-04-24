from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, require_league_admin, require_league_chief, require_league_member
from app.database import get_session
from app.models.league import LeagueMember
from app.models.user import User
from app.schemas.athlete import (
    AthleteCreate,
    AthleteHistoryResponse,
    AthleteResponse,
    AthleteStatisticsResponse,
    AthleteUpdate,
)
from app.schemas.common import PaginatedResponse
from app.services import athlete_service

router = APIRouter(prefix="/leagues/{league_id}/athletes", tags=["athletes"])


@router.get("", response_model=PaginatedResponse[AthleteResponse])
async def list_athletes(
    league_id: int,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
    membership: LeagueMember = Depends(require_league_member()),
) -> PaginatedResponse[AthleteResponse]:
    return await athlete_service.list_athletes(
        session, league_id, current_user.id, membership, page, per_page
    )


@router.post("/ai-generate", response_model=AthleteResponse, status_code=status.HTTP_201_CREATED)
async def ai_generate(
    league_id: int,
    session: AsyncSession = Depends(get_session),
    _: LeagueMember = Depends(require_league_admin()),
) -> AthleteResponse:
    return await athlete_service.ai_generate(session, league_id)


@router.post("", response_model=AthleteResponse, status_code=status.HTTP_201_CREATED)
async def create_athlete(
    league_id: int,
    data: AthleteCreate,
    session: AsyncSession = Depends(get_session),
    _: LeagueMember = Depends(require_league_chief()),
) -> AthleteResponse:
    return await athlete_service.create_athlete(session, league_id, data)


@router.get("/{athlete_id}", response_model=AthleteResponse)
async def get_athlete(
    league_id: int,
    athlete_id: int,
    session: AsyncSession = Depends(get_session),
    _: LeagueMember = Depends(require_league_member()),
) -> AthleteResponse:
    return await athlete_service.get_athlete(session, league_id, athlete_id)


@router.patch("/{athlete_id}", response_model=AthleteResponse)
async def update_athlete(
    league_id: int,
    athlete_id: int,
    data: AthleteUpdate,
    session: AsyncSession = Depends(get_session),
    _: LeagueMember = Depends(require_league_chief()),
) -> AthleteResponse:
    return await athlete_service.update_athlete(session, league_id, athlete_id, data)


@router.delete("/{athlete_id}", status_code=status.HTTP_204_NO_CONTENT)
async def archive_athlete(
    league_id: int,
    athlete_id: int,
    session: AsyncSession = Depends(get_session),
    _: LeagueMember = Depends(require_league_admin()),
) -> None:
    await athlete_service.archive_athlete(session, league_id, athlete_id)


@router.get("/{athlete_id}/history", response_model=AthleteHistoryResponse)
async def get_history(
    league_id: int,
    athlete_id: int,
    session: AsyncSession = Depends(get_session),
    _: LeagueMember = Depends(require_league_member()),
) -> AthleteHistoryResponse:
    return await athlete_service.get_history(session, league_id, athlete_id)


@router.get("/{athlete_id}/statistics", response_model=AthleteStatisticsResponse)
async def get_statistics(
    league_id: int,
    athlete_id: int,
    session: AsyncSession = Depends(get_session),
    _: LeagueMember = Depends(require_league_member()),
) -> AthleteStatisticsResponse:
    return await athlete_service.get_statistics(session, league_id, athlete_id)
