from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.athlete import Athlete, AthleteModality
from app.domain.models.delegation import Delegation, DelegationMember
from app.domain.models.event import Event, Match, MatchParticipant
from app.domain.models.sport import Modality, Sport


async def get_by_id(session: AsyncSession, athlete_id: int) -> Optional[Athlete]:
    result = await session.execute(select(Athlete).where(Athlete.id == athlete_id))
    return result.scalar_one_or_none()


async def get_by_id_in_league(
    session: AsyncSession, league_id: int, athlete_id: int
) -> Optional[Athlete]:
    result = await session.execute(
        select(Athlete).where(
            Athlete.id == athlete_id,
            Athlete.league_id == league_id,
        )
    )
    return result.scalar_one_or_none()


async def get_by_code(session: AsyncSession, code: str) -> Optional[Athlete]:
    result = await session.execute(select(Athlete).where(Athlete.code == code))
    return result.scalar_one_or_none()


async def list_all(
    session: AsyncSession,
    league_id: int,
    offset: int = 0,
    limit: int = 20,
    active_only: bool = True,
) -> tuple[list[Athlete], int]:
    q = select(Athlete).where(Athlete.league_id == league_id)
    if active_only:
        q = q.where(Athlete.is_active == True)  # noqa: E712
    total_result = await session.execute(select(func.count()).select_from(q.subquery()))
    total = total_result.scalar_one()
    result = await session.execute(q.offset(offset).limit(limit))
    return list(result.scalars().all()), total


async def list_by_delegation(
    session: AsyncSession,
    league_id: int,
    delegation_id: int,
    offset: int = 0,
    limit: int = 20,
) -> tuple[list[Athlete], int]:
    active_member_user_ids = (
        select(DelegationMember.user_id)
        .where(
            DelegationMember.delegation_id == delegation_id,
            DelegationMember.left_at == None,  # noqa: E711
        )
        .scalar_subquery()
    )
    q = select(Athlete).where(
        Athlete.league_id == league_id,
        Athlete.user_id.in_(active_member_user_ids),
        Athlete.is_active == True,  # noqa: E712
    )
    total_result = await session.execute(select(func.count()).select_from(q.subquery()))
    total = total_result.scalar_one()
    result = await session.execute(q.offset(offset).limit(limit))
    return list(result.scalars().all()), total


async def create(session: AsyncSession, athlete: Athlete) -> Athlete:
    session.add(athlete)
    await session.flush()
    await session.refresh(athlete)
    return athlete


async def save(session: AsyncSession, athlete: Athlete) -> Athlete:
    session.add(athlete)
    await session.flush()
    await session.refresh(athlete)
    return athlete


async def get_delegation_history(
    session: AsyncSession, athlete: Athlete
) -> list[dict]:
    if athlete.user_id is None:
        return []
    result = await session.execute(
        select(DelegationMember, Delegation)
        .join(Delegation, Delegation.id == DelegationMember.delegation_id)
        .where(DelegationMember.user_id == athlete.user_id)
        .order_by(DelegationMember.joined_at)
    )
    rows = result.all()
    return [
        {
            "delegation_id": d.id,
            "delegation_name": d.name,
            "delegation_code": d.code,
            "role": m.role,
            "joined_at": m.joined_at,
            "left_at": m.left_at,
        }
        for m, d in rows
    ]


async def get_match_history(
    session: AsyncSession, athlete_id: int
) -> list[dict]:
    result = await session.execute(
        select(MatchParticipant, Match, Event, Modality, Sport, Delegation)
        .join(Match, Match.id == MatchParticipant.match_id)
        .join(Event, Event.id == Match.event_id)
        .join(Modality, Modality.id == Event.modality_id)
        .join(Sport, Sport.id == Modality.sport_id)
        .join(Delegation, Delegation.id == MatchParticipant.delegation_id_at_time)
        .where(MatchParticipant.athlete_id == athlete_id)
        .order_by(Event.event_date.desc())
    )
    rows = result.all()
    return [
        {
            "match_id": mp.match_id,
            "event_id": m.event_id,
            "modality_name": mod.name,
            "sport_name": sp.name,
            "delegation_code": d.code,
            "role": mp.role,
            "match_date": e.event_date,
        }
        for mp, m, e, mod, sp, d in rows
    ]


async def get_statistics(
    session: AsyncSession, athlete_id: int
) -> dict:
    total_result = await session.execute(
        select(func.count()).where(MatchParticipant.athlete_id == athlete_id)
    )
    total_matches = total_result.scalar_one()

    mod_result = await session.execute(
        select(Modality.name)
        .join(AthleteModality, AthleteModality.modality_id == Modality.id)
        .where(AthleteModality.athlete_id == athlete_id)
    )
    modalities = [r for r in mod_result.scalars().all()]

    return {
        "athlete_id": athlete_id,
        "total_matches": total_matches,
        "modalities": modalities,
        "raw": [],
    }


async def search(
    session: AsyncSession,
    query: str,
    limit: int = 8,
) -> list[Athlete]:
    pattern = f"%{query.strip()}%"
    result = await session.execute(
        select(Athlete)
        .where(
            Athlete.is_active == True,  # noqa: E712
            ((Athlete.name.ilike(pattern)) | (Athlete.code.ilike(pattern))),
        )
        .order_by(Athlete.name.asc())
        .limit(limit)
    )
    return list(result.scalars().all())
