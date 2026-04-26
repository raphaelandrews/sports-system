from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.user import Notification, NotificationType
from app.features.notifications import repository as notification_repository


async def dispatch(
    session: AsyncSession,
    user_id: int,
    notification_type: NotificationType,
    payload: dict[str, Any],
) -> Notification:
    notif = Notification(user_id=user_id, notification_type=notification_type, payload=payload)
    return await notification_repository.create(session, notif)


async def list_for_user(
    session: AsyncSession, user_id: int, page: int, per_page: int
) -> tuple[list[Notification], int]:
    return await notification_repository.list_for_user(session, user_id, page, per_page)


async def mark_read(session: AsyncSession, notification_id: int, user_id: int) -> Notification:
    from fastapi import HTTPException, status

    notif = await notification_repository.get_by_id(session, notification_id)
    if notif is None or notif.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    notif.read = True
    session.add(notif)
    await session.flush()
    return notif


async def mark_all_read(session: AsyncSession, user_id: int) -> int:
    return await notification_repository.mark_all_read(session, user_id)
