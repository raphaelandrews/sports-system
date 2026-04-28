from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.shared.core.deps import require_league_admin
from app.database import get_session
from app.domain.models.competition import Competition
from app.domain.models.event import Event, Match
from app.domain.models.league import LeagueMember
from app.features.events import simulation as simulation_service

router = APIRouter(prefix="/leagues/{league_id}/admin", tags=["admin"])
superadmin_router = APIRouter(prefix="/admin", tags=["superadmin"])


async def _get_match_league_id(session: AsyncSession, match_id: int) -> int | None:
    result = await session.execute(
        select(Competition.league_id)
        .join(Event, Event.competition_id == Competition.id)
        .join(Match, Match.event_id == Event.id)
        .where(Match.id == match_id)
    )
    return result.scalar_one_or_none()


@router.post("/simulate/match/{match_id}", status_code=status.HTTP_200_OK)
async def simulate_match(
    league_id: int,
    match_id: int,
    session: AsyncSession = Depends(get_session),
    _: LeagueMember = Depends(require_league_admin()),
) -> dict[str, object]:
    match_league_id = await _get_match_league_id(session, match_id)
    if match_league_id is None or match_league_id != league_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Match not found"
        )

    try:
        await simulation_service.simulate_match(session, match_id)
        await session.commit()
        return {"simulated": True, "match_id": match_id, "league_id": league_id}
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
