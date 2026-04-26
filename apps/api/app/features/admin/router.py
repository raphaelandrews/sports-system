from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.admin.service import seed_demo_league_data, create_showcase_league
from app.shared.core.deps import require_league_admin, require_superadmin
from app.database import get_session
from app.domain.models.competition import Competition
from app.domain.models.event import Event, Match
from app.domain.models.league import LeagueMember
from app.domain.models.sport import Sport
from app.domain.models.user import User
from app.features.events import simulation as simulation_service

router = APIRouter(prefix="/leagues/{league_id}/admin", tags=["admin"])
superadmin_router = APIRouter(prefix="/admin", tags=["superadmin"])


class ShowcaseLeagueCreate(BaseModel):
    name: str
    mode: str  # "normal" or "speed"
    sports_config: list[int] | None = None


async def _get_match_league_id(session: AsyncSession, match_id: int) -> int | None:
    result = await session.execute(
        select(Competition.league_id)
        .join(Event, Event.competition_id == Competition.id)
        .join(Match, Match.event_id == Event.id)
        .where(Match.id == match_id)
    )
    return result.scalar_one_or_none()


@router.post("/seed", status_code=status.HTTP_201_CREATED)
async def seed(
    league_id: int,
    session: AsyncSession = Depends(get_session),
    _: LeagueMember = Depends(require_league_admin()),
) -> dict[str, object]:
    try:
        seeded = await seed_demo_league_data(session, league_id)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        )

    if seeded is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Demo data already seeded for this league.",
        )

    return seeded


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


@superadmin_router.post("/showcase-leagues", status_code=status.HTTP_201_CREATED)
async def create_showcase_league_endpoint(
    data: ShowcaseLeagueCreate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_superadmin),
) -> dict[str, object]:
    # Validate mode
    mode = data.mode.upper()
    if mode not in ("NORMAL", "SPEED"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mode must be 'normal' or 'speed'",
        )

    # Get sports config
    sports_config = data.sports_config
    if sports_config is None:
        sports_result = await session.execute(
            select(Sport).where(Sport.is_active == True).order_by(Sport.id)
        )
        sports = list(sports_result.scalars().all())
        sports_config = [s.id for s in sports]

    league = await create_showcase_league(
        session=session,
        name=data.name,
        mode=mode,
        sports_config=sports_config,
        created_by_id=user.id,
    )

    # Seed demo data
    seeded = await seed_demo_league_data(session, league.id)
    if seeded is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Demo data already seeded for this league.",
        )

    return {
        "league_id": league.id,
        "name": league.name,
        "slug": league.slug,
        "mode": league.mode.value,
        "seeded": seeded,
    }
