from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.shared.core.deps import require_league_admin
from app.database import get_session
from app.domain.models.league import LeagueMember
from app.domain.schemas.common import PaginatedResponse
from app.domain.schemas.competition import (
    CompetitionCreate,
    CompetitionResponse,
    CompetitionUpdate,
    GenerateSchedulePreview,
)
from app.features.competitions import service as competition_service

router = APIRouter(prefix="/leagues/{league_id}/competitions", tags=["competitions"])


@router.get("", response_model=PaginatedResponse[CompetitionResponse])
async def list_competitions(
    league_id: int,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
) -> PaginatedResponse[CompetitionResponse]:
    return await competition_service.list_competitions(session, league_id, page, per_page)


@router.post("", response_model=CompetitionResponse, status_code=status.HTTP_201_CREATED)
async def create_competition(
    league_id: int,
    data: CompetitionCreate,
    session: AsyncSession = Depends(get_session),
    _: LeagueMember = Depends(require_league_admin()),
) -> CompetitionResponse:
    return await competition_service.create_competition(session, league_id, data)


@router.get("/{competition_id}", response_model=CompetitionResponse)
async def get_competition(
    league_id: int,
    competition_id: int,
    session: AsyncSession = Depends(get_session),
) -> CompetitionResponse:
    return await competition_service.get_competition(session, league_id, competition_id)


@router.patch("/{competition_id}", response_model=CompetitionResponse)
async def update_competition(
    league_id: int,
    competition_id: int,
    data: CompetitionUpdate,
    session: AsyncSession = Depends(get_session),
    _: LeagueMember = Depends(require_league_admin()),
) -> CompetitionResponse:
    return await competition_service.update_competition(session, league_id, competition_id, data)


@router.post("/{competition_id}/publish", response_model=CompetitionResponse)
async def publish_competition(
    league_id: int,
    competition_id: int,
    session: AsyncSession = Depends(get_session),
    _: LeagueMember = Depends(require_league_admin()),
) -> CompetitionResponse:
    return await competition_service.publish_competition(session, league_id, competition_id)


@router.post("/{competition_id}/lock", response_model=CompetitionResponse)
async def lock_competition(
    league_id: int,
    competition_id: int,
    session: AsyncSession = Depends(get_session),
    _: LeagueMember = Depends(require_league_admin()),
) -> CompetitionResponse:
    return await competition_service.lock_competition(session, league_id, competition_id)


@router.post("/{competition_id}/activate", response_model=CompetitionResponse)
async def activate_competition(
    league_id: int,
    competition_id: int,
    session: AsyncSession = Depends(get_session),
    _: LeagueMember = Depends(require_league_admin()),
) -> CompetitionResponse:
    return await competition_service.activate_competition(session, league_id, competition_id)


@router.post("/{competition_id}/complete", response_model=CompetitionResponse)
async def complete_competition(
    league_id: int,
    competition_id: int,
    session: AsyncSession = Depends(get_session),
    _: LeagueMember = Depends(require_league_admin()),
) -> CompetitionResponse:
    return await competition_service.complete_competition(session, league_id, competition_id)


@router.post("/{competition_id}/generate-schedule", response_model=GenerateSchedulePreview)
async def generate_schedule_preview(
    league_id: int,
    competition_id: int,
    session: AsyncSession = Depends(get_session),
    _: LeagueMember = Depends(require_league_admin()),
) -> GenerateSchedulePreview:
    return await competition_service.generate_schedule_preview(session, league_id, competition_id)
