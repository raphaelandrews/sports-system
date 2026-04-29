from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.domain.schemas.search import GlobalSearchResponse
from app.features.search import service as search_service

router = APIRouter(tags=["search"])


@router.get("/leagues/{league_id}/search/global", response_model=GlobalSearchResponse)
async def league_global_search(
    league_id: int,
    q: str = Query("", min_length=0),
    limit: int = Query(8, ge=1, le=20),
    session: AsyncSession = Depends(get_session),
) -> GlobalSearchResponse:
    return await search_service.global_search(
        session, query=q, limit=limit, league_id=league_id
    )


@router.get("/search/global", response_model=GlobalSearchResponse)
async def cross_league_global_search(
    q: str = Query("", min_length=0),
    limit: int = Query(8, ge=1, le=20),
    session: AsyncSession = Depends(get_session),
) -> GlobalSearchResponse:
    return await search_service.global_search(session, q, limit)
