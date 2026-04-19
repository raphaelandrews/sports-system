import logging

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event import Event
from app.models.sport import Modality, Sport
from app.models.week import CompetitionWeek, WeekStatus
from app.repositories import week_repository
from app.schemas.common import Meta, PaginatedResponse
from app.schemas.week import (
    GenerateSchedulePreview,
    SchedulePreviewMatch,
    WeekCreate,
    WeekResponse,
    WeekUpdate,
)

logger = logging.getLogger(__name__)

_LOCKED_OR_LATER = {WeekStatus.LOCKED, WeekStatus.ACTIVE, WeekStatus.COMPLETED}
_TRANSITIONS = {
    "publish": (WeekStatus.DRAFT, WeekStatus.SCHEDULED),
    "lock": (WeekStatus.SCHEDULED, WeekStatus.LOCKED),
    "activate": (WeekStatus.LOCKED, WeekStatus.ACTIVE),
    "complete": (WeekStatus.ACTIVE, WeekStatus.COMPLETED),
}


async def list_weeks(
    session: AsyncSession, page: int, per_page: int
) -> PaginatedResponse[WeekResponse]:
    offset = (page - 1) * per_page
    weeks, total = await week_repository.list_all(session, offset, per_page)
    return PaginatedResponse(
        data=[WeekResponse.model_validate(w) for w in weeks],
        meta=Meta(total=total, page=page, per_page=per_page),
    )


async def get_week(session: AsyncSession, week_id: int) -> WeekResponse:
    week = await week_repository.get_by_id(session, week_id)
    if week is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Week not found")
    return WeekResponse.model_validate(week)


async def create_week(session: AsyncSession, data: WeekCreate) -> WeekResponse:
    week = CompetitionWeek(
        week_number=data.week_number,
        start_date=data.start_date,
        end_date=data.end_date,
        sport_focus=data.sport_focus,
    )
    week = await week_repository.create(session, week)
    await session.commit()
    return WeekResponse.model_validate(week)


async def update_week(session: AsyncSession, week_id: int, data: WeekUpdate) -> WeekResponse:
    week = await _get_or_404(session, week_id)
    if week.status in _LOCKED_OR_LATER:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot edit a week that is LOCKED or later",
        )
    if data.week_number is not None:
        week.week_number = data.week_number
    if data.start_date is not None:
        week.start_date = data.start_date
    if data.end_date is not None:
        week.end_date = data.end_date
    if data.sport_focus is not None:
        week.sport_focus = data.sport_focus
    week = await week_repository.save(session, week)
    await session.commit()
    return WeekResponse.model_validate(week)


async def _transition(session: AsyncSession, week_id: int, action: str) -> WeekResponse:
    from_status, to_status = _TRANSITIONS[action]
    week = await _get_or_404(session, week_id)
    if week.status != from_status:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Week must be {from_status.value} to {action}; current status is {week.status.value}",
        )
    week.status = to_status
    week = await week_repository.save(session, week)
    await session.commit()
    logger.info("week_transition week_id=%s action=%s status=%s", week_id, action, to_status.value)
    return WeekResponse.model_validate(week)


async def publish_week(session: AsyncSession, week_id: int) -> WeekResponse:
    return await _transition(session, week_id, "publish")


async def lock_week(session: AsyncSession, week_id: int) -> WeekResponse:
    result = await _transition(session, week_id, "lock")
    # Phase 7: bracket_service.generate(week_id, session)
    return result


async def activate_week(session: AsyncSession, week_id: int) -> WeekResponse:
    return await _transition(session, week_id, "activate")


async def complete_week(session: AsyncSession, week_id: int) -> WeekResponse:
    return await _transition(session, week_id, "complete")


async def generate_schedule_preview(
    session: AsyncSession, week_id: int
) -> GenerateSchedulePreview:
    week = await _get_or_404(session, week_id)

    events_result = await session.execute(
        select(Event).where(Event.week_id == week.id)
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

    return GenerateSchedulePreview(week_id=week_id, matches=preview_matches)


async def _get_or_404(session: AsyncSession, week_id: int) -> CompetitionWeek:
    week = await week_repository.get_by_id(session, week_id)
    if week is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Week not found")
    return week
