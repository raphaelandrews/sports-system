from sqlalchemy.ext.asyncio import AsyncSession

from app.features.athletes import repository as athlete_repository
from app.features.delegations import repository as delegation_repository
from app.features.events import repository as event_repository
from app.domain.schemas.search import (
    GlobalSearchAthleteItem,
    GlobalSearchDelegationItem,
    GlobalSearchEventItem,
    GlobalSearchResponse,
)


async def global_search(
    session: AsyncSession,
    query: str,
    limit: int,
    league_id: int | None = None,
) -> GlobalSearchResponse:
    normalized = query.strip()
    if len(normalized) < 2:
        return GlobalSearchResponse(
            query=normalized, athletes=[], delegations=[], events=[]
        )

    athletes = await athlete_repository.search(session, normalized, limit, league_id)
    delegations = await delegation_repository.search(
        session, normalized, limit, league_id
    )
    events = await event_repository.search(session, normalized, limit, league_id)

    return GlobalSearchResponse(
        query=normalized,
        athletes=[GlobalSearchAthleteItem.model_validate(item) for item in athletes],
        delegations=[
            GlobalSearchDelegationItem.model_validate(item) for item in delegations
        ],
        events=[GlobalSearchEventItem(**item) for item in events],
    )
