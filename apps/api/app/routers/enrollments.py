from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, require_admin, require_chief_or_admin
from app.database import get_session
from app.models.enrollment import EnrollmentStatus
from app.models.user import User, UserRole
from app.repositories.delegation_repository import get_current_delegation_id
from app.schemas.common import PaginatedResponse
from app.schemas.enrollment import EnrollmentCreate, EnrollmentResponse, EnrollmentReview
from app.services import enrollment_service

router = APIRouter(prefix="/enrollments", tags=["enrollments"])


@router.get("", response_model=PaginatedResponse[EnrollmentResponse])
async def list_enrollments(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=500),
    event_id: int | None = Query(None),
    delegation_id: int | None = Query(None),
    enrollment_status: EnrollmentStatus | None = Query(None, alias="status"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_chief_or_admin),
) -> PaginatedResponse[EnrollmentResponse]:
    filter_delegation_id = delegation_id
    if current_user.role == UserRole.CHIEF:
        filter_delegation_id = await get_current_delegation_id(session, current_user.id)
    return await enrollment_service.list_enrollments(
        session, current_user, filter_delegation_id, event_id, enrollment_status, page, per_page
    )


@router.post("/ai-generate", response_model=list[EnrollmentResponse], status_code=status.HTTP_201_CREATED)
async def ai_generate(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> list[EnrollmentResponse]:
    return await enrollment_service.ai_generate(session)


@router.post("", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
async def create_enrollment(
    data: EnrollmentCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_chief_or_admin),
) -> EnrollmentResponse:
    return await enrollment_service.create_enrollment(session, current_user, data)


@router.delete("/{enrollment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_enrollment(
    enrollment_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_chief_or_admin),
) -> None:
    await enrollment_service.cancel_enrollment(session, current_user, enrollment_id)


@router.patch("/{enrollment_id}/review", response_model=EnrollmentResponse)
async def review_enrollment(
    enrollment_id: int,
    data: EnrollmentReview,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> EnrollmentResponse:
    return await enrollment_service.review_enrollment(session, enrollment_id, data)
