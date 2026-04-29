"""Comprehensive seed for populating the database with rich demo data.

Usage (from apps/api directory):
    uv run python -c "import asyncio; from app.features.admin.seed_data import seed_all; asyncio.run(seed_all())"
"""

from __future__ import annotations

import asyncio
import logging
import random
from datetime import UTC, date, datetime, time, timedelta
from enum import Enum
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_factory
from app.shared.core.security import hash_password
from app.domain.models.athlete import Athlete, AthleteGender, AthleteModality
from app.domain.models.competition import Competition, CompetitionStatus
from app.domain.models.delegation import (
    Delegation,
    DelegationMember,
    DelegationMemberRole,
)
from app.domain.models.enrollment import Enrollment, EnrollmentStatus
from app.domain.models.event import (
    Event,
    EventPhase,
    EventStatus,
    Match,
    MatchEvent,
    MatchEventType,
    MatchStatus,
)
from app.domain.models.league import League, LeagueMember, LeagueMemberRole, LeagueMode
from app.domain.models.result import AthleteStatistic, Medal, Record, Result
from app.domain.models.sport import Gender, Modality, Sport, SportType
from app.domain.models.user import User, UserRole
from app.features.bracket.service import generate as generate_bracket
from app.features.bracket.progression import check_and_advance_phases
from app.features.results import repository as result_repository
from app.features.competitions.schedule import generate_events

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# 1. CONFIGURATION
# ---------------------------------------------------------------------------

ADMIN_EMAIL = "raphael@andrews.sh"
ADMIN_NAME = "Raphael Andrews"
ADMIN_PASSWORD = "admin123"

NUM_DELEGATIONS = 8
ATHLETES_PER_DELEGATION_PER_GENDER = 2

random.seed(42)

_COUNTRIES: list[tuple[str, str]] = [
    ("BRA", "Brasil"),
    ("ARG", "Argentina"),
    ("USA", "Estados Unidos"),
    ("GER", "Alemanha"),
    ("FRA", "Franca"),
    ("ITA", "Italia"),
    ("ESP", "Espanha"),
    ("JPN", "Japao"),
]

_MALE_FIRST_NAMES = [
    "Lucas",
    "Mateus",
    "Rafael",
    "Joao",
    "Gabriel",
    "Caio",
    "Thiago",
    "Henrique",
    "Pedro",
    "Daniel",
    "Bruno",
    "Felipe",
    "Andre",
    "Marcos",
    "Vinicius",
    "Rodrigo",
    "Gustavo",
    "Leonardo",
    "Murilo",
    "Eduardo",
    "Antonio",
    "Carlos",
    "Paulo",
    "Luis",
    "Fernando",
    "Jorge",
    "Miguel",
    "Ricardo",
    "Alexandre",
    "Diego",
    "Marcelo",
    "Julio",
    "Roberto",
    "Sergio",
    "Fabio",
    "Renato",
    "Victor",
    "Samuel",
    "Arthur",
    "Davi",
]

_FEMALE_FIRST_NAMES = [
    "Ana",
    "Maria",
    "Julia",
    "Beatriz",
    "Larissa",
    "Camila",
    "Mariana",
    "Isabela",
    "Leticia",
    "Carolina",
    "Amanda",
    "Bruna",
    "Fernanda",
    "Patricia",
    "Vanessa",
    "Jessica",
    "Natalia",
    "Bianca",
    "Gabriela",
    "Raquel",
    "Daniela",
    "Aline",
    "Renata",
    "Priscila",
    "Tatiane",
    "Silvia",
    "Monica",
    "Luciana",
    "Cristina",
    "Elaine",
    "Sandra",
    "Viviane",
    "Tatiana",
    "Jaqueline",
    "Debora",
    "Simone",
    "Claudia",
    "Marta",
    "Sonia",
    "Rita",
]

_FAMILY_NAMES = [
    "Silva",
    "Santos",
    "Oliveira",
    "Souza",
    "Rodrigues",
    "Ferreira",
    "Alves",
    "Pereira",
    "Lima",
    "Gomes",
    "Costa",
    "Ribeiro",
    "Martins",
    "Carvalho",
    "Almeida",
    "Lopes",
    "Soares",
    "Fernandes",
    "Vieira",
    "Barbosa",
    "Rocha",
    "Dias",
    "Nascimento",
    "Andrade",
    "Moreira",
    "Nunes",
    "Marques",
    "Machado",
    "Mendes",
    "Freitas",
    "Cardoso",
    "Ramos",
    "Pinto",
    "Coelho",
    "Teixeira",
    "Araujo",
    "Cavalcanti",
    "Monteiro",
    "Moraes",
    "Castro",
]

COMP_START = date(2025, 12, 1)
COMP_END = date(2025, 12, 20)
LEAGUE_SLUG = "sports-hub"
LEAGUE_NAME = "Sports Hub"
LEAGUE_DESCRIPTION = (
    "Competicao completa com 8 delegacoes, 10 esportes, 1 a 20 de dezembro de 2025."
)


# ---------------------------------------------------------------------------
# 2. HELPERS
# ---------------------------------------------------------------------------


def _build_name(gender: AthleteGender, index: int) -> str:
    pool = _MALE_FIRST_NAMES if gender == AthleteGender.M else _FEMALE_FIRST_NAMES
    first = pool[index % len(pool)]
    family = _FAMILY_NAMES[index % len(_FAMILY_NAMES)]
    return f"{first} {family}"


def _athlete_birthdate(index: int) -> date:
    year = 1990 + (index % 12)
    month = (index % 12) + 1
    day = (index % 28) + 1
    return date(year, month, day)


def _enum_order(value: Enum) -> str:
    return value.value


def _sport_sort_key(sport: Sport) -> tuple[str, str, int]:
    return (_enum_order(sport.sport_type), sport.name, sport.id or 0)


def _modality_sort_key(
    modality: Modality, sport_map: dict[int, Sport]
) -> tuple[str, str, str, str, int]:
    sport = sport_map[modality.sport_id]
    return (
        _enum_order(sport.sport_type),
        sport.name,
        _enum_order(modality.gender),
        modality.category or "",
        modality.id or 0,
    )


async def _get_or_create_admin(session: AsyncSession) -> User:
    result = await session.execute(select(User).where(User.email == ADMIN_EMAIL))
    user = result.scalar_one_or_none()
    if user is None:
        user = User(
            email=ADMIN_EMAIL,
            name=ADMIN_NAME,
            hashed_password=hash_password(ADMIN_PASSWORD),
            role=UserRole.SUPERADMIN,
            is_superuser=True,
            is_active=True,
        )
        session.add(user)
        await session.flush()
        logger.info("seed: created admin user id=%s", user.id)
    else:
        if user.role != UserRole.SUPERADMIN:
            user.role = UserRole.SUPERADMIN
            user.is_superuser = True
            session.add(user)
        logger.info("seed: found existing admin user id=%s", user.id)
    return user


# ---------------------------------------------------------------------------
# 3. MAIN SEED
# ---------------------------------------------------------------------------


async def seed_all() -> None:
    """Run the complete database seed."""
    async with async_session_factory() as session:
        sports = await _ensure_sports(session)
        if not sports:
            raise RuntimeError("No sports found. Run seed_sports() first.")

        await _ensure_gs_de_modality(session, sports)

        admin = await _get_or_create_admin(session)
        await session.commit()

        league = await _create_league(session, admin.id, sports)
        logger.info("seed: created league id=%s", league.id)

        delegations = await _create_delegations(session, league.id, admin.id)
        logger.info("seed: created %s delegations", len(delegations))

        athletes = await _create_athletes(session, league.id, delegations, sports)
        logger.info("seed: created %s athletes", len(athletes))

        competition = await _create_competition(session, league.id, sports)
        logger.info("seed: created competition id=%s", competition.id)

        events = await generate_events(session, competition)
        logger.info("seed: created %s events", len(events))

        await _create_enrollments(session, events, athletes)
        logger.info("seed: enrollments created")

        matches_created = await generate_bracket(session, competition.id)
        logger.info("seed: initial bracket generated with %s matches", matches_created)

        competition.status = CompetitionStatus.ACTIVE
        session.add(competition)
        await session.commit()

        await _verify_medals(session, competition.league_id)

        logger.info(
            "seed: ALL DONE — league_id=%s competition_id=%s", league.id, competition.id
        )


# ---------------------------------------------------------------------------
# 4. SUB-SEEDERS
# ---------------------------------------------------------------------------


async def _ensure_sports(session: AsyncSession) -> list[Sport]:
    result = await session.execute(select(Sport).where(Sport.is_active == True))  # noqa: E712
    sports = list(result.scalars().all())
    return sorted(sports, key=_sport_sort_key)


async def _ensure_gs_de_modality(session: AsyncSession, sports: list[Sport]) -> None:
    futebol = next((s for s in sports if s.name == "Futebol"), None)
    if futebol is None:
        return
    existing = await session.execute(
        select(Modality).where(
            Modality.sport_id == futebol.id,
            Modality.name == "Futebol Salao Masculino",
        )
    )
    if existing.scalar_one_or_none() is None:
        session.add(
            Modality(
                sport_id=futebol.id,
                name="Futebol Salao Masculino",
                gender=Gender.M,
                category="salao-masculino",
                rules_json={
                    "gender": "M",
                    "modality_type": "team",
                    "team_size": 5,
                    "substitutes": 3,
                    "halves": 2,
                    "half_duration": 20,
                    "schedule_conflict_check": True,
                    "bracket_format": "group-stage-de",
                    "teams_per_group": 4,
                },
            )
        )
        await session.flush()


async def _create_league(
    session: AsyncSession, admin_id: int, sports: list[Sport]
) -> League:
    existing_result = await session.execute(
        select(League).where(League.slug == LEAGUE_SLUG)
    )
    if existing_result.scalar_one_or_none() is not None:
        raise RuntimeError(
            f"Seed league '{LEAGUE_SLUG}' already exists. "
            "Drop seed data before running the full seed again."
        )

    sports_config = [s.id for s in sports]
    league = League(
        name=LEAGUE_NAME,
        slug=LEAGUE_SLUG,
        description=LEAGUE_DESCRIPTION,
        created_by_id=admin_id,
        sports_config=sports_config,
        transfer_window_enabled=True,
        timezone="America/Sao_Paulo",
        mode=LeagueMode.NORMAL,
        match_duration_seconds=300,
        schedule_interval_seconds=300,
    )
    session.add(league)
    await session.flush()

    session.add(
        LeagueMember(
            league_id=league.id,
            user_id=admin_id,
            role=LeagueMemberRole.LEAGUE_ADMIN,
        )
    )
    await session.flush()
    return league


async def _create_delegations(
    session: AsyncSession, league_id: int, admin_id: int
) -> list[Delegation]:
    delegations: list[Delegation] = []
    for code, name in _COUNTRIES[:NUM_DELEGATIONS]:
        chief_user = User(
            email=f"chief.{code.lower()}.jw2025@sports.local",
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

        session.add(
            DelegationMember(
                delegation_id=delegation.id,
                user_id=chief_user.id,
                role=DelegationMemberRole.CHIEF,
            )
        )
        delegations.append(delegation)

    await session.flush()
    return delegations


async def _create_athletes(
    session: AsyncSession,
    league_id: int,
    delegations: list[Delegation],
    sports: list[Sport],
) -> list[Athlete]:
    athletes: list[Athlete] = []
    athlete_counter = 0

    modalities_result = await session.execute(
        select(Modality).where(Modality.is_active == True)  # noqa: E712
    )
    modalities = list(modalities_result.scalars().all())
    sport_map = {sport.id: sport for sport in sports}
    modalities = sorted(
        modalities, key=lambda modality: _modality_sort_key(modality, sport_map)
    )

    for delegation in delegations:
        for mod in modalities:
            mod_genders: list[AthleteGender] = []
            if mod.gender == Gender.M:
                mod_genders = [AthleteGender.M]
            elif mod.gender == Gender.F:
                mod_genders = [AthleteGender.F]
            elif mod.gender == Gender.MIXED:
                mod_genders = [AthleteGender.M, AthleteGender.F]

            for gender in mod_genders:
                for _ in range(ATHLETES_PER_DELEGATION_PER_GENDER):
                    athlete_counter += 1
                    name = _build_name(gender, athlete_counter)

                    athlete_user = User(
                        email=f"athlete.{athlete_counter}.{delegation.code.lower()}@sports.local",
                        name=name,
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
                        name=name,
                        gender=gender,
                        birthdate=_athlete_birthdate(athlete_counter),
                        code=f"ATL-{league_id}-{delegation.code}-{gender.value}-{athlete_counter:04d}",
                    )
                    session.add(athlete)
                    await session.flush()

                    session.add(
                        AthleteModality(
                            athlete_id=athlete.id,
                            modality_id=mod.id,
                        )
                    )
                    session.add(
                        DelegationMember(
                            delegation_id=delegation.id,
                            user_id=athlete_user.id,
                            role=DelegationMemberRole.ATHLETE,
                        )
                    )
                    athletes.append(athlete)

    await session.flush()
    return athletes


async def _create_competition(
    session: AsyncSession, league_id: int, sports: list[Sport]
) -> Competition:
    sport_focus = [s.id for s in sports]

    competition = Competition(
        league_id=league_id,
        number=1,
        start_date=COMP_START,
        end_date=COMP_END,
        status=CompetitionStatus.SCHEDULED,
        sport_focus=sorted(sport_focus),
    )
    session.add(competition)
    await session.flush()
    return competition


async def _create_enrollments(
    session: AsyncSession, events: list[Event], athletes: list[Athlete]
) -> None:
    """Enroll athletes into events based on their modalities."""
    modality_result = await session.execute(
        select(AthleteModality.athlete_id, AthleteModality.modality_id)
    )
    athlete_modalities: dict[int, set[int]] = {}
    for athlete_id, modality_id in modality_result.all():
        athlete_modalities.setdefault(athlete_id, set()).add(modality_id)

    event_modalities: dict[int, int] = {e.id: e.modality_id for e in events}

    delegation_result = await session.execute(
        select(Athlete.id, DelegationMember.delegation_id).join(
            DelegationMember, Athlete.user_id == DelegationMember.user_id
        )
    )
    athlete_delegations: dict[int, int] = {}
    for athlete_id, delegation_id in delegation_result.all():
        athlete_delegations[athlete_id] = delegation_id

    enrollments_created = 0
    for event in events:
        mod_id = event_modalities.get(event.id)
        if mod_id is None:
            continue

        eligible = [
            a for a in athletes if mod_id in athlete_modalities.get(a.id, set())
        ]

        max_enroll = 64
        if len(eligible) > max_enroll:
            eligible = eligible[:max_enroll]

        for athlete in eligible:
            delegation_id = athlete_delegations.get(athlete.id)
            if delegation_id is None:
                continue

            session.add(
                Enrollment(
                    athlete_id=athlete.id,
                    event_id=event.id,
                    delegation_id=delegation_id,
                    status=EnrollmentStatus.APPROVED,
                )
            )
            enrollments_created += 1

    logger.info("seed: %s enrollments created", enrollments_created)


async def _verify_medals(session: AsyncSession, league_id: int) -> None:
    """Log medal counts for verification."""
    rows = await result_repository.get_medal_board(session, league_id)
    total_medals = sum(r.gold + r.silver + r.bronze for r in rows)
    logger.info(
        "seed: medal board has %s delegations, %s total medals", len(rows), total_medals
    )
    for row in rows:
        delegation = await session.get(Delegation, row.delegation_id)
        name = delegation.name if delegation else "Unknown"
        logger.info(
            "seed: %s — %s gold, %s silver, %s bronze",
            name,
            row.gold,
            row.silver,
            row.bronze,
        )


# ---------------------------------------------------------------------------
# 6. ENTRY POINT
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    asyncio.run(seed_all())
