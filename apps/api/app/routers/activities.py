import asyncio
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from app.core import sse
from app.database import get_session
from app.schemas.activity import ActivityFeedItem
from app.services import activity_service

router = APIRouter(prefix="/leagues/{league_id}/activities", tags=["activities"])


@router.get("", response_model=list[ActivityFeedItem])
async def list_activity_feed(
    league_id: int,
    limit: int = Query(30, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
) -> list[ActivityFeedItem]:
    return await activity_service.list_feed(session, league_id, limit)


@router.get("/stream")
async def stream_activity_feed(league_id: int, request: Request) -> EventSourceResponse:
    async def generator() -> AsyncGenerator[str, None]:
        q = sse.subscribe_activity_feed(league_id)
        try:
            while True:
                data = await q.get()
                yield data
        except asyncio.CancelledError:
            pass
        finally:
            sse.unsubscribe_activity_feed(league_id, q)

    return EventSourceResponse(generator(), ping=20)
