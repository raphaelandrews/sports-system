from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_league_member
from app.database import get_session
from app.models.league import LeagueMember
from app.schemas.search import GlobalSearchResponse
from app.services import search_service

router = APIRouter(prefix="/leagues/{league_id}/search", tags=["search"])


@router.get("/global", response_model=GlobalSearchResponse)
async def global_search(
    league_id: int,
    q: str = Query("", min_length=0),
    limit: int = Query(8, ge=1, le=20),
    session: AsyncSession = Depends(get_session),
    _: LeagueMember = Depends(require_league_member()),
) -> GlobalSearchResponse:
    return await search_service.global_search(session, league_id, q, limit)
