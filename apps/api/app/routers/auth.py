from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.limiter import limiter
from app.database import get_session
from app.schemas.auth import LoginRequest, OAuthFinalizeRequest, RefreshRequest, RegisterRequest, TokenResponse
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


@router.get("/oauth/{provider}/start")
async def oauth_start(provider: str) -> RedirectResponse:
    authorize_url = await auth_service.get_oauth_authorize_url(provider)
    return RedirectResponse(authorize_url, status_code=status.HTTP_302_FOUND)


@router.get("/oauth/{provider}/callback")
async def oauth_callback(
    provider: str,
    code: str = Query(...),
    state: str = Query(...),
    session: AsyncSession = Depends(get_session),
) -> RedirectResponse:
    try:
        redirect_url = await auth_service.complete_oauth(session, provider, code, state)
        await session.commit()
    except Exception as exc:
        await session.rollback()
        detail = exc.detail if isinstance(exc, HTTPException) else "OAuth login failed"
        error_redirect = auth_service.build_oauth_error_redirect(str(detail))
        return RedirectResponse(error_redirect, status_code=status.HTTP_302_FOUND)
    return RedirectResponse(redirect_url, status_code=status.HTTP_302_FOUND)


@router.post("/oauth/finalize", response_model=TokenResponse)
async def oauth_finalize(
    data: OAuthFinalizeRequest,
    session: AsyncSession = Depends(get_session),
) -> TokenResponse:
    tokens = await auth_service.finalize_oauth(session, data.token)
    await session.commit()
    return tokens
