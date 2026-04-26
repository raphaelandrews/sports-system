from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.athlete import Athlete
from app.domain.models.competition import Competition
from app.domain.models.delegation import Delegation
from app.domain.models.event import Event, Match, MatchEvent
from app.domain.models.result import Record
from app.domain.models.sport import Modality, Sport


async def list_recent_match_events(session: AsyncSession, league_id: int, limit: int) -> list[dict[str, Any]]:
    result = await session.execute(
        select(
            MatchEvent.id.label("activity_id"),
            MatchEvent.created_at.label("created_at"),
            MatchEvent.match_id.label("match_id"),
            MatchEvent.minute.label("minute"),
            MatchEvent.event_type.label("event_type"),
            MatchEvent.athlete_id.label("athlete_id"),
            Athlete.name.label("athlete_name"),
            MatchEvent.delegation_id_at_time.label("delegation_id"),
            Delegation.name.label("delegation_name"),
            Match.event_id.label("event_id"),
            Event.competition_id.label("competition_id"),
            Competition.number.label("competition_number"),
            Event.event_date.label("event_date"),
            Event.start_time.label("start_time"),
            Event.modality_id.label("modality_id"),
            Modality.name.label("modality_name"),
            Sport.id.label("sport_id"),
            Sport.name.label("sport_name"),
        )
        .join(Match, Match.id == MatchEvent.match_id)
        .join(Event, Event.id == Match.event_id)
        .join(Competition, Competition.id == Event.competition_id)
        .join(Modality, Modality.id == Event.modality_id)
        .join(Sport, Sport.id == Modality.sport_id)
        .outerjoin(Athlete, Athlete.id == MatchEvent.athlete_id)
        .outerjoin(Delegation, Delegation.id == MatchEvent.delegation_id_at_time)
        .where(Competition.league_id == league_id)
        .order_by(MatchEvent.created_at.desc())
        .limit(limit)
    )
    return [dict(row) for row in result.mappings().all()]


async def list_recent_match_state_changes(session: AsyncSession, league_id: int, limit: int) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []

    started_result = await session.execute(
        select(
            Match.id.label("match_id"),
            Match.started_at.label("created_at"),
            Match.event_id.label("event_id"),
            Event.competition_id.label("competition_id"),
            Competition.number.label("competition_number"),
            Event.event_date.label("event_date"),
            Event.start_time.label("start_time"),
            Event.modality_id.label("modality_id"),
            Modality.name.label("modality_name"),
            Sport.id.label("sport_id"),
            Sport.name.label("sport_name"),
        )
        .join(Event, Event.id == Match.event_id)
        .join(Competition, Competition.id == Event.competition_id)
        .join(Modality, Modality.id == Event.modality_id)
        .join(Sport, Sport.id == Modality.sport_id)
        .where(Competition.league_id == league_id, Match.started_at.is_not(None))
        .order_by(Match.started_at.desc())
        .limit(limit)
    )
    for row in started_result.mappings().all():
        payload = dict(row)
        payload["item_type"] = "MATCH_STARTED"
        rows.append(payload)

    finished_result = await session.execute(
        select(
            Match.id.label("match_id"),
            Match.ended_at.label("created_at"),
            Match.event_id.label("event_id"),
            Event.competition_id.label("competition_id"),
            Competition.number.label("competition_number"),
            Event.event_date.label("event_date"),
            Event.start_time.label("start_time"),
            Event.modality_id.label("modality_id"),
            Modality.name.label("modality_name"),
            Sport.id.label("sport_id"),
            Sport.name.label("sport_name"),
        )
        .join(Event, Event.id == Match.event_id)
        .join(Competition, Competition.id == Event.competition_id)
        .join(Modality, Modality.id == Event.modality_id)
        .join(Sport, Sport.id == Modality.sport_id)
        .where(Competition.league_id == league_id, Match.ended_at.is_not(None))
        .order_by(Match.ended_at.desc())
        .limit(limit)
    )
    for row in finished_result.mappings().all():
        payload = dict(row)
        payload["item_type"] = "MATCH_FINISHED"
        rows.append(payload)

    return rows


async def list_recent_records(session: AsyncSession, league_id: int, limit: int) -> list[dict[str, Any]]:
    result = await session.execute(
        select(
            Record.id.label("activity_id"),
            Record.set_at.label("created_at"),
            Record.competition_id.label("competition_id"),
            Competition.number.label("competition_number"),
            Record.modality_id.label("modality_id"),
            Modality.name.label("modality_name"),
            Sport.id.label("sport_id"),
            Sport.name.label("sport_name"),
            Record.athlete_id.label("athlete_id"),
            Athlete.name.label("athlete_name"),
            Record.delegation_id_at_time.label("delegation_id"),
            Delegation.name.label("delegation_name"),
            Record.value.label("value"),
        )
        .join(Competition, Competition.id == Record.competition_id)
        .join(Modality, Modality.id == Record.modality_id)
        .join(Sport, Sport.id == Modality.sport_id)
        .join(Athlete, Athlete.id == Record.athlete_id)
        .join(Delegation, Delegation.id == Record.delegation_id_at_time)
        .where(Competition.league_id == league_id)
        .order_by(Record.set_at.desc())
        .limit(limit)
    )
    return [dict(row) for row in result.mappings().all()]
