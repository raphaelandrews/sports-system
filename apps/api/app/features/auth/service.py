import secrets
from dataclasses import dataclass
from datetime import UTC, datetime
from urllib.parse import urlencode

import httpx
import jwt
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.shared.core.security import (
    create_access_token,
    create_signed_token,
    create_refresh_token_value,
    decode_signed_token,
    hash_password,
    hash_token,
    refresh_token_expiry,
    verify_password,
)
from app.domain.models.user import RefreshToken, User, UserRole
from app.features.auth import user_repository
from app.features.auth import token_repository as refresh_token_repository
from app.domain.schemas.auth import RegisterRequest, TokenResponse

_OAUTH_STATE_TYPE = "oauth_state"
_OAUTH_RELAY_TYPE = "oauth_relay"
_OAUTH_RELAY_MINUTES = 5


@dataclass(frozen=True)
class OAuthProviderConfig:
    provider: str
    client_id: str
    client_secret: str
    authorize_url: str
    token_url: str
    scopes: str


def _get_provider_config(provider: str) -> OAuthProviderConfig:
    normalized = provider.strip().lower()
    if normalized == "google":
        return OAuthProviderConfig(
            provider="google",
            client_id=settings.GOOGLE_OAUTH_CLIENT_ID,
            client_secret=settings.GOOGLE_OAUTH_CLIENT_SECRET,
            authorize_url="https://accounts.google.com/o/oauth2/v2/auth",
            token_url="https://oauth2.googleapis.com/token",
            scopes="openid email profile",
        )
    if normalized == "github":
        return OAuthProviderConfig(
            provider="github",
            client_id=settings.GITHUB_OAUTH_CLIENT_ID,
            client_secret=settings.GITHUB_OAUTH_CLIENT_SECRET,
            authorize_url="https://github.com/login/oauth/authorize",
            token_url="https://github.com/login/oauth/access_token",
            scopes="read:user user:email",
        )
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND, detail="OAuth provider not found"
    )


def _ensure_provider_configured(config: OAuthProviderConfig) -> None:
    if not config.client_id or not config.client_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"{config.provider.title()} OAuth is not configured",
        )


def _provider_callback_url(provider: str) -> str:
    return f"{settings.BACKEND_PUBLIC_URL}/auth/oauth/{provider}/callback"


def _frontend_callback_url() -> str:
    return f"{settings.FRONTEND_URL}/auth/oauth/callback"


def build_oauth_error_redirect(message: str) -> str:
    return f"{_frontend_callback_url()}?{urlencode({'error': message})}"


async def register(
    session: AsyncSession, data: RegisterRequest
) -> tuple[User, TokenResponse]:
    existing = await user_repository.get_by_email(session, data.email)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
        )

    user = User(
        email=data.email,
        name=data.name,
        hashed_password=hash_password(data.password),
        role=UserRole.ATHLETE,
    )
    await user_repository.create(session, user)
    tokens = await _issue_tokens(session, user)
    return user, tokens


async def login(
    session: AsyncSession, email: str, password: str
) -> tuple[User, TokenResponse]:
    user = await user_repository.get_by_email(session, email)
    if user is None or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Account deactivated"
        )

    tokens = await _issue_tokens(session, user)
    return user, tokens


async def refresh(session: AsyncSession, refresh_token_value: str) -> TokenResponse:
    token_hash = hash_token(refresh_token_value)
    stored = await refresh_token_repository.get_by_hash(session, token_hash)

    if stored is None or stored.revoked_at is not None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked refresh token",
        )
    if stored.expires_at < datetime.now(UTC).replace(tzinfo=None):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired"
        )

    user = await user_repository.get_by_id(session, stored.user_id)
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    await refresh_token_repository.revoke(session, stored)
    return await _issue_tokens(session, user)


async def logout(session: AsyncSession, refresh_token_value: str) -> None:
    token_hash = hash_token(refresh_token_value)
    stored = await refresh_token_repository.get_by_hash(session, token_hash)
    if stored is not None and stored.revoked_at is None:
        await refresh_token_repository.revoke(session, stored)


async def get_oauth_authorize_url(provider: str) -> str:
    config = _get_provider_config(provider)
    _ensure_provider_configured(config)

    state = create_signed_token({"provider": config.provider}, 10, _OAUTH_STATE_TYPE)
    params = {
        "client_id": config.client_id,
        "redirect_uri": _provider_callback_url(config.provider),
        "response_type": "code",
        "scope": config.scopes,
        "state": state,
    }
    if config.provider == "google":
        params["access_type"] = "online"
        params["prompt"] = "select_account"
    return f"{config.authorize_url}?{urlencode(params)}"


async def complete_oauth(
    session: AsyncSession, provider: str, code: str, state: str
) -> str:
    config = _get_provider_config(provider)
    _ensure_provider_configured(config)

    try:
        state_payload = decode_signed_token(state, _OAUTH_STATE_TYPE)
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OAuth state"
        ) from exc

    if state_payload.get("provider") != config.provider:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OAuth state/provider mismatch",
        )

    profile = await _fetch_oauth_profile(config, code)
    user = await _get_or_create_oauth_user(session, profile["email"], profile["name"])

    relay_token = create_signed_token(
        {"sub": str(user.id), "provider": config.provider},
        _OAUTH_RELAY_MINUTES,
        _OAUTH_RELAY_TYPE,
    )
    return f"{_frontend_callback_url()}?{urlencode({'token': relay_token})}"


async def finalize_oauth(session: AsyncSession, relay_token: str) -> TokenResponse:
    try:
        payload = decode_signed_token(relay_token, _OAUTH_RELAY_TYPE)
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid OAuth token"
        ) from exc

    user_id = payload.get("sub")
    if not isinstance(user_id, str) or not user_id.isdigit():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid OAuth token payload",
        )

    user = await user_repository.get_by_id(session, int(user_id))
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    return await _issue_tokens(session, user)


async def _fetch_oauth_profile(
    config: OAuthProviderConfig, code: str
) -> dict[str, str]:
    async with httpx.AsyncClient(timeout=20.0) as client:
        if config.provider == "google":
            token_response = await client.post(
                config.token_url,
                data={
                    "code": code,
                    "client_id": config.client_id,
                    "client_secret": config.client_secret,
                    "redirect_uri": _provider_callback_url(config.provider),
                    "grant_type": "authorization_code",
                },
            )
            token_response.raise_for_status()
            access_token = token_response.json().get("access_token")
            if not isinstance(access_token, str) or not access_token:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Google token exchange failed",
                )

            profile_response = await client.get(
                "https://openidconnect.googleapis.com/v1/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            profile_response.raise_for_status()
            profile = profile_response.json()
            email = str(profile.get("email", "")).strip().lower()
            name = str(profile.get("name", "")).strip()
            if not email:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Google account has no email",
                )
            return {"email": email, "name": name or email.split("@")[0]}

        token_response = await client.post(
            config.token_url,
            headers={"Accept": "application/json"},
            data={
                "client_id": config.client_id,
                "client_secret": config.client_secret,
                "code": code,
                "redirect_uri": _provider_callback_url(config.provider),
            },
        )
        token_response.raise_for_status()
        access_token = token_response.json().get("access_token")
        if not isinstance(access_token, str) or not access_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="GitHub token exchange failed",
            )

        user_response = await client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github+json",
            },
        )
        user_response.raise_for_status()
        user_payload = user_response.json()

        emails_response = await client.get(
            "https://api.github.com/user/emails",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github+json",
            },
        )
        emails_response.raise_for_status()
        emails_payload = emails_response.json()
        email = _resolve_github_email(emails_payload)
        if not email:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="GitHub account has no public or primary email",
            )

        name = str(user_payload.get("name") or user_payload.get("login") or "").strip()
        return {"email": email, "name": name or email.split("@")[0]}


def _resolve_github_email(emails_payload: object) -> str:
    if not isinstance(emails_payload, list):
        return ""
    primary_verified = next(
        (
            item.get("email")
            for item in emails_payload
            if isinstance(item, dict)
            and item.get("primary")
            and item.get("verified")
            and item.get("email")
        ),
        None,
    )
    if isinstance(primary_verified, str):
        return primary_verified.strip().lower()
    verified = next(
        (
            item.get("email")
            for item in emails_payload
            if isinstance(item, dict) and item.get("verified") and item.get("email")
        ),
        None,
    )
    return verified.strip().lower() if isinstance(verified, str) else ""


async def _get_or_create_oauth_user(
    session: AsyncSession, email: str, name: str
) -> User:
    user = await user_repository.get_by_email(session, email)
    if user is not None:
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Account deactivated"
            )
        if not user.is_verified:
            user.is_verified = True
            await user_repository.save(session, user)
        return user

    user = User(
        email=email,
        name=name,
        hashed_password=hash_password(secrets.token_urlsafe(32)),
        role=UserRole.ATHLETE,
        is_verified=True,
    )
    await user_repository.create(session, user)
    return user


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
