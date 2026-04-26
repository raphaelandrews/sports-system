import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_session
from app.domain.models.league import LeagueMember, LeagueMemberRole
from app.domain.models.user import User, UserRole
from app.features.leagues import service as league_service

_bearer = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    session: AsyncSession = Depends(get_session),
) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type"
        )

    user_id = int(payload["sub"])
    user = await session.get(User, user_id)
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    return user


def require_role(*roles: UserRole):
    async def _check(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions"
            )
        return user

    return _check


require_superadmin = require_role(UserRole.SUPERADMIN, UserRole.ADMIN)
require_admin = require_superadmin
require_chief_or_admin = require_role(
    UserRole.CHIEF, UserRole.ADMIN, UserRole.SUPERADMIN
)


def get_league_member():
    async def _get_league_member(
        league_id: int,
        user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session),
    ) -> LeagueMember:
        return await league_service.get_member_or_403(session, league_id, user)

    return _get_league_member


def require_league_member():
    return get_league_member()


def require_league_admin():
    async def _require_league_admin(
        league_id: int,
        user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session),
    ) -> LeagueMember:
        return await league_service.require_league_admin(session, league_id, user)

    return _require_league_admin


def require_league_chief():
    async def _require_league_chief(
        member: LeagueMember = Depends(get_league_member()),
    ) -> LeagueMember:
        if member.role not in {LeagueMemberRole.LEAGUE_ADMIN, LeagueMemberRole.CHIEF}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="League chief role required",
            )
        return member

    return _require_league_chief
