from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_league_admin, require_league_chief
from app.database import get_session
from app.models.enrollment import EnrollmentStatus
from app.models.league import LeagueMember
from app.repositories.delegation_repository import get_current_delegation_id
from app.schemas.common import PaginatedResponse
from app.schemas.enrollment import EnrollmentCreate, EnrollmentResponse, EnrollmentReview
from app.services import enrollment_service

router = APIRouter(prefix="/leagues/{league_id}/enrollments", tags=["enrollments"])


@router.get("", response_model=PaginatedResponse[EnrollmentResponse])
async def list_enrollments(
    league_id: int,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=500),
    event_id: int | None = Query(None),
    delegation_id: int | None = Query(None),
    enrollment_status: EnrollmentStatus | None = Query(None, alias="status"),
    session: AsyncSession = Depends(get_session),
    membership: LeagueMember = Depends(require_league_chief()),
) -> PaginatedResponse[EnrollmentResponse]:
    filter_delegation_id = delegation_id
    if membership.role != "LEAGUE_ADMIN":
        filter_delegation_id = await get_current_delegation_id(session, membership.user_id, league_id)
    return await enrollment_service.list_enrollments(
        session, league_id, membership.user_id, membership, filter_delegation_id, event_id, enrollment_status, page, per_page
    )


@router.post("/ai-generate", response_model=list[EnrollmentResponse], status_code=status.HTTP_201_CREATED)
async def ai_generate(
    league_id: int,
    session: AsyncSession = Depends(get_session),
    _: LeagueMember = Depends(require_league_admin()),
) -> list[EnrollmentResponse]:
    return await enrollment_service.ai_generate(session, league_id)


@router.post("", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
async def create_enrollment(
    league_id: int,
    data: EnrollmentCreate,
    session: AsyncSession = Depends(get_session),
    membership: LeagueMember = Depends(require_league_chief()),
) -> EnrollmentResponse:
    return await enrollment_service.create_enrollment(session, league_id, membership.user_id, membership, data)


@router.delete("/{enrollment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_enrollment(
    league_id: int,
    enrollment_id: int,
    session: AsyncSession = Depends(get_session),
    membership: LeagueMember = Depends(require_league_chief()),
) -> None:
    await enrollment_service.cancel_enrollment(session, league_id, membership.user_id, membership, enrollment_id)


@router.patch("/{enrollment_id}/review", response_model=EnrollmentResponse)
async def review_enrollment(
    league_id: int,
    enrollment_id: int,
    data: EnrollmentReview,
    session: AsyncSession = Depends(get_session),
    _: LeagueMember = Depends(require_league_admin()),
) -> EnrollmentResponse:
    return await enrollment_service.review_enrollment(session, league_id, enrollment_id, data)
