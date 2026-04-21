import asyncio
import json
from datetime import date
from typing import AsyncGenerator, Optional

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from app.core import sse
from app.core.deps import get_current_user, require_admin
from app.database import get_session
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.event import (
    EventCreate,
    EventDetailResponse,
    EventResponse,
    EventUpdate,
    MatchDetailResponse,
    MatchEventCreate,
    MatchEventResponse,
    MatchResponse,
)
from app.services import event_service

events_router = APIRouter(prefix="/events", tags=["events"])
matches_router = APIRouter(prefix="/matches", tags=["matches"])


# --- Events ---

@events_router.get("", response_model=PaginatedResponse[EventResponse])
async def list_events(
    week_id: Optional[int] = Query(None),
    sport_id: Optional[int] = Query(None),
    event_date: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
) -> PaginatedResponse[EventResponse]:
    return await event_service.list_events(session, week_id, sport_id, event_date, page, per_page)


@events_router.post("/ai-generate", response_model=list[EventResponse], status_code=status.HTTP_201_CREATED)
async def ai_generate_schedule(
    week_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> list[EventResponse]:
    return await event_service.ai_generate_schedule(session, week_id)


@events_router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    data: EventCreate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> EventResponse:
    return await event_service.create_event(session, data)


@events_router.get("/{event_id}", response_model=EventDetailResponse)
async def get_event(
    event_id: int,
    session: AsyncSession = Depends(get_session),
) -> EventDetailResponse:
    return await event_service.get_event(session, event_id)


@events_router.patch("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: int,
    data: EventUpdate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> EventResponse:
    return await event_service.update_event(session, event_id, data)


@events_router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_event(
    event_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> None:
    await event_service.cancel_event(session, event_id)


# --- Matches ---

@matches_router.get("/{match_id}", response_model=MatchDetailResponse)
async def get_match(
    match_id: int,
    session: AsyncSession = Depends(get_session),
) -> MatchDetailResponse:
    return await event_service.get_match(session, match_id)


@matches_router.post("/{match_id}/events", response_model=MatchEventResponse, status_code=status.HTTP_201_CREATED)
async def add_match_event(
    match_id: int,
    data: MatchEventCreate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> MatchEventResponse:
    return await event_service.add_match_event(session, match_id, data)


@matches_router.get("/{match_id}/events", response_model=list[MatchEventResponse])
async def list_match_events(
    match_id: int,
    session: AsyncSession = Depends(get_session),
) -> list[MatchEventResponse]:
    return await event_service.list_match_events(session, match_id)


@matches_router.get("/{match_id}/stream")
async def stream_match(request: Request, match_id: int) -> EventSourceResponse:
    async def event_generator() -> AsyncGenerator[str, None]:
        q = sse.subscribe(match_id)
        try:
            while True:
                data = await q.get()
                yield data
        except asyncio.CancelledError:
            pass
        finally:
            sse.unsubscribe(match_id, q)

    return EventSourceResponse(event_generator(), ping=20)


@matches_router.post("/{match_id}/start", response_model=MatchResponse)
async def start_match(
    match_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> MatchResponse:
    return await event_service.start_match(session, match_id)


@matches_router.post("/{match_id}/finish", response_model=MatchResponse)
async def finish_match(
    match_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> MatchResponse:
    return await event_service.finish_match(session, match_id)
