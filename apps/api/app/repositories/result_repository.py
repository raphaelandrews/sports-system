from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event import Event, Match
from app.models.competition import Competition
from app.models.result import AthleteStatistic, Medal, Record, Result
from app.models.sport import Modality


async def get_by_id(session: AsyncSession, result_id: int) -> Optional[Result]:
    return await session.get(Result, result_id)


async def get_by_id_in_league(
    session: AsyncSession, league_id: int, result_id: int
) -> Optional[Result]:
    result = await session.execute(
        select(Result)
        .join(Match, Match.id == Result.match_id)
        .join(Event, Event.id == Match.event_id)
        .join(Competition, Competition.id == Event.competition_id)
        .where(Result.id == result_id, Competition.league_id == league_id)
    )
    return result.scalar_one_or_none()


async def list_all(
    session: AsyncSession,
    league_id: int,
    offset: int,
    limit: int,
    competition_id: int | None = None,
    sport_id: int | None = None,
    delegation_id: int | None = None,
) -> tuple[list[Result], int]:
    q = (
        select(Result)
        .join(Match, Match.id == Result.match_id)
        .join(Event, Event.id == Match.event_id)
        .join(Competition, Competition.id == Event.competition_id)
        .where(Competition.league_id == league_id)
    )
    if delegation_id is not None:
        q = q.where(Result.delegation_id == delegation_id)
    if competition_id is not None:
        q = q.where(Event.competition_id == competition_id)
    if sport_id is not None:
        q = q.join(Modality, Modality.id == Event.modality_id).where(Modality.sport_id == sport_id)
    total_result = await session.execute(select(func.count()).select_from(q.subquery()))
    total = total_result.scalar_one()
    result = await session.execute(q.order_by(Result.id.desc()).offset(offset).limit(limit))
    return list(result.scalars().all()), total


async def create(session: AsyncSession, result: Result) -> Result:
    session.add(result)
    await session.flush()
    await session.refresh(result)
    return result


async def save(session: AsyncSession, result: Result) -> Result:
    session.add(result)
    await session.flush()
    await session.refresh(result)
    return result


async def get_by_match(session: AsyncSession, match_id: int) -> list[Result]:
    result = await session.execute(select(Result).where(Result.match_id == match_id))
    return list(result.scalars().all())


async def get_medal_board(session: AsyncSession, league_id: int) -> list:
    gold = func.count().filter(Result.medal == Medal.GOLD)
    silver = func.count().filter(Result.medal == Medal.SILVER)
    bronze = func.count().filter(Result.medal == Medal.BRONZE)
    result = await session.execute(
        select(
            Result.delegation_id,
            gold.label("gold"),
            silver.label("silver"),
            bronze.label("bronze"),
        )
        .join(Match, Match.id == Result.match_id)
        .join(Event, Event.id == Match.event_id)
        .join(Competition, Competition.id == Event.competition_id)
        .where(
            Competition.league_id == league_id,
            Result.delegation_id.is_not(None),
            Result.medal.is_not(None),
        )
        .group_by(Result.delegation_id)
        .order_by(gold.desc(), silver.desc(), bronze.desc())
    )
    return result.all()


async def get_medal_board_by_sport(session: AsyncSession, league_id: int, sport_id: int) -> list:
    gold = func.count().filter(Result.medal == Medal.GOLD)
    silver = func.count().filter(Result.medal == Medal.SILVER)
    bronze = func.count().filter(Result.medal == Medal.BRONZE)
    result = await session.execute(
        select(
            Result.delegation_id,
            gold.label("gold"),
            silver.label("silver"),
            bronze.label("bronze"),
        )
        .join(Match, Match.id == Result.match_id)
        .join(Event, Event.id == Match.event_id)
        .join(Competition, Competition.id == Event.competition_id)
        .join(Modality, Modality.id == Event.modality_id)
        .where(
            Competition.league_id == league_id,
            Modality.sport_id == sport_id,
            Result.delegation_id.is_not(None),
            Result.medal.is_not(None),
        )
        .group_by(Result.delegation_id)
        .order_by(gold.desc(), silver.desc(), bronze.desc())
    )
    return result.all()


async def get_standings_for_modality(
    session: AsyncSession, league_id: int, modality_id: int
) -> list[Result]:
    result = await session.execute(
        select(Result)
        .join(Match, Match.id == Result.match_id)
        .join(Event, Event.id == Match.event_id)
        .join(Competition, Competition.id == Event.competition_id)
        .where(
            Competition.league_id == league_id,
            Event.modality_id == modality_id,
            Result.medal.is_not(None),
        )
        .order_by(Result.rank)
    )
    return list(result.scalars().all())


async def get_records(
    session: AsyncSession, league_id: int, modality_id: int | None = None
) -> list[Record]:
    q = (
        select(Record)
        .join(Competition, Competition.id == Record.competition_id)
        .where(Competition.league_id == league_id)
    )
    if modality_id is not None:
        q = q.where(Record.modality_id == modality_id)
    result = await session.execute(q.order_by(Record.set_at.desc()))
    return list(result.scalars().all())


async def get_best_record_for_modality(session: AsyncSession, modality_id: int) -> Optional[Record]:
    result = await session.execute(
        select(Record)
        .where(Record.modality_id == modality_id)
        .order_by(Record.set_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def save_record(session: AsyncSession, record: Record) -> Record:
    session.add(record)
    await session.flush()
    return record


async def get_athlete_statistic(
    session: AsyncSession, athlete_id: int, sport_id: int, competition_id: int
) -> Optional[AthleteStatistic]:
    result = await session.execute(
        select(AthleteStatistic).where(
            AthleteStatistic.athlete_id == athlete_id,
            AthleteStatistic.sport_id == sport_id,
            AthleteStatistic.competition_id == competition_id,
        )
    )
    return result.scalar_one_or_none()


async def save_athlete_statistic(session: AsyncSession, stat: AthleteStatistic) -> AthleteStatistic:
    session.add(stat)
    await session.flush()
    return stat
