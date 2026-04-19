from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import Notification


async def create(session: AsyncSession, notification: Notification) -> Notification:
    session.add(notification)
    await session.flush()
    return notification


async def list_for_user(
    session: AsyncSession, user_id: int, page: int = 1, per_page: int = 20
) -> tuple[list[Notification], int]:
    offset = (page - 1) * per_page
    count_result = await session.execute(
        select(func.count()).select_from(Notification).where(Notification.user_id == user_id)
    )
    total = count_result.scalar_one()
    result = await session.execute(
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .offset(offset)
        .limit(per_page)
    )
    return result.scalars().all(), total  # type: ignore[return-value]


async def get_by_id(session: AsyncSession, notification_id: int) -> Notification | None:
    return await session.get(Notification, notification_id)


async def mark_all_read(session: AsyncSession, user_id: int) -> int:
    result = await session.execute(
        update(Notification)
        .where(Notification.user_id == user_id, Notification.read == False)  # noqa: E712
        .values(read=True)
    )
    return result.rowcount
