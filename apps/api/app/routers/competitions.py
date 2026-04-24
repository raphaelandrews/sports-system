from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_admin
from app.database import get_session
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.competition import (
    CompetitionCreate,
    CompetitionResponse,
    CompetitionUpdate,
    GenerateSchedulePreview,
)
from app.services import competition_service

router = APIRouter(prefix="/competitions", tags=["competitions"])


@router.get("", response_model=PaginatedResponse[CompetitionResponse])
async def list_competitions(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
) -> PaginatedResponse[CompetitionResponse]:
    return await competition_service.list_competitions(session, page, per_page)


@router.post("", response_model=CompetitionResponse, status_code=status.HTTP_201_CREATED)
async def create_competition(
    data: CompetitionCreate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> CompetitionResponse:
    return await competition_service.create_competition(session, data)


@router.get("/{competition_id}", response_model=CompetitionResponse)
async def get_competition(
    competition_id: int,
    session: AsyncSession = Depends(get_session),
) -> CompetitionResponse:
    return await competition_service.get_competition(session, competition_id)


@router.patch("/{competition_id}", response_model=CompetitionResponse)
async def update_competition(
    competition_id: int,
    data: CompetitionUpdate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> CompetitionResponse:
    return await competition_service.update_competition(session, competition_id, data)


@router.post("/{competition_id}/publish", response_model=CompetitionResponse)
async def publish_competition(
    competition_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> CompetitionResponse:
    return await competition_service.publish_competition(session, competition_id)


@router.post("/{competition_id}/lock", response_model=CompetitionResponse)
async def lock_competition(
    competition_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> CompetitionResponse:
    return await competition_service.lock_competition(session, competition_id)


@router.post("/{competition_id}/activate", response_model=CompetitionResponse)
async def activate_competition(
    competition_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> CompetitionResponse:
    return await competition_service.activate_competition(session, competition_id)


@router.post("/{competition_id}/complete", response_model=CompetitionResponse)
async def complete_competition(
    competition_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> CompetitionResponse:
    return await competition_service.complete_competition(session, competition_id)


@router.post("/{competition_id}/generate-schedule", response_model=GenerateSchedulePreview)
async def generate_schedule_preview(
    competition_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> GenerateSchedulePreview:
    return await competition_service.generate_schedule_preview(session, competition_id)
