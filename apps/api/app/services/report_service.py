import csv
import io
from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.athlete import Athlete
from app.models.athlete import AthleteModality
from app.models.delegation import Delegation
from app.models.event import Event, Match, MatchStatus
from app.models.result import AthleteStatistic, Result
from app.models.sport import Modality, Sport
from app.models.week import CompetitionWeek
from app.repositories import athlete_repository, result_repository
from app.schemas.athlete import AthleteResponse, DelegationHistoryItem, MatchHistoryItem
from app.schemas.report import (
    AthleteReportResponse,
    CompetitionSummary,
    FinalReportResponse,
    WeekReportResponse,
    WeekSummary,
)
from app.schemas.result import MedalBoardEntry, ResultResponse
from app.services import result_service


async def get_final_report(session: AsyncSession) -> FinalReportResponse:
    medal_board = await result_service.get_medal_board(session)
    records = await result_service.get_records(session)

    total_delegations = (await session.execute(select(func.count()).select_from(Delegation).where(Delegation.is_active == True))).scalar_one()  # noqa: E712
    total_athletes = (await session.execute(select(func.count()).select_from(Athlete).where(Athlete.is_active == True))).scalar_one()  # noqa: E712
    total_weeks = (await session.execute(select(func.count()).select_from(CompetitionWeek))).scalar_one()
    total_events = (await session.execute(select(func.count()).select_from(Event))).scalar_one()
    total_matches = (await session.execute(select(func.count()).select_from(Match))).scalar_one()
    completed_matches = (await session.execute(select(func.count()).select_from(Match).where(Match.status == MatchStatus.COMPLETED))).scalar_one()
    athletes_by_sport_result = await session.execute(
        select(
            Sport.id,
            Sport.name,
            func.count(func.distinct(AthleteModality.athlete_id)).label("athlete_count"),
        )
        .select_from(Sport)
        .join(Modality, Modality.sport_id == Sport.id, isouter=True)
        .join(AthleteModality, AthleteModality.modality_id == Modality.id, isouter=True)
        .where(Sport.is_active == True)  # noqa: E712
        .group_by(Sport.id, Sport.name)
        .order_by(func.count(func.distinct(AthleteModality.athlete_id)).desc(), Sport.name)
    )

    return FinalReportResponse(
        medal_board=medal_board,
        records=records,
        summary=CompetitionSummary(
            total_delegations=total_delegations,
            total_athletes=total_athletes,
            total_weeks=total_weeks,
            total_events=total_events,
            total_matches=total_matches,
            completed_matches=completed_matches,
        ),
        athletes_by_sport=[
            {"sport_id": sport_id, "sport_name": sport_name, "athlete_count": athlete_count}
            for sport_id, sport_name, athlete_count in athletes_by_sport_result.all()
        ],
    )


async def get_week_report(session: AsyncSession, week_id: int) -> WeekReportResponse:
    week = await session.get(CompetitionWeek, week_id)
    if week is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Week not found")

    total_events = (await session.execute(select(func.count()).select_from(Event).where(Event.week_id == week_id))).scalar_one()
    total_matches_q = (
        select(func.count()).select_from(Match)
        .join(Event, Event.id == Match.event_id)
        .where(Event.week_id == week_id)
    )
    total_matches = (await session.execute(total_matches_q)).scalar_one()
    completed_matches = (await session.execute(
        select(func.count()).select_from(Match)
        .join(Event, Event.id == Match.event_id)
        .where(Event.week_id == week_id, Match.status == MatchStatus.COMPLETED)
    )).scalar_one()

    # Medal board scoped to this week
    from app.repositories.result_repository import get_medal_board as _mb
    rows = await _mb(session)
    # filter to results in this week
    week_result_ids_q = (
        select(Result.id)
        .join(Match, Match.id == Result.match_id)
        .join(Event, Event.id == Match.event_id)
        .where(Event.week_id == week_id)
        .scalar_subquery()
    )
    from sqlalchemy import text
    from app.repositories import result_repository as rr
    from app.models.result import Medal
    gold = func.count().filter(Result.medal == Medal.GOLD)
    silver = func.count().filter(Result.medal == Medal.SILVER)
    bronze = func.count().filter(Result.medal == Medal.BRONZE)
    week_board_result = await session.execute(
        select(Result.delegation_id, gold.label("gold"), silver.label("silver"), bronze.label("bronze"))
        .join(Match, Match.id == Result.match_id)
        .join(Event, Event.id == Match.event_id)
        .where(Event.week_id == week_id, Result.delegation_id.is_not(None), Result.medal.is_not(None))
        .group_by(Result.delegation_id)
        .order_by(gold.desc(), silver.desc(), bronze.desc())
    )
    medal_board: list[MedalBoardEntry] = []
    for row in week_board_result.all():
        d = await session.get(Delegation, row.delegation_id)
        if d:
            medal_board.append(MedalBoardEntry(
                delegation_id=row.delegation_id,
                delegation_name=d.name,
                delegation_code=d.code,
                gold=row.gold,
                silver=row.silver,
                bronze=row.bronze,
                total=row.gold + row.silver + row.bronze,
            ))

    return WeekReportResponse(
        week_id=week.id,
        week_number=week.week_number,
        status=week.status.value,
        start_date=week.start_date,
        end_date=week.end_date,
        medal_board=medal_board,
        summary=WeekSummary(
            total_events=total_events,
            total_matches=total_matches,
            completed_matches=completed_matches,
        ),
    )


async def get_athlete_report(session: AsyncSession, athlete_id: int) -> AthleteReportResponse:
    athlete = await athlete_repository.get_by_id(session, athlete_id)
    if athlete is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Athlete not found")

    del_history = await athlete_repository.get_delegation_history(session, athlete)
    match_history = await athlete_repository.get_match_history(session, athlete_id)

    medals_result = await session.execute(
        select(Result).where(Result.athlete_id == athlete_id, Result.medal.is_not(None))
    )
    medals = medals_result.scalars().all()

    stats_result = await session.execute(
        select(AthleteStatistic).where(AthleteStatistic.athlete_id == athlete_id)
    )
    raw_stats = stats_result.scalars().all()
    statistics = {f"sport_{s.sport_id}_week_{s.week_id}": s.stats_json for s in raw_stats}

    return AthleteReportResponse(
        athlete=AthleteResponse.model_validate(athlete),
        delegation_history=[DelegationHistoryItem(**d) for d in del_history],
        match_history=[MatchHistoryItem(**m) for m in match_history],
        medals=[ResultResponse.model_validate(r) for r in medals],
        statistics=statistics,
    )


async def export_csv(session: AsyncSession) -> str:
    rows_result = await session.execute(
        select(Result, Match, Event, Modality, Sport, Delegation)
        .join(Match, Match.id == Result.match_id)
        .join(Event, Event.id == Match.event_id)
        .join(Modality, Modality.id == Event.modality_id)
        .join(Sport, Sport.id == Modality.sport_id)
        .join(Delegation, Delegation.id == Result.delegation_id)
        .where(Result.delegation_id.is_not(None))
        .order_by(Event.event_date.desc(), Result.rank)
    )
    rows = rows_result.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["match_id", "event_date", "sport", "modality", "delegation", "rank", "medal", "score"])
    for r, m, e, mod, sp, d in rows:
        score = r.value_json.get("score", "") if r.value_json else ""
        writer.writerow([
            m.id,
            e.event_date.isoformat(),
            sp.name,
            mod.name,
            d.name,
            r.rank,
            r.medal.value if r.medal else "",
            score,
        ])
    return output.getvalue()
