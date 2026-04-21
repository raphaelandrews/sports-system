from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.limiter import limiter
from app.database import get_session
from app.schemas.auth import LoginRequest, RefreshRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserResponse
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(request: Request, data: RegisterRequest, session: AsyncSession = Depends(get_session)) -> TokenResponse:
    _, tokens = await auth_service.register(session, data)
    await session.commit()
    return tokens


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(request: Request, data: LoginRequest, session: AsyncSession = Depends(get_session)) -> TokenResponse:
    _, tokens = await auth_service.login(session, data.email, data.password)
    await session.commit()
    return tokens


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest, session: AsyncSession = Depends(get_session)) -> TokenResponse:
    tokens = await auth_service.refresh(session, data.refresh_token)
    await session.commit()
    return tokens


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(data: RefreshRequest, session: AsyncSession = Depends(get_session)) -> None:
    await auth_service.logout(session, data.refresh_token)
    await session.commit()
