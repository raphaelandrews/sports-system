from datetime import date

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_league_admin
from app.database import get_session
from app.models.league import LeagueMember
from app.schemas.report import AIGenerationResponse, NarrativeResponse
from app.services import narrative_service

router = APIRouter(prefix="/leagues/{league_id}", tags=["narratives"])


@router.get("/narrative/today", response_model=NarrativeResponse | None)
async def get_today(league_id: int, session: AsyncSession = Depends(get_session)) -> NarrativeResponse | None:
    narrative = await narrative_service.get_today(session, league_id)
    if narrative is None:
        return None
    return NarrativeResponse.model_validate(narrative)


@router.get("/narrative/{narrative_date}", response_model=NarrativeResponse)
async def get_for_date(league_id: int, narrative_date: date, session: AsyncSession = Depends(get_session)) -> NarrativeResponse:
    narrative = await narrative_service.get_for_date(session, league_id, narrative_date)
    if narrative is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Narrative not found")
    return NarrativeResponse.model_validate(narrative)


@router.post("/narrative/generate", response_model=NarrativeResponse, status_code=status.HTTP_201_CREATED)
async def generate_narrative(
    league_id: int,
    target_date: date | None = None,
    session: AsyncSession = Depends(get_session),
    _: LeagueMember = Depends(require_league_admin()),
) -> NarrativeResponse:
    narrative = await narrative_service.generate(session, league_id, target_date)
    return NarrativeResponse.model_validate(narrative)


@router.get("/ai/generation-history", response_model=list[AIGenerationResponse])
async def get_generation_history(
    league_id: int,
    session: AsyncSession = Depends(get_session),
    _: LeagueMember = Depends(require_league_admin()),
) -> list[AIGenerationResponse]:
    records = await narrative_service.get_history(session, league_id)
    return [AIGenerationResponse.model_validate(r) for r in records]
