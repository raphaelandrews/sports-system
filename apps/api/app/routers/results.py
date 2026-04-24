import asyncio
from typing import AsyncGenerator, Optional

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from app.core import sse
from app.core.deps import require_admin
from app.database import get_session
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.result import (
    MedalBoardEntry,
    RecordResponse,
    ResultCreate,
    ResultResponse,
    ResultUpdate,
    SportStandingEntry,
)
from app.services import result_service

router = APIRouter(prefix="/results", tags=["results"])


@router.get("", response_model=PaginatedResponse[ResultResponse])
async def list_results(
    competition_id: Optional[int] = Query(None),
    sport_id: Optional[int] = Query(None),
    delegation_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
) -> PaginatedResponse[ResultResponse]:
    return await result_service.list_results(session, competition_id, sport_id, delegation_id, page, per_page)


@router.get("/medal-board", response_model=list[MedalBoardEntry])
async def get_medal_board(
    session: AsyncSession = Depends(get_session),
) -> list[MedalBoardEntry]:
    return await result_service.get_medal_board(session)


@router.get("/medal-board/stream")
async def stream_medal_board(request: Request) -> EventSourceResponse:
    async def generator() -> AsyncGenerator[str, None]:
        q = sse.subscribe_medal_board()
        try:
            while True:
                data = await q.get()
                yield data
        except asyncio.CancelledError:
            pass
        finally:
            sse.unsubscribe_medal_board(q)

    return EventSourceResponse(generator(), ping=20)


@router.get("/medal-board/{sport_id}", response_model=list[MedalBoardEntry])
async def get_medal_board_by_sport(
    sport_id: int,
    session: AsyncSession = Depends(get_session),
) -> list[MedalBoardEntry]:
    return await result_service.get_medal_board_by_sport(session, sport_id)


@router.get("/records", response_model=list[RecordResponse])
async def get_records(
    modality_id: Optional[int] = Query(None),
    session: AsyncSession = Depends(get_session),
) -> list[RecordResponse]:
    return await result_service.get_records(session, modality_id)


@router.get("/standings/{modality_id}", response_model=list[SportStandingEntry])
async def get_standings(
    modality_id: int,
    session: AsyncSession = Depends(get_session),
) -> list[SportStandingEntry]:
    return await result_service.get_standings(session, modality_id)


@router.post("/ai-generate/{event_id}", response_model=list[ResultResponse], status_code=status.HTTP_201_CREATED)
async def ai_generate(
    event_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> list[ResultResponse]:
    return await result_service.ai_generate(session, event_id)


@router.post("", response_model=ResultResponse, status_code=status.HTTP_201_CREATED)
async def create_result(
    data: ResultCreate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> ResultResponse:
    return await result_service.create_result(session, data)


@router.patch("/{result_id}", response_model=ResultResponse)
async def update_result(
    result_id: int,
    data: ResultUpdate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> ResultResponse:
    return await result_service.update_result(session, result_id, data)
