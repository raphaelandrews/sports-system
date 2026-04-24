import logging

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.competition import Competition, CompetitionStatus
from app.models.event import Event
from app.models.sport import Modality, Sport
from app.repositories import competition_repository
from app.schemas.common import Meta, PaginatedResponse
from app.schemas.competition import (
    CompetitionCreate,
    CompetitionResponse,
    CompetitionUpdate,
    GenerateSchedulePreview,
    SchedulePreviewMatch,
)

logger = logging.getLogger(__name__)

_LOCKED_OR_LATER = {CompetitionStatus.LOCKED, CompetitionStatus.ACTIVE, CompetitionStatus.COMPLETED}
_TRANSITIONS = {
    "publish": (CompetitionStatus.DRAFT, CompetitionStatus.SCHEDULED),
    "lock": (CompetitionStatus.SCHEDULED, CompetitionStatus.LOCKED),
    "activate": (CompetitionStatus.LOCKED, CompetitionStatus.ACTIVE),
    "complete": (CompetitionStatus.ACTIVE, CompetitionStatus.COMPLETED),
}


async def list_competitions(
    session: AsyncSession, league_id: int, page: int, per_page: int
) -> PaginatedResponse[CompetitionResponse]:
    offset = (page - 1) * per_page
    competitions, total = await competition_repository.list_all(session, league_id, offset, per_page)
    return PaginatedResponse(
        data=[CompetitionResponse.model_validate(c) for c in competitions],
        meta=Meta(total=total, page=page, per_page=per_page),
    )


async def get_competition(
    session: AsyncSession, league_id: int, competition_id: int
) -> CompetitionResponse:
    competition = await competition_repository.get_by_id(session, league_id, competition_id)
    if competition is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Competition not found")
    return CompetitionResponse.model_validate(competition)


async def create_competition(
    session: AsyncSession, league_id: int, data: CompetitionCreate
) -> CompetitionResponse:
    competition = Competition(
        league_id=league_id,
        number=data.number,
        start_date=data.start_date,
        end_date=data.end_date,
        sport_focus=data.sport_focus,
    )
    competition = await competition_repository.create(session, competition)
    await session.commit()
    return CompetitionResponse.model_validate(competition)


async def update_competition(
    session: AsyncSession, league_id: int, competition_id: int, data: CompetitionUpdate
) -> CompetitionResponse:
    competition = await _get_or_404(session, league_id, competition_id)
    if competition.status in _LOCKED_OR_LATER:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot edit a competition that is LOCKED or later",
        )
    if data.number is not None:
        competition.number = data.number
    if data.start_date is not None:
        competition.start_date = data.start_date
    if data.end_date is not None:
        competition.end_date = data.end_date
    if data.sport_focus is not None:
        competition.sport_focus = data.sport_focus
    competition = await competition_repository.save(session, competition)
    await session.commit()
    return CompetitionResponse.model_validate(competition)


async def _transition(
    session: AsyncSession, league_id: int, competition_id: int, action: str
) -> CompetitionResponse:
    from_status, to_status = _TRANSITIONS[action]
    competition = await _get_or_404(session, league_id, competition_id)
    if competition.status != from_status:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Competition must be {from_status.value} to {action}; current status is {competition.status.value}",
        )
    competition.status = to_status
    competition = await competition_repository.save(session, competition)
    await session.commit()
    logger.info(
        "competition_transition competition_id=%s action=%s status=%s",
        competition_id, action, to_status.value,
    )
    return CompetitionResponse.model_validate(competition)


async def publish_competition(
    session: AsyncSession, league_id: int, competition_id: int
) -> CompetitionResponse:
    return await _transition(session, league_id, competition_id, "publish")


async def lock_competition(
    session: AsyncSession, league_id: int, competition_id: int
) -> CompetitionResponse:
    result = await _transition(session, league_id, competition_id, "lock")
    from app.services.event_service import lock_and_generate_bracket
    matches_created = await lock_and_generate_bracket(session, competition_id)
    await session.commit()
    logger.info(
        "competition_locked competition_id=%s bracket_matches=%s",
        competition_id, matches_created,
    )
    return result


async def activate_competition(
    session: AsyncSession, league_id: int, competition_id: int
) -> CompetitionResponse:
    return await _transition(session, league_id, competition_id, "activate")


async def complete_competition(
    session: AsyncSession, league_id: int, competition_id: int
) -> CompetitionResponse:
    return await _transition(session, league_id, competition_id, "complete")


async def generate_schedule_preview(
    session: AsyncSession, league_id: int, competition_id: int
) -> GenerateSchedulePreview:
    competition = await _get_or_404(session, league_id, competition_id)

    events_result = await session.execute(
        select(Event).where(Event.competition_id == competition.id)
    )
    events = list(events_result.scalars().all())

    preview_matches: list[SchedulePreviewMatch] = []
    for event in events:
        mod_result = await session.execute(
            select(Modality, Sport)
            .join(Sport, Sport.id == Modality.sport_id)
            .where(Modality.id == event.modality_id)
        )
        row = mod_result.one_or_none()
        if row is None:
            continue
        mod, sport = row
        preview_matches.append(
            SchedulePreviewMatch(
                modality_id=mod.id,
                modality_name=f"{sport.name} — {mod.name}",
                team_a="TBD",
                team_b="TBD",
            )
        )

    return GenerateSchedulePreview(competition_id=competition_id, matches=preview_matches)


async def _get_or_404(session: AsyncSession, league_id: int, competition_id: int) -> Competition:
    competition = await competition_repository.get_by_id(session, league_id, competition_id)
    if competition is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Competition not found")
    return competition
