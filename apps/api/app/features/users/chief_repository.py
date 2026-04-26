from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.user import ChiefRequest, ChiefRequestStatus


async def create(session: AsyncSession, req: ChiefRequest) -> ChiefRequest:
    session.add(req)
    await session.flush()
    return req


async def get_by_id(session: AsyncSession, request_id: int) -> ChiefRequest | None:
    return await session.get(ChiefRequest, request_id)


async def list_pending(
    session: AsyncSession, page: int = 1, per_page: int = 20
) -> tuple[list[ChiefRequest], int]:
    offset = (page - 1) * per_page
    count_result = await session.execute(
        select(func.count()).select_from(ChiefRequest).where(ChiefRequest.status == ChiefRequestStatus.PENDING)
    )
    total = count_result.scalar_one()
    result = await session.execute(
        select(ChiefRequest)
        .where(ChiefRequest.status == ChiefRequestStatus.PENDING)
        .order_by(ChiefRequest.created_at)
        .offset(offset)
        .limit(per_page)
    )
    return result.scalars().all(), total  # type: ignore[return-value]


async def get_by_user_id(session: AsyncSession, user_id: int) -> ChiefRequest | None:
    result = await session.execute(
        select(ChiefRequest)
        .where(ChiefRequest.user_id == user_id)
        .order_by(ChiefRequest.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def save(session: AsyncSession, req: ChiefRequest) -> ChiefRequest:
    session.add(req)
    await session.flush()
    return req
