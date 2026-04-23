from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.database import get_session
from app.models.user import User
from app.schemas.search import GlobalSearchResponse
from app.services import search_service

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/global", response_model=GlobalSearchResponse)
async def global_search(
    q: str = Query("", min_length=0),
    limit: int = Query(8, ge=1, le=20),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> GlobalSearchResponse:
    return await search_service.global_search(session, current_user, q, limit)
