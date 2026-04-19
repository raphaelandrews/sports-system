from datetime import UTC, date, datetime, time, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_admin
from app.core.security import hash_password
from app.database import get_session
from app.models.athlete import Athlete, AthleteModality
from app.models.delegation import Delegation, DelegationMember, DelegationMemberRole
from app.models.event import Event, EventPhase, EventStatus, Match, MatchStatus
from app.models.result import Medal, Result
from app.models.sport import Gender, Modality, Sport, SportType
from app.models.user import User, UserRole
from app.models.week import CompetitionWeek, WeekStatus

router = APIRouter(prefix="/admin", tags=["admin"])

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

_SPORTS: list[tuple[str, SportType, str, int]] = [
    ("Futebol", SportType.TEAM, "Futebol de campo", 11),
    ("Vôlei", SportType.TEAM, "Vôlei indoor", 6),
    ("Basquete", SportType.TEAM, "Basquete 5x5", 5),
    ("Handebol", SportType.TEAM, "Handebol indoor", 7),
    ("Natação", SportType.INDIVIDUAL, "Natação de piscina", 1),
    ("Atletismo", SportType.INDIVIDUAL, "Atletismo de pista e campo", 1),
    ("Judô", SportType.INDIVIDUAL, "Judô olímpico", 1),
    ("Karatê", SportType.INDIVIDUAL, "Karatê WKF", 1),
    ("Tênis de Mesa", SportType.INDIVIDUAL, "Tênis de mesa", 1),
    ("Vôlei de Praia", SportType.TEAM, "Vôlei de praia em dupla", 2),
]


@router.post("/demo-seed", status_code=status.HTTP_201_CREATED)
async def demo_seed(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> dict[str, object]:
    existing = await session.execute(select(Delegation).limit(1))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Demo data already seeded. Wipe the database first to re-seed.",
        )

    today = date.today()
    week_start = today - timedelta(days=today.weekday())  # last Monday

    # --- Admin user ---
    admin = User(
        email="admin@sports.local",
        name="Admin",
        password_hash=hash_password("admin123"),
        role=UserRole.ADMIN,
    )
    session.add(admin)
    await session.flush()

    # --- Sports & modalities ---
    sports: list[Sport] = []
    modalities: list[Modality] = []
    for sport_name, sport_type, desc, player_count in _SPORTS:
        sport = Sport(name=sport_name, sport_type=sport_type, description=desc, player_count=player_count)
        session.add(sport)
        await session.flush()
        sports.append(sport)

        for gender in (Gender.M, Gender.F):
            rules: dict[str, object] = {
                "max_athletes": player_count,
                "gender": gender.value,
                "schedule_conflict_check": True,
            }
            mod = Modality(sport_id=sport.id, name=f"{sport_name} {gender.value}", gender=gender, rules_json=rules)
            session.add(mod)
            await session.flush()
            modalities.append(mod)

    # --- Delegations, chiefs, athletes ---
    delegations: list[Delegation] = []
    all_athletes: list[Athlete] = []

    for i, (code, name) in enumerate(_DELEGATIONS):
        chief_user = User(
            email=f"chief.{code.lower()}@sports.local",
            name=f"Chefe {name}",
            password_hash=hash_password("chief123"),
            role=UserRole.CHIEF,
        )
        session.add(chief_user)
        await session.flush()

        delegation = Delegation(code=code, name=name, chief_id=chief_user.id)
        session.add(delegation)
        await session.flush()
        delegations.append(delegation)

        member_chief = DelegationMember(
            delegation_id=delegation.id,
            user_id=chief_user.id,
            role=DelegationMemberRole.CHIEF,
        )
        session.add(member_chief)

        for j, (athlete_name, sex) in enumerate(_ATHLETES):
            athlete = Athlete(
                name=f"{athlete_name} ({code})",
                code=f"ATL-{code}-{j + 1:03d}",
                birthdate=date(2000 + j, 3 + i, 10),
            )
            session.add(athlete)
            await session.flush()
            all_athletes.append(athlete)

            member_athlete = DelegationMember(
                delegation_id=delegation.id,
                user_id=chief_user.id,  # linked to chief user for simplicity
                role=DelegationMemberRole.ATHLETE,
            )
            session.add(member_athlete)

            # Enroll each athlete in 2 modalities
            mod_a = modalities[(i * 2) % len(modalities)]
            mod_b = modalities[(i * 2 + 1) % len(modalities)]
            session.add(AthleteModality(athlete_id=athlete.id, modality_id=mod_a.id))
            session.add(AthleteModality(athlete_id=athlete.id, modality_id=mod_b.id))

    # --- Competition week ---
    week = CompetitionWeek(
        week_number=1,
        start_date=week_start,
        end_date=week_start + timedelta(days=6),
        status=WeekStatus.COMPLETED,
        sport_focus=[s.id for s in sports[:5]],
    )
    session.add(week)
    await session.flush()

    # --- Events & matches for 5 sports ---
    medals_awarded: list[dict[str, object]] = []
    for sport_idx in range(5):
        sport = sports[sport_idx]
        mod = modalities[sport_idx * 2]  # masculine modality

        event_dt = datetime.combine(week_start + timedelta(days=sport_idx + 1), time(10, 0))
        event = Event(
            week_id=week.id,
            modality_id=mod.id,
            event_date=event_dt.date(),
            start_time=event_dt.time(),
            venue=f"Arena {sport.name}",
            phase=EventPhase.FINAL,
            status=EventStatus.COMPLETED,
        )
        session.add(event)
        await session.flush()

        # Team sports: delegations A vs B
        del_a = delegations[sport_idx % len(delegations)]
        del_b = delegations[(sport_idx + 1) % len(delegations)]
        del_bronze = delegations[(sport_idx + 2) % len(delegations)]

        started = datetime.combine(event_dt.date(), event_dt.time(), tzinfo=UTC)
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
        medals_awarded.append({"sport": sport.name, "gold": del_a.name, "silver": del_b.name, "bronze": del_bronze.name})

    await session.commit()

    return {
        "seeded": True,
        "delegations": len(delegations),
        "athletes": len(all_athletes),
        "sports": len(sports),
        "modalities": len(modalities),
        "week": week.week_number,
        "medals": medals_awarded,
    }
