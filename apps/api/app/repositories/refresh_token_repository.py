from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import RefreshToken


async def create(session: AsyncSession, token: RefreshToken) -> RefreshToken:
    session.add(token)
    await session.flush()
    return token


async def get_by_hash(session: AsyncSession, token_hash: str) -> RefreshToken | None:
    result = await session.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    return result.scalar_one_or_none()


async def revoke(session: AsyncSession, token: RefreshToken) -> None:
    token.revoked_at = datetime.now(UTC)
    session.add(token)
    await session.flush()
