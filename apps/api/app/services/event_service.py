import logging
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import sse
from app.models.event import Event, Match, MatchEvent, MatchStatus
from app.models.competition import CompetitionStatus
from app.repositories import competition_repository, event_repository
from app.schemas.common import Meta, PaginatedResponse
from app.schemas.activity import ActivityFeedItem, ActivityFeedItemType
from app.schemas.event import (
    EventCreate,
    EventDetailResponse,
    EventResponse,
    EventUpdate,
    MatchDetailResponse,
    MatchEventCreate,
    MatchEventResponse,
    MatchParticipantResponse,
    MatchResponse,
)
from app.services import bracket_service, schedule_service

logger = logging.getLogger(__name__)

_LOCKED_OR_LATER = {CompetitionStatus.LOCKED, CompetitionStatus.ACTIVE, CompetitionStatus.COMPLETED}


async def list_events(
    session: AsyncSession,
    competition_id: int | None,
    sport_id: int | None,
    event_date,
    page: int,
    per_page: int,
) -> PaginatedResponse[EventResponse]:
    offset = (page - 1) * per_page
    events, total = await event_repository.list_events(session, competition_id, sport_id, event_date, offset, per_page)
    return PaginatedResponse(
        data=[EventResponse.model_validate(e) for e in events],
        meta=Meta(total=total, page=page, per_page=per_page),
    )


async def get_event(session: AsyncSession, event_id: int) -> EventDetailResponse:
    event = await _get_event_or_404(session, event_id)
    matches = await event_repository.get_matches_for_event(session, event_id)
    resp = EventDetailResponse.model_validate(event)
    resp.matches = [MatchResponse.model_validate(m) for m in matches]
    return resp


async def create_event(session: AsyncSession, data: EventCreate) -> EventResponse:
    competition = await competition_repository.get_by_id(session, data.competition_id)
    if competition is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Competition not found")
    event = Event(
        competition_id=data.competition_id,
        modality_id=data.modality_id,
        event_date=data.event_date,
        start_time=data.start_time,
        venue=data.venue,
        phase=data.phase,
    )
    event = await event_repository.create_event(session, event)
    await session.commit()
    return EventResponse.model_validate(event)


async def update_event(session: AsyncSession, event_id: int, data: EventUpdate) -> EventResponse:
    event = await _get_event_or_404(session, event_id)
    competition = await competition_repository.get_by_id(session, event.competition_id)
    if competition and competition.status in _LOCKED_OR_LATER:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot edit event in a LOCKED or later competition",
        )
    if data.event_date is not None:
        event.event_date = data.event_date
    if data.start_time is not None:
        event.start_time = data.start_time
    if data.venue is not None:
        event.venue = data.venue
    if data.phase is not None:
        event.phase = data.phase
    if data.status is not None:
        event.status = data.status
    event = await event_repository.save_event(session, event)
    await session.commit()
    return EventResponse.model_validate(event)


async def cancel_event(session: AsyncSession, event_id: int) -> None:
    from app.models.event import EventStatus
    event = await _get_event_or_404(session, event_id)
    competition = await competition_repository.get_by_id(session, event.competition_id)
    if competition and competition.status in _LOCKED_OR_LATER:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot cancel event in a LOCKED or later competition",
        )
    event.status = EventStatus.CANCELLED
    await event_repository.save_event(session, event)
    await session.commit()


async def get_match(session: AsyncSession, match_id: int) -> MatchDetailResponse:
    match = await _get_match_or_404(session, match_id)
    participants = await event_repository.get_match_participants(session, match_id)
    events = await event_repository.get_match_events(session, match_id)
    resp = MatchDetailResponse.model_validate(match)
    resp.participants = [MatchParticipantResponse.model_validate(p) for p in participants]
    resp.events = [MatchEventResponse.model_validate(e) for e in events]
    return resp


async def add_match_event(
    session: AsyncSession, match_id: int, data: MatchEventCreate
) -> MatchEventResponse:
    match = await _get_match_or_404(session, match_id)
    if match.status not in {MatchStatus.IN_PROGRESS, MatchStatus.SCHEDULED}:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Match is not active",
        )
    match_event = MatchEvent(
        match_id=match_id,
        minute=data.minute,
        event_type=data.event_type,
        athlete_id=data.athlete_id,
        delegation_id_at_time=data.delegation_id_at_time,
        value_json=data.value_json,
    )
    match_event = await event_repository.create_match_event(session, match_event)
    await session.commit()

    payload = {
        "type": "match_event",
        "match_id": match_id,
        "event_type": data.event_type.value,
        "minute": data.minute,
        "athlete_id": data.athlete_id,
        "delegation_id_at_time": data.delegation_id_at_time,
    }
    await sse.broadcast(match_id, payload)
    await sse.broadcast_activity_feed(
        ActivityFeedItem(
            id=f"match-event-{match_event.id}",
            item_type=ActivityFeedItemType.MATCH_EVENT,
            created_at=match_event.created_at,
            title=f"{data.event_type.value.replace('_', ' ').title()} em partida",
            description="Atualização global da competição",
            match_id=match_id,
            athlete_id=data.athlete_id,
            delegation_id=data.delegation_id_at_time,
            minute=data.minute,
        ).model_dump(mode="json")
    )
    return MatchEventResponse.model_validate(match_event)


async def list_match_events(
    session: AsyncSession, match_id: int
) -> list[MatchEventResponse]:
    await _get_match_or_404(session, match_id)
    events = await event_repository.get_match_events(session, match_id)
    return [MatchEventResponse.model_validate(e) for e in events]


async def start_match(session: AsyncSession, match_id: int) -> MatchResponse:
    match = await _get_match_or_404(session, match_id)
    if match.status != MatchStatus.SCHEDULED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Match status is {match.status.value}, expected SCHEDULED",
        )
    match.status = MatchStatus.IN_PROGRESS
    match.started_at = datetime.now(UTC).replace(tzinfo=None)
    match = await event_repository.save_match(session, match)
    await session.commit()
    await sse.broadcast(match_id, {"type": "match_started", "match_id": match_id})
    await sse.broadcast_activity_feed(
        ActivityFeedItem(
            id=f"match-started-{match.id}-{match.started_at.isoformat()}",
            item_type=ActivityFeedItemType.MATCH_STARTED,
            created_at=match.started_at,
            title="Partida iniciada",
            description="Atualização global da competição",
            match_id=match.id,
            event_id=match.event_id,
        ).model_dump(mode="json")
    )
    return MatchResponse.model_validate(match)


async def finish_match(session: AsyncSession, match_id: int) -> MatchResponse:
    match = await _get_match_or_404(session, match_id)
    if match.status != MatchStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Match status is {match.status.value}, expected IN_PROGRESS",
        )
    match.status = MatchStatus.COMPLETED
    match.ended_at = datetime.now(UTC).replace(tzinfo=None)

    # Determine winner from score
    if match.score_a is not None and match.score_b is not None:
        if match.score_a > match.score_b:
            match.winner_delegation_id = match.team_a_delegation_id
            match.winner_athlete_id = match.athlete_a_id
        elif match.score_b > match.score_a:
            match.winner_delegation_id = match.team_b_delegation_id
            match.winner_athlete_id = match.athlete_b_id

    match = await event_repository.save_match(session, match)
    await session.commit()
    # Phase 9: simulation_service.generate_results(match, session)
    await sse.broadcast(match_id, {"type": "match_finished", "match_id": match_id, "status": "COMPLETED"})
    await sse.broadcast_activity_feed(
        ActivityFeedItem(
            id=f"match-finished-{match.id}-{match.ended_at.isoformat()}",
            item_type=ActivityFeedItemType.MATCH_FINISHED,
            created_at=match.ended_at,
            title="Partida encerrada",
            description="Atualização global da competição",
            match_id=match.id,
            event_id=match.event_id,
        ).model_dump(mode="json")
    )
    return MatchResponse.model_validate(match)


async def ai_generate_schedule(session: AsyncSession, competition_id: int) -> list[EventResponse]:
    competition = await competition_repository.get_by_id(session, competition_id)
    if competition is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Competition not found")
    if competition.status in _LOCKED_OR_LATER:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot generate schedule for a LOCKED or later competition",
        )
    events = await schedule_service.generate_events(session, competition)
    await session.commit()
    return [EventResponse.model_validate(e) for e in events]


async def lock_and_generate_bracket(session: AsyncSession, competition_id: int) -> int:
    """Called from competition_service.lock_competition — generates bracket matches."""
    return await bracket_service.generate(session, competition_id)


async def _get_event_or_404(session: AsyncSession, event_id: int) -> Event:
    event = await event_repository.get_event_by_id(session, event_id)
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return event


async def _get_match_or_404(session: AsyncSession, match_id: int) -> Match:
    match = await event_repository.get_match_by_id(session, match_id)
    if match is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
    return match
