from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token_value,
    hash_password,
    hash_token,
    refresh_token_expiry,
    verify_password,
)
from app.models.user import RefreshToken, User, UserRole
from app.repositories import refresh_token_repository, user_repository
from app.schemas.auth import RegisterRequest, TokenResponse


async def register(session: AsyncSession, data: RegisterRequest) -> tuple[User, TokenResponse]:
    existing = await user_repository.get_by_email(session, data.email)
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=data.email,
        name=data.name,
        hashed_password=hash_password(data.password),
        role=UserRole.ATHLETE,
    )
    await user_repository.create(session, user)
    tokens = await _issue_tokens(session, user)
    return user, tokens


async def login(session: AsyncSession, email: str, password: str) -> tuple[User, TokenResponse]:
    user = await user_repository.get_by_email(session, email)
    if user is None or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account deactivated")

    tokens = await _issue_tokens(session, user)
    return user, tokens


async def refresh(session: AsyncSession, refresh_token_value: str) -> TokenResponse:
    token_hash = hash_token(refresh_token_value)
    stored = await refresh_token_repository.get_by_hash(session, token_hash)

    if stored is None or stored.revoked_at is not None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or revoked refresh token")
    if stored.expires_at < datetime.now(UTC).replace(tzinfo=None):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired")

    user = await user_repository.get_by_id(session, stored.user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    await refresh_token_repository.revoke(session, stored)
    return await _issue_tokens(session, user)


async def logout(session: AsyncSession, refresh_token_value: str) -> None:
    token_hash = hash_token(refresh_token_value)
    stored = await refresh_token_repository.get_by_hash(session, token_hash)
    if stored is not None and stored.revoked_at is None:
        await refresh_token_repository.revoke(session, stored)


async def _issue_tokens(session: AsyncSession, user: User) -> TokenResponse:
    access_token = create_access_token(user.id, user.role.value)  # type: ignore[arg-type]
    plain_refresh = create_refresh_token_value()
    stored = RefreshToken(
        user_id=user.id,  # type: ignore[arg-type]
        token_hash=hash_token(plain_refresh),
        expires_at=refresh_token_expiry(),
    )
    await refresh_token_repository.create(session, stored)
    return TokenResponse(access_token=access_token, refresh_token=plain_refresh)
