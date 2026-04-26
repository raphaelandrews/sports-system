from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.shared.core import sse
from app.domain.models.athlete import Athlete
from app.domain.models.competition import Competition
from app.domain.models.delegation import Delegation
from app.domain.models.event import Event, Match, MatchStatus
from app.domain.models.result import Result
from app.domain.models.sport import Modality
from app.features.results import repository as result_repository
from app.domain.schemas.common import Meta, PaginatedResponse
from app.domain.schemas.result import (
    MedalBoardEntry,
    RecordResponse,
    ResultCreate,
    ResultResponse,
    ResultUpdate,
    SportStandingEntry,
)


async def list_results(
    session: AsyncSession,
    league_id: int,
    competition_id: int | None,
    sport_id: int | None,
    delegation_id: int | None,
    page: int,
    per_page: int,
) -> PaginatedResponse[ResultResponse]:
    offset = (page - 1) * per_page
    results, total = await result_repository.list_all(
        session,
        league_id,
        offset,
        per_page,
        competition_id=competition_id,
        sport_id=sport_id,
        delegation_id=delegation_id,
    )
    return PaginatedResponse(
        data=[ResultResponse.model_validate(r) for r in results],
        meta=Meta(total=total, page=page, per_page=per_page),
    )


async def create_result(
    session: AsyncSession, league_id: int, data: ResultCreate
) -> ResultResponse:
    match = await session.get(Match, data.match_id)
    if match is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Match not found"
        )
    event = await session.get(Event, match.event_id)
    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Event not found"
        )
    competition = await session.get(Competition, event.competition_id)
    if competition is None or competition.league_id != league_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Match not found"
        )
    result = Result(
        match_id=data.match_id,
        delegation_id=data.delegation_id,
        athlete_id=data.athlete_id,
        rank=data.rank,
        medal=data.medal,
        value_json=data.value_json,
    )
    result = await result_repository.create(session, result)
    await session.commit()
    await sse.broadcast_medal_board(
        league_id, {"type": "medal_board_updated", "match_id": data.match_id}
    )
    return ResultResponse.model_validate(result)


async def update_result(
    session: AsyncSession, league_id: int, result_id: int, data: ResultUpdate
) -> ResultResponse:
    result = await result_repository.get_by_id_in_league(session, league_id, result_id)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Result not found"
        )
    if data.rank is not None:
        result.rank = data.rank
    if data.medal is not None:
        result.medal = data.medal
    if data.value_json is not None:
        result.value_json = data.value_json
    result = await result_repository.save(session, result)
    await session.commit()
    await sse.broadcast_medal_board(league_id, {"type": "medal_board_updated"})
    return ResultResponse.model_validate(result)


async def get_medal_board(
    session: AsyncSession, league_id: int
) -> list[MedalBoardEntry]:
    rows = await result_repository.get_medal_board(session, league_id)
    board: list[MedalBoardEntry] = []
    for row in rows:
        delegation = await session.get(Delegation, row.delegation_id)
        if delegation is None:
            continue
        board.append(
            MedalBoardEntry(
                delegation_id=row.delegation_id,
                delegation_name=delegation.name,
                delegation_code=delegation.code,
                gold=row.gold,
                silver=row.silver,
                bronze=row.bronze,
                total=row.gold + row.silver + row.bronze,
            )
        )
    return board


async def get_medal_board_by_sport(
    session: AsyncSession, league_id: int, sport_id: int
) -> list[MedalBoardEntry]:
    rows = await result_repository.get_medal_board_by_sport(
        session, league_id, sport_id
    )
    board: list[MedalBoardEntry] = []
    for row in rows:
        delegation = await session.get(Delegation, row.delegation_id)
        if delegation is None:
            continue
        board.append(
            MedalBoardEntry(
                delegation_id=row.delegation_id,
                delegation_name=delegation.name,
                delegation_code=delegation.code,
                gold=row.gold,
                silver=row.silver,
                bronze=row.bronze,
                total=row.gold + row.silver + row.bronze,
            )
        )
    return board


async def get_standings(
    session: AsyncSession, league_id: int, modality_id: int
) -> list[SportStandingEntry]:
    results = await result_repository.get_standings_for_modality(
        session, league_id, modality_id
    )
    entries: list[SportStandingEntry] = []
    for r in results:
        delegation_name = None
        athlete_name = None
        if r.delegation_id is not None:
            d = await session.get(Delegation, r.delegation_id)
            delegation_name = d.name if d else None
        if r.athlete_id is not None:
            a = await session.get(Athlete, r.athlete_id)
            athlete_name = a.name if a else None
        entries.append(
            SportStandingEntry(
                rank=r.rank,
                delegation_id=r.delegation_id,
                delegation_name=delegation_name,
                athlete_id=r.athlete_id,
                athlete_name=athlete_name,
                medal=r.medal,
                value_json=r.value_json,
            )
        )
    return entries


async def get_records(
    session: AsyncSession, league_id: int, modality_id: int | None = None
) -> list[RecordResponse]:
    records = await result_repository.get_records(session, league_id, modality_id)
    entries: list[RecordResponse] = []
    for r in records:
        modality = await session.get(Modality, r.modality_id)
        athlete = await session.get(Athlete, r.athlete_id)
        delegation = await session.get(Delegation, r.delegation_id_at_time)
        entries.append(
            RecordResponse(
                id=r.id,
                modality_id=r.modality_id,
                modality_name=modality.name if modality else "",
                athlete_id=r.athlete_id,
                athlete_name=athlete.name if athlete else "",
                delegation_name=delegation.name if delegation else "",
                value=r.value,
                competition_id=r.competition_id,
                set_at=r.set_at,
            )
        )
    return entries


async def ai_generate(
    session: AsyncSession, league_id: int, event_id: int
) -> list[ResultResponse]:
    event = await session.get(Event, event_id)
    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Event not found"
        )
    competition = await session.get(Competition, event.competition_id)
    if competition is None or competition.league_id != league_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Event not found"
        )

    matches_result = await session.execute(
        select(Match).where(
            Match.event_id == event_id,
            Match.status != MatchStatus.COMPLETED,
        )
    )
    matches = list(matches_result.scalars().all())
    if not matches:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No pending matches found for this event",
        )

    from app.features.events import simulation as simulation_service

    for match in matches:
        await simulation_service.simulate_match(session, match.id)

    await session.commit()

    created_result = await session.execute(
        select(Result)
        .join(Match, Match.id == Result.match_id)
        .where(Match.event_id == event_id)
    )
    return [ResultResponse.model_validate(r) for r in created_result.scalars().all()]
