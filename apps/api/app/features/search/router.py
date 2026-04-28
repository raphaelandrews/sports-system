from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.domain.schemas.search import GlobalSearchResponse
from app.features.search import service as search_service

router = APIRouter(prefix="/leagues/{league_id}/search", tags=["search"])


@router.get("/global", response_model=GlobalSearchResponse)
async def global_search(
    league_id: int,
    q: str = Query("", min_length=0),
    limit: int = Query(8, ge=1, le=20),
    session: AsyncSession = Depends(get_session),
) -> GlobalSearchResponse:
    return await search_service.global_search(session, league_id, q, limit)
