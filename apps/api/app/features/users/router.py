from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.shared.core.deps import get_current_user, require_admin, require_chief_or_admin
from app.database import get_session
from app.domain.models.user import User, UserRole
from app.domain.schemas.common import Meta, PaginatedResponse
from app.domain.schemas.notification import NotificationResponse
from app.domain.schemas.user import (
    ChiefRequestCreate,
    ChiefRequestResponse,
    ChiefRequestReview,
    UserSearchResponse,
    UserResponse,
    UserUpdate,
)
from app.features.notifications import service as notification_service
from app.features.users import service as user_service
from app.shared.core.storage import delete_file, upload_file

router = APIRouter(tags=["users"])


@router.get("/users/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.patch("/users/me", response_model=UserResponse)
async def update_me(
    data: UserUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> User:
    user = await user_service.update_me(session, current_user, data)
    await session.commit()
    return user


@router.post("/upload/avatar", response_model=dict[str, str])
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
) -> dict[str, str]:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    content = await file.read()
    if len(content) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 2MB")
    try:
        url = upload_file(content, file.content_type, folder="avatars")
    except Exception as exc:
        import logging

        logging.getLogger(__name__).exception("Upload failed")
        raise HTTPException(status_code=500, detail=f"Upload failed: {exc}")
    return {"url": url}


@router.get("/users/search", response_model=list[UserSearchResponse])
async def search_users(
    q: str = Query(..., min_length=2),
    limit: int = Query(10, ge=1, le=20),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> list[UserSearchResponse]:
    users = await user_service.search_users(session, current_user, q, limit)
    return [UserSearchResponse.model_validate(user) for user in users]


@router.get("/requests/chief/me", response_model=ChiefRequestResponse)
async def get_my_chief_request(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> object:
    req = await user_service.get_my_request(session, current_user.id)
    if req is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No chief request found"
        )
    return req


@router.post(
    "/requests/chief",
    response_model=ChiefRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
async def request_chief(
    data: ChiefRequestCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> object:
    req = await user_service.request_chief(session, current_user, data)
    await session.commit()
    await session.refresh(req)
    return req


@router.get("/admin/requests", response_model=PaginatedResponse[ChiefRequestResponse])
async def list_requests(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> PaginatedResponse[ChiefRequestResponse]:
    requests, total = await user_service.list_pending_requests(session, page, per_page)
    return PaginatedResponse(
        data=[ChiefRequestResponse.model_validate(r) for r in requests],
        meta=Meta(total=total, page=page, per_page=per_page),
    )


@router.patch("/admin/requests/{request_id}", response_model=ChiefRequestResponse)
async def review_request(
    request_id: int,
    data: ChiefRequestReview,
    session: AsyncSession = Depends(get_session),
    admin: User = Depends(require_admin),
) -> object:
    req = await user_service.review_request(session, request_id, data, admin)
    await session.commit()
    await session.refresh(req)
    return req


@router.get(
    "/users/{user_id}/notifications",
    response_model=PaginatedResponse[NotificationResponse],
)
async def get_notifications(
    user_id: int,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> PaginatedResponse[NotificationResponse]:
    if current_user.id != user_id and current_user.role != UserRole.ADMIN:
        from fastapi import HTTPException

        raise HTTPException(status_code=403, detail="Access denied")

    notifications, total = await notification_service.list_for_user(
        session, user_id, page, per_page
    )
    return PaginatedResponse(
        data=[NotificationResponse.model_validate(n) for n in notifications],
        meta=Meta(total=total, page=page, per_page=per_page),
    )


@router.patch("/users/notifications/read-all", status_code=status.HTTP_200_OK)
async def mark_all_notifications_read(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> dict[str, int]:
    count = await notification_service.mark_all_read(session, current_user.id)
    await session.commit()
    return {"updated": count}


@router.patch(
    "/users/notifications/{notification_id}/read", response_model=NotificationResponse
)
async def mark_notification_read(
    notification_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> object:
    notif = await notification_service.mark_read(
        session, notification_id, current_user.id
    )
    await session.commit()
    return notif
