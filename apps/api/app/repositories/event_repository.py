from datetime import date as date_type
from typing import Optional

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event import Event, Match, MatchEvent, MatchParticipant
from app.models.sport import Modality, Sport
from app.models.competition import Competition


async def get_event_by_id(session: AsyncSession, event_id: int) -> Optional[Event]:
    return await session.get(Event, event_id)


async def list_events(
    session: AsyncSession,
    competition_id: Optional[int],
    sport_id: Optional[int],
    event_date: Optional[date_type],
    offset: int,
    limit: int,
) -> tuple[list[Event], int]:
    q = select(Event)
    if competition_id is not None:
        q = q.where(Event.competition_id == competition_id)
    if sport_id is not None:
        q = q.join(Modality, Modality.id == Event.modality_id).where(Modality.sport_id == sport_id)
    if event_date is not None:
        q = q.where(Event.event_date == event_date)
    q = q.order_by(Event.event_date, Event.start_time)
    total_result = await session.execute(select(func.count()).select_from(q.subquery()))
    total = total_result.scalar_one()
    result = await session.execute(q.offset(offset).limit(limit))
    return list(result.scalars().all()), total


async def create_event(session: AsyncSession, event: Event) -> Event:
    session.add(event)
    await session.flush()
    await session.refresh(event)
    return event


async def save_event(session: AsyncSession, event: Event) -> Event:
    session.add(event)
    await session.flush()
    await session.refresh(event)
    return event


async def get_matches_for_event(session: AsyncSession, event_id: int) -> list[Match]:
    result = await session.execute(select(Match).where(Match.event_id == event_id))
    return list(result.scalars().all())


async def get_match_by_id(session: AsyncSession, match_id: int) -> Optional[Match]:
    return await session.get(Match, match_id)


async def create_match(session: AsyncSession, match: Match) -> Match:
    session.add(match)
    await session.flush()
    await session.refresh(match)
    return match


async def save_match(session: AsyncSession, match: Match) -> Match:
    session.add(match)
    await session.flush()
    await session.refresh(match)
    return match


async def get_match_participants(session: AsyncSession, match_id: int) -> list[MatchParticipant]:
    result = await session.execute(
        select(MatchParticipant).where(MatchParticipant.match_id == match_id)
    )
    return list(result.scalars().all())


async def get_match_events(session: AsyncSession, match_id: int) -> list[MatchEvent]:
    result = await session.execute(
        select(MatchEvent).where(MatchEvent.match_id == match_id).order_by(MatchEvent.created_at)
    )
    return list(result.scalars().all())


async def create_match_event(session: AsyncSession, match_event: MatchEvent) -> MatchEvent:
    session.add(match_event)
    await session.flush()
    await session.refresh(match_event)
    return match_event


async def search(
    session: AsyncSession,
    query: str,
    limit: int = 8,
) -> list[dict]:
    pattern = f"%{query.strip()}%"
    result = await session.execute(
        select(
            Event.id,
            Event.competition_id,
            Competition.number,
            Sport.name.label("sport_name"),
            Modality.name.label("modality_name"),
            Event.venue,
            Event.event_date,
            Event.start_time,
            Event.phase,
            Event.status,
        )
        .join(Competition, Competition.id == Event.competition_id)
        .join(Modality, Modality.id == Event.modality_id)
        .join(Sport, Sport.id == Modality.sport_id)
        .where(
            or_(
                Sport.name.ilike(pattern),
                Modality.name.ilike(pattern),
                Event.venue.ilike(pattern),
            )
        )
        .order_by(Event.event_date.desc(), Event.start_time.asc())
        .limit(limit)
    )
    return [
        {
            "id": row.id,
            "competition_id": row.competition_id,
            "number": row.number,
            "sport_name": row.sport_name,
            "modality_name": row.modality_name,
            "venue": row.venue,
            "event_date": row.event_date,
            "start_time": row.start_time,
            "phase": row.phase,
            "status": row.status,
        }
        for row in result.all()
    ]
