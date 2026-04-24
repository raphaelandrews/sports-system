from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_league_admin
from app.core.security import hash_password
from app.database import get_session
from app.models.athlete import Athlete, AthleteModality
from app.models.competition import Competition, CompetitionStatus
from app.models.delegation import Delegation, DelegationMember, DelegationMemberRole
from app.models.event import Event, EventPhase, EventStatus, Match, MatchStatus
from app.models.league import LeagueMember, LeagueMemberRole
from app.models.result import Medal, Result
from app.models.sport import Modality, Sport
from app.models.user import User, UserRole
from app.services import simulation_service

router = APIRouter(prefix="/leagues/{league_id}/admin", tags=["admin"])

_DELEGATIONS = [
    ("BRA", "Brasil"),
    ("ARG", "Argentina"),
    ("POR", "Portugal"),
    ("ESP", "Espanha"),
]

_ATHLETES: list[tuple[str, str]] = [
    ("Ana Lima", "F"),
    ("Bruno Silva", "M"),
    ("Carla Souza", "F"),
    ("Diego Ferreira", "M"),
    ("Elena Costa", "F"),
    ("Felipe Rocha", "M"),
]


async def _get_match_league_id(session: AsyncSession, match_id: int) -> int | None:
    result = await session.execute(
        select(Competition.league_id)
        .join(Event, Event.competition_id == Competition.id)
        .join(Match, Match.event_id == Event.id)
        .where(Match.id == match_id)
    )
    return result.scalar_one_or_none()


@router.post("/demo-seed", status_code=status.HTTP_201_CREATED)
async def demo_seed(
    league_id: int,
    session: AsyncSession = Depends(get_session),
    _: LeagueMember = Depends(require_league_admin()),
) -> dict[str, object]:
    existing = await session.execute(
        select(Delegation.id).where(Delegation.league_id == league_id).limit(1)
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Demo data already seeded for this league.",
        )

    today = date.today()
    competition_start = today - timedelta(days=today.weekday())

    sports_result = await session.execute(
        select(Sport).where(Sport.is_active == True).order_by(Sport.id).limit(10)  # noqa: E712
    )
    sports = list(sports_result.scalars().all())
    if not sports:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Sports not seeded. Restart the server to trigger the startup seed.",
        )

    modalities: list[Modality] = []
    for sport in sports:
        mod_result = await session.execute(
            select(Modality)
            .where(Modality.sport_id == sport.id, Modality.is_active == True)  # noqa: E712
            .limit(1)
        )
        modality = mod_result.scalar_one_or_none()
        if modality is not None:
            modalities.append(modality)

    delegations: list[Delegation] = []
    all_athletes: list[Athlete] = []

    for delegation_index, (code, name) in enumerate(_DELEGATIONS):
        chief_user = User(
            email=f"chief.{league_id}.{code.lower()}@sports.local",
            name=f"Chefe {name}",
            hashed_password=hash_password("chief123"),
            role=UserRole.USER,
        )
        session.add(chief_user)
        await session.flush()

        session.add(
            LeagueMember(
                league_id=league_id,
                user_id=chief_user.id,
                role=LeagueMemberRole.CHIEF,
            )
        )

        delegation = Delegation(
            league_id=league_id,
            code=f"{code}{league_id}",
            name=name,
            chief_id=chief_user.id,
        )
        session.add(delegation)
        await session.flush()
        delegations.append(delegation)

        session.add(
            DelegationMember(
                delegation_id=delegation.id,
                user_id=chief_user.id,
                role=DelegationMemberRole.CHIEF,
            )
        )

        for athlete_index, (athlete_name, athlete_gender) in enumerate(_ATHLETES):
            athlete_user = User(
                email=f"athlete.{league_id}.{code.lower()}.{athlete_index + 1}@sports.local",
                name=f"{athlete_name} ({code})",
                hashed_password=hash_password("athlete123"),
                role=UserRole.USER,
            )
            session.add(athlete_user)
            await session.flush()

            session.add(
                LeagueMember(
                    league_id=league_id,
                    user_id=athlete_user.id,
                    role=LeagueMemberRole.ATHLETE,
                )
            )

            athlete = Athlete(
                league_id=league_id,
                user_id=athlete_user.id,
                name=f"{athlete_name} ({code})",
                code=f"ATL-{league_id}-{code}-{athlete_index + 1:03d}",
                gender=athlete_gender,
                birthdate=date(2000 + athlete_index, 3 + delegation_index, 10),
            )
            session.add(athlete)
            await session.flush()
            all_athletes.append(athlete)

            session.add(
                DelegationMember(
                    delegation_id=delegation.id,
                    user_id=athlete_user.id,
                    role=DelegationMemberRole.ATHLETE,
                )
            )

            if modalities:
                mod_a = modalities[(delegation_index * 2) % len(modalities)]
                mod_b = modalities[(delegation_index * 2 + 1) % len(modalities)]
                session.add(AthleteModality(athlete_id=athlete.id, modality_id=mod_a.id))
                session.add(AthleteModality(athlete_id=athlete.id, modality_id=mod_b.id))

    competition = Competition(
        league_id=league_id,
        number=1,
        start_date=competition_start,
        end_date=competition_start + timedelta(days=6),
        status=CompetitionStatus.COMPLETED,
        sport_focus=[sport.id for sport in sports[:5]],
    )
    session.add(competition)
    await session.flush()

    medals_awarded: list[dict[str, object]] = []
    for sport_index, (sport, modality) in enumerate(zip(sports[:5], modalities[:5])):
        event_dt = datetime.combine(competition_start + timedelta(days=sport_index + 1), time(10, 0))
        event = Event(
            competition_id=competition.id,
            modality_id=modality.id,
            event_date=event_dt.date(),
            start_time=event_dt.time(),
            venue=f"Arena {sport.name}",
            phase=EventPhase.FINAL,
            status=EventStatus.COMPLETED,
        )
        session.add(event)
        await session.flush()

        del_a = delegations[sport_index % len(delegations)]
        del_b = delegations[(sport_index + 1) % len(delegations)]
        del_bronze = delegations[(sport_index + 2) % len(delegations)]

        started = datetime.combine(event_dt.date(), event_dt.time())
        match = Match(
            event_id=event.id,
            team_a_delegation_id=del_a.id,
            team_b_delegation_id=del_b.id,
            score_a=3,
            score_b=1,
            winner_delegation_id=del_a.id,
            status=MatchStatus.COMPLETED,
            started_at=started,
            ended_at=started + timedelta(minutes=90),
        )
        session.add(match)
        await session.flush()

        session.add(Result(match_id=match.id, delegation_id=del_a.id, rank=1, medal=Medal.GOLD, value_json={}))
        session.add(Result(match_id=match.id, delegation_id=del_b.id, rank=2, medal=Medal.SILVER, value_json={}))
        session.add(Result(match_id=match.id, delegation_id=del_bronze.id, rank=3, medal=Medal.BRONZE, value_json={}))
        medals_awarded.append(
            {"sport": sport.name, "gold": del_a.name, "silver": del_b.name, "bronze": del_bronze.name}
        )

    await session.commit()

    return {
        "seeded": True,
        "league_id": league_id,
        "delegations": len(delegations),
        "athletes": len(all_athletes),
        "sports_referenced": len(sports),
        "competition": competition.number,
        "medals": medals_awarded,
    }


@router.post("/simulate/match/{match_id}", status_code=status.HTTP_200_OK)
async def simulate_match(
    league_id: int,
    match_id: int,
    session: AsyncSession = Depends(get_session),
    _: LeagueMember = Depends(require_league_admin()),
) -> dict[str, object]:
    match_league_id = await _get_match_league_id(session, match_id)
    if match_league_id is None or match_league_id != league_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

    try:
        await simulation_service.simulate_match(session, match_id)
        await session.commit()
        return {"simulated": True, "match_id": match_id, "league_id": league_id}
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
