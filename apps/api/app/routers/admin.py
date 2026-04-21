from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_admin
from app.core.security import hash_password
from app.database import get_session
from app.services import simulation_service
from app.models.athlete import Athlete, AthleteModality
from app.models.delegation import Delegation, DelegationMember, DelegationMemberRole
from app.models.event import Event, EventPhase, EventStatus, Match, MatchStatus
from app.models.result import Medal, Result
from app.models.sport import Modality, Sport
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
    admin_user = User(
        email="admin@sports.local",
        name="Admin",
        password_hash=hash_password("admin123"),
        role=UserRole.ADMIN,
    )
    session.add(admin_user)
    await session.flush()

    # --- Use sports already seeded by seed_service (startup) ---
    sports_result = await session.execute(select(Sport).where(Sport.is_active == True).order_by(Sport.id).limit(10))  # noqa: E712
    sports = list(sports_result.scalars().all())
    if not sports:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Sports not seeded. Restart the server to trigger the startup seed.",
        )

    # pick first modality of each sport (masculine when available)
    modalities: list[Modality] = []
    for sport in sports:
        mod_result = await session.execute(
            select(Modality).where(Modality.sport_id == sport.id, Modality.is_active == True).limit(1)  # noqa: E712
        )
        mod = mod_result.scalar_one_or_none()
        if mod:
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

        session.add(DelegationMember(delegation_id=delegation.id, user_id=chief_user.id, role=DelegationMemberRole.CHIEF))

        for j, (athlete_name, _sex) in enumerate(_ATHLETES):
            athlete = Athlete(
                name=f"{athlete_name} ({code})",
                code=f"ATL-{code}-{j + 1:03d}",
                birthdate=date(2000 + j, 3 + i, 10),
            )
            session.add(athlete)
            await session.flush()
            all_athletes.append(athlete)

            session.add(DelegationMember(delegation_id=delegation.id, user_id=chief_user.id, role=DelegationMemberRole.ATHLETE))

            if modalities:
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

    # --- Events & matches for up to 5 sports ---
    medals_awarded: list[dict[str, object]] = []
    for sport_idx, (sport, mod) in enumerate(zip(sports[:5], modalities[:5])):
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

        del_a = delegations[sport_idx % len(delegations)]
        del_b = delegations[(sport_idx + 1) % len(delegations)]
        del_bronze = delegations[(sport_idx + 2) % len(delegations)]

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
        medals_awarded.append({"sport": sport.name, "gold": del_a.name, "silver": del_b.name, "bronze": del_bronze.name})

    await session.commit()

    return {
        "seeded": True,
        "delegations": len(delegations),
        "athletes": len(all_athletes),
        "sports_referenced": len(sports),
        "week": week.week_number,
        "medals": medals_awarded,
    }


@router.post("/simulate/match/{match_id}", status_code=status.HTTP_200_OK)
async def simulate_match(
    match_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> dict[str, object]:
    try:
        await simulation_service.simulate_match(session, match_id)
        await session.commit()
        return {"simulated": True, "match_id": match_id}
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
