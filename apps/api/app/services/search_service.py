from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories import athlete_repository, delegation_repository, event_repository
from app.schemas.search import (
    GlobalSearchAthleteItem,
    GlobalSearchDelegationItem,
    GlobalSearchEventItem,
    GlobalSearchResponse,
)


async def global_search(
    session: AsyncSession,
    current_user: User,
    query: str,
    limit: int,
) -> GlobalSearchResponse:
    normalized = query.strip()
    if len(normalized) < 2:
        return GlobalSearchResponse(query=normalized, athletes=[], delegations=[], events=[])

    athletes = await athlete_repository.search(session, normalized, limit)
    delegations = await delegation_repository.search(session, normalized, limit)
    events = await event_repository.search(session, normalized, limit)

    return GlobalSearchResponse(
        query=normalized,
        athletes=[GlobalSearchAthleteItem.model_validate(item) for item in athletes],
        delegations=[GlobalSearchDelegationItem.model_validate(item) for item in delegations],
        events=[GlobalSearchEventItem(**item) for item in events],
    )
