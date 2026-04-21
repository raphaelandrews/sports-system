from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_admin
from app.database import get_session
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.week import GenerateSchedulePreview, WeekCreate, WeekResponse, WeekUpdate
from app.services import week_service

router = APIRouter(prefix="/weeks", tags=["weeks"])


@router.get("", response_model=PaginatedResponse[WeekResponse])
async def list_weeks(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
) -> PaginatedResponse[WeekResponse]:
    return await week_service.list_weeks(session, page, per_page)


@router.post("", response_model=WeekResponse, status_code=status.HTTP_201_CREATED)
async def create_week(
    data: WeekCreate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> WeekResponse:
    return await week_service.create_week(session, data)


@router.get("/{week_id}", response_model=WeekResponse)
async def get_week(
    week_id: int,
    session: AsyncSession = Depends(get_session),
) -> WeekResponse:
    return await week_service.get_week(session, week_id)


@router.patch("/{week_id}", response_model=WeekResponse)
async def update_week(
    week_id: int,
    data: WeekUpdate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> WeekResponse:
    return await week_service.update_week(session, week_id, data)


@router.post("/{week_id}/publish", response_model=WeekResponse)
async def publish_week(
    week_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> WeekResponse:
    return await week_service.publish_week(session, week_id)


@router.post("/{week_id}/lock", response_model=WeekResponse)
async def lock_week(
    week_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> WeekResponse:
    return await week_service.lock_week(session, week_id)


@router.post("/{week_id}/activate", response_model=WeekResponse)
async def activate_week(
    week_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> WeekResponse:
    return await week_service.activate_week(session, week_id)


@router.post("/{week_id}/complete", response_model=WeekResponse)
async def complete_week(
    week_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> WeekResponse:
    return await week_service.complete_week(session, week_id)


@router.post("/{week_id}/generate-schedule", response_model=GenerateSchedulePreview)
async def generate_schedule_preview(
    week_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> GenerateSchedulePreview:
    return await week_service.generate_schedule_preview(session, week_id)
