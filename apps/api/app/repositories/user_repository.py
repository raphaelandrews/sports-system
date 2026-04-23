from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


async def get_by_id(session: AsyncSession, user_id: int) -> User | None:
    return await session.get(User, user_id)


async def get_by_email(session: AsyncSession, email: str) -> User | None:
    result = await session.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def create(session: AsyncSession, user: User) -> User:
    session.add(user)
    await session.flush()
    return user


async def save(session: AsyncSession, user: User) -> User:
    session.add(user)
    await session.flush()
    return user


async def search(
    session: AsyncSession,
    query: str,
    limit: int = 10,
) -> list[User]:
    pattern = f"%{query.strip()}%"
    result = await session.execute(
        select(User)
        .where(
            User.is_active == True,  # noqa: E712
            or_(User.name.ilike(pattern), User.email.ilike(pattern)),
        )
        .order_by(User.name.asc())
        .limit(limit)
    )
    return list(result.scalars().all())
