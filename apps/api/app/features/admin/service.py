"""Startup seed: populates the 10 canonical sports + modalities + statistics schemas.
Runs only when the sports table is empty (idempotent).
"""

from datetime import date, datetime, time, timedelta
import logging
from typing import Any
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_factory
from app.shared.core.security import hash_password
from app.domain.models.athlete import Athlete, AthleteGender, AthleteModality
from app.domain.models.delegation import (
    Delegation,
    DelegationMember,
    DelegationMemberRole,
)
from app.domain.models.competition import Competition, CompetitionStatus
from app.domain.models.enrollment import Enrollment, EnrollmentStatus
from app.domain.models.event import Event, EventPhase, EventStatus
from app.domain.models.league import (
    League,
    LeagueMember,
    LeagueMemberRole,
    LeagueStatus,
)
from app.domain.models.sport import (
    Gender,
    Modality,
    Sport,
    SportStatisticsSchema,
    SportType,
)
from app.domain.models.user import User, UserRole

logger = logging.getLogger(__name__)

_SHOWCASE_SUPERADMIN_EMAIL = "test1@gmail.com"
_SHOWCASE_DELEGATIONS = [
    ("BRA", "Brasil"),
    ("ARG", "Argentina"),
    ("POR", "Portugal"),
    ("ESP", "Espanha"),
    ("USA", "Estados Unidos"),
    ("FRA", "Franca"),
    ("GER", "Alemanha"),
    ("ITA", "Italia"),
    ("JPN", "Japao"),
    ("NGA", "Nigeria"),
    ("CAN", "Canada"),
    ("MEX", "Mexico"),
    ("COL", "Colombia"),
    ("CHL", "Chile"),
    ("URU", "Uruguai"),
    ("PER", "Peru"),
    ("BOL", "Bolivia"),
    ("PAR", "Paraguai"),
    ("VEN", "Venezuela"),
    ("ECU", "Equador"),
    ("ENG", "Inglaterra"),
    ("NED", "Holanda"),
    ("BEL", "Belgica"),
    ("CRO", "Croacia"),
    ("SRB", "Servia"),
    ("SWI", "Suica"),
    ("SWE", "Suecia"),
    ("NOR", "Noruega"),
    ("DEN", "Dinamarca"),
    ("AUS", "Australia"),
    ("KOR", "Coreia do Sul"),
    ("CHN", "China"),
    ("IND", "India"),
    ("RSA", "Africa do Sul"),
    ("EGY", "Egito"),
    ("MAR", "Marrocos"),
    ("TUN", "Tunisia"),
    ("SEN", "Senegal"),
    ("GHA", "Gana"),
    ("CMR", "Camaroes"),
    ("CIV", "Costa do Marfim"),
    ("ALG", "Argelia"),
    ("RUS", "Russia"),
    ("UKR", "Ucrania"),
    ("POL", "Polonia"),
    ("CZE", "Republica Tcheca"),
    ("TUR", "Turquia"),
    ("GRE", "Grecia"),
    ("HUN", "Hungria"),
    ("ROU", "Romenia"),
    ("AUT", "Austria"),
    ("IRL", "Irlanda"),
    ("SCO", "Escocia"),
    ("WAL", "Pais de Gales"),
    ("NZL", "Nova Zelandia"),
    ("IRN", "Ira"),
    ("IRQ", "Iraque"),
    ("KSA", "Arabia Saudita"),
    ("UAE", "Emirados Arabes"),
    ("QAT", "Catar"),
    ("THA", "Tailandia"),
    ("VIE", "Vietna"),
    ("MAS", "Malasia"),
    ("IDN", "Indonesia"),
    ("PHI", "Filipinas"),
    ("PAK", "Paquistao"),
    ("BAN", "Bangladesh"),
]
_SHOWCASE_NAME_PARTS_M = [
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
]
_SHOWCASE_NAME_PARTS_F = [
    "Ana",
    "Beatriz",
    "Camila",
    "Daniela",
    "Fernanda",
    "Giovana",
    "Helena",
    "Isabela",
    "Julia",
    "Larissa",
]

_SPORTS: list[dict[str, Any]] = [
    {
        "name": "Futebol",
        "sport_type": SportType.TEAM,
        "description": "Futebol de campo — 11 jogadores por equipe.",
        "player_count": 11,
        "rules_json": {
            "max_athletes": 16,
            "substitutes": 5,
            "schedule_conflict_check": True,
            "has_overtime": True,
            "has_penalty_shootout": True,
            "max_substitutions": 5,
        },
        "stats_schema": {
            "team": [
                "wins",
                "losses",
                "draws",
                "points",
                "goals_for",
                "goals_against",
                "goal_diff",
                "cards_yellow",
                "cards_red",
            ],
            "individual": [
                "goals",
                "assists",
                "cards_yellow",
                "cards_red",
                "matches_played",
                "minutes_played",
            ],
        },
        "modalities": [
            {
                "name": "Futebol Masculino",
                "gender": Gender.M,
                "rules_json": {
                    "max_athletes": 16,
                    "substitutes": 5,
                    "gender": "M",
                    "schedule_conflict_check": True,
                    "bracket_format": "group-stage",
                    "teams_per_group": 4,
                },
            },
            {
                "name": "Futebol Feminino",
                "gender": Gender.F,
                "rules_json": {
                    "max_athletes": 16,
                    "substitutes": 5,
                    "gender": "F",
                    "schedule_conflict_check": True,
                    "bracket_format": "group-stage",
                    "teams_per_group": 4,
                },
            },
        ],
    },
    {
        "name": "Vôlei",
        "sport_type": SportType.TEAM,
        "description": "Vôlei indoor — 6 jogadores por equipe.",
        "player_count": 6,
        "rules_json": {
            "max_athletes": 12,
            "substitutes": 6,
            "schedule_conflict_check": True,
            "best_of": 5,
            "set_points": 25,
            "fifth_set_points": 15,
        },
        "stats_schema": {
            "team": [
                "wins",
                "losses",
                "sets_won",
                "sets_lost",
                "points_scored",
                "points_conceded",
            ],
            "individual": ["aces", "blocks", "attack_points", "errors", "sets_played"],
        },
        "modalities": [
            {
                "name": "Vôlei Masculino",
                "gender": Gender.M,
                "rules_json": {
                    "max_athletes": 12,
                    "substitutes": 6,
                    "gender": "M",
                    "schedule_conflict_check": True,
                    "bracket_format": "single-elimination",
                },
            },
            {
                "name": "Vôlei Feminino",
                "gender": Gender.F,
                "rules_json": {
                    "max_athletes": 12,
                    "substitutes": 6,
                    "gender": "F",
                    "schedule_conflict_check": True,
                    "bracket_format": "single-elimination",
                },
            },
        ],
    },
    {
        "name": "Basquete",
        "sport_type": SportType.TEAM,
        "description": "Basquete 5×5.",
        "player_count": 5,
        "rules_json": {
            "max_athletes": 12,
            "substitutes": 7,
            "schedule_conflict_check": True,
            "quarters": 4,
            "quarter_minutes": 10,
            "overtime_minutes": 5,
            "max_fouls": 5,
        },
        "stats_schema": {
            "team": ["wins", "losses", "points_for", "points_against", "point_diff"],
            "individual": [
                "points_1pt",
                "points_2pt",
                "points_3pt",
                "rebounds_off",
                "rebounds_def",
                "assists",
                "blocks",
                "steals",
                "fouls",
            ],
        },
        "modalities": [
            {
                "name": "Basquete Masculino",
                "gender": Gender.M,
                "rules_json": {
                    "max_athletes": 12,
                    "substitutes": 7,
                    "gender": "M",
                    "schedule_conflict_check": True,
                    "bracket_format": "single-elimination",
                },
            },
            {
                "name": "Basquete Feminino",
                "gender": Gender.F,
                "rules_json": {
                    "max_athletes": 12,
                    "substitutes": 7,
                    "gender": "F",
                    "schedule_conflict_check": True,
                    "bracket_format": "single-elimination",
                },
            },
        ],
    },
    {
        "name": "Atletismo",
        "sport_type": SportType.INDIVIDUAL,
        "description": "Atletismo de pista e campo.",
        "player_count": 1,
        "rules_json": {
            "schedule_conflict_check": True,
            "attempts": 3,
            "disqualification_on_false_start": True,
        },
        "stats_schema": {
            "individual": [
                "time_seconds",
                "distance_meters",
                "height_meters",
                "position",
                "attempts_used",
            ],
        },
        "modalities": [
            {
                "name": "100m Rasos Masculino",
                "gender": Gender.M,
                "rules_json": {
                    "gender": "M",
                    "schedule_conflict_check": True,
                    "metric": "time",
                    "bracket_format": "single-elimination",
                },
            },
            {
                "name": "100m Rasos Feminino",
                "gender": Gender.F,
                "rules_json": {
                    "gender": "F",
                    "schedule_conflict_check": True,
                    "metric": "time",
                    "bracket_format": "single-elimination",
                },
            },
            {
                "name": "400m Masculino",
                "gender": Gender.M,
                "rules_json": {
                    "gender": "M",
                    "schedule_conflict_check": True,
                    "metric": "time",
                    "bracket_format": "single-elimination",
                },
            },
            {
                "name": "400m Feminino",
                "gender": Gender.F,
                "rules_json": {
                    "gender": "F",
                    "schedule_conflict_check": True,
                    "metric": "time",
                    "bracket_format": "single-elimination",
                },
            },
            {
                "name": "Salto em Distância Masculino",
                "gender": Gender.M,
                "rules_json": {
                    "gender": "M",
                    "schedule_conflict_check": True,
                    "metric": "distance",
                    "attempts": 3,
                    "bracket_format": "single-elimination",
                },
            },
            {
                "name": "Salto em Distância Feminino",
                "gender": Gender.F,
                "rules_json": {
                    "gender": "F",
                    "schedule_conflict_check": True,
                    "metric": "distance",
                    "attempts": 3,
                    "bracket_format": "single-elimination",
                },
            },
            {
                "name": "Revezamento 4×100m Masculino",
                "gender": Gender.M,
                "rules_json": {
                    "gender": "M",
                    "max_athletes": 4,
                    "schedule_conflict_check": True,
                    "metric": "time",
                    "bracket_format": "single-elimination",
                },
            },
            {
                "name": "Revezamento 4×100m Feminino",
                "gender": Gender.F,
                "rules_json": {
                    "gender": "F",
                    "max_athletes": 4,
                    "schedule_conflict_check": True,
                    "metric": "time",
                    "bracket_format": "single-elimination",
                },
            },
        ],
    },
    {
        "name": "Judô",
        "sport_type": SportType.INDIVIDUAL,
        "description": "Judô olímpico com categorias por peso.",
        "player_count": 1,
        "rules_json": {
            "schedule_conflict_check": True,
            "has_repechage": True,
            "weight_categories": {
                "M": [
                    "até 60kg",
                    "até 66kg",
                    "até 73kg",
                    "até 81kg",
                    "até 90kg",
                    "+90kg",
                ],
                "F": [
                    "até 48kg",
                    "até 52kg",
                    "até 57kg",
                    "até 63kg",
                    "até 70kg",
                    "+70kg",
                ],
            },
        },
        "stats_schema": {
            "individual": [
                "ippons",
                "waza_aris",
                "shidos",
                "matches_won",
                "matches_lost",
            ],
        },
        "modalities": [
            {
                "name": "Judô Masculino até 66kg",
                "gender": Gender.M,
                "category": "até 66kg",
                "rules_json": {
                    "gender": "M",
                    "weight_category": "até 66kg",
                    "schedule_conflict_check": True,
                    "bracket_format": "double-elimination",
                },
            },
            {
                "name": "Judô Masculino até 81kg",
                "gender": Gender.M,
                "category": "até 81kg",
                "rules_json": {
                    "gender": "M",
                    "weight_category": "até 81kg",
                    "schedule_conflict_check": True,
                    "bracket_format": "double-elimination",
                },
            },
            {
                "name": "Judô Masculino +90kg",
                "gender": Gender.M,
                "category": "+90kg",
                "rules_json": {
                    "gender": "M",
                    "weight_category": "+90kg",
                    "schedule_conflict_check": True,
                    "bracket_format": "double-elimination",
                },
            },
            {
                "name": "Judô Feminino até 57kg",
                "gender": Gender.F,
                "category": "até 57kg",
                "rules_json": {
                    "gender": "F",
                    "weight_category": "até 57kg",
                    "schedule_conflict_check": True,
                    "bracket_format": "double-elimination",
                },
            },
            {
                "name": "Judô Feminino até 70kg",
                "gender": Gender.F,
                "category": "até 70kg",
                "rules_json": {
                    "gender": "F",
                    "weight_category": "até 70kg",
                    "schedule_conflict_check": True,
                    "bracket_format": "double-elimination",
                },
            },
            {
                "name": "Judô Feminino +70kg",
                "gender": Gender.F,
                "category": "+70kg",
                "rules_json": {
                    "gender": "F",
                    "weight_category": "+70kg",
                    "schedule_conflict_check": True,
                    "bracket_format": "double-elimination",
                },
            },
        ],
    },
    {
        "name": "Handebol",
        "sport_type": SportType.TEAM,
        "description": "Handebol indoor — 7 jogadores por equipe.",
        "player_count": 7,
        "rules_json": {
            "max_athletes": 14,
            "substitutes": 7,
            "schedule_conflict_check": True,
            "halves": 2,
            "half_minutes": 30,
            "has_overtime": True,
            "has_penalty_shootout": True,
        },
        "stats_schema": {
            "team": [
                "wins",
                "losses",
                "draws",
                "points",
                "goals_for",
                "goals_against",
                "goal_diff",
            ],
            "individual": [
                "goals",
                "assists",
                "saves",
                "cards_yellow",
                "cards_red",
                "cards_blue",
                "suspensions_2min",
            ],
        },
        "modalities": [
            {
                "name": "Handebol Masculino",
                "gender": Gender.M,
                "rules_json": {
                    "max_athletes": 14,
                    "substitutes": 7,
                    "gender": "M",
                    "schedule_conflict_check": True,
                    "bracket_format": "group-stage",
                    "teams_per_group": 4,
                },
            },
            {
                "name": "Handebol Feminino",
                "gender": Gender.F,
                "rules_json": {
                    "max_athletes": 14,
                    "substitutes": 7,
                    "gender": "F",
                    "schedule_conflict_check": True,
                    "bracket_format": "group-stage",
                    "teams_per_group": 4,
                },
            },
        ],
    },
    {
        "name": "Natação",
        "sport_type": SportType.INDIVIDUAL,
        "description": "Natação de piscina.",
        "player_count": 1,
        "rules_json": {
            "schedule_conflict_check": True,
            "timing": "electronic",
            "disqualification_on_early_start": True,
        },
        "stats_schema": {
            "individual": [
                "time_centiseconds",
                "position",
                "best_personal_centiseconds",
            ],
        },
        "modalities": [
            {
                "name": "50m Livre Masculino",
                "gender": Gender.M,
                "rules_json": {
                    "gender": "M",
                    "schedule_conflict_check": True,
                    "distance": 50,
                    "stroke": "livre",
                    "bracket_format": "single-elimination",
                },
            },
            {
                "name": "50m Livre Feminino",
                "gender": Gender.F,
                "rules_json": {
                    "gender": "F",
                    "schedule_conflict_check": True,
                    "distance": 50,
                    "stroke": "livre",
                    "bracket_format": "single-elimination",
                },
            },
            {
                "name": "100m Livre Masculino",
                "gender": Gender.M,
                "rules_json": {
                    "gender": "M",
                    "schedule_conflict_check": True,
                    "distance": 100,
                    "stroke": "livre",
                    "bracket_format": "single-elimination",
                },
            },
            {
                "name": "100m Livre Feminino",
                "gender": Gender.F,
                "rules_json": {
                    "gender": "F",
                    "schedule_conflict_check": True,
                    "distance": 100,
                    "stroke": "livre",
                    "bracket_format": "single-elimination",
                },
            },
            {
                "name": "50m Costas Masculino",
                "gender": Gender.M,
                "rules_json": {
                    "gender": "M",
                    "schedule_conflict_check": True,
                    "distance": 50,
                    "stroke": "costas",
                    "bracket_format": "single-elimination",
                },
            },
            {
                "name": "50m Costas Feminino",
                "gender": Gender.F,
                "rules_json": {
                    "gender": "F",
                    "schedule_conflict_check": True,
                    "distance": 50,
                    "stroke": "costas",
                    "bracket_format": "single-elimination",
                },
            },
            {
                "name": "100m Medley Masculino",
                "gender": Gender.M,
                "rules_json": {
                    "gender": "M",
                    "schedule_conflict_check": True,
                    "distance": 100,
                    "stroke": "medley",
                    "bracket_format": "single-elimination",
                },
            },
            {
                "name": "100m Medley Feminino",
                "gender": Gender.F,
                "rules_json": {
                    "gender": "F",
                    "schedule_conflict_check": True,
                    "distance": 100,
                    "stroke": "medley",
                    "bracket_format": "single-elimination",
                },
            },
            {
                "name": "Revezamento 4×50m Livre Misto",
                "gender": Gender.MIXED,
                "rules_json": {
                    "gender": "MIXED",
                    "max_athletes": 4,
                    "schedule_conflict_check": True,
                    "distance": 50,
                    "stroke": "livre",
                    "bracket_format": "single-elimination",
                },
            },
        ],
    },
    {
        "name": "Vôlei de Praia",
        "sport_type": SportType.TEAM,
        "description": "Vôlei de praia em dupla.",
        "player_count": 2,
        "rules_json": {
            "max_athletes": 2,
            "schedule_conflict_check": True,
            "best_of": 3,
            "set_points": 21,
            "third_set_points": 15,
            "no_substitutions": True,
        },
        "stats_schema": {
            "team": [
                "wins",
                "losses",
                "sets_won",
                "sets_lost",
                "points_scored",
                "points_conceded",
            ],
            "individual": ["aces", "blocks", "attack_points", "errors"],
        },
        "modalities": [
            {
                "name": "Vôlei de Praia Masculino",
                "gender": Gender.M,
                "rules_json": {
                    "max_athletes": 2,
                    "gender": "M",
                    "schedule_conflict_check": True,
                    "bracket_format": "group-stage",
                    "teams_per_group": 4,
                },
            },
            {
                "name": "Vôlei de Praia Feminino",
                "gender": Gender.F,
                "rules_json": {
                    "max_athletes": 2,
                    "gender": "F",
                    "schedule_conflict_check": True,
                    "bracket_format": "group-stage",
                    "teams_per_group": 4,
                },
            },
            {
                "name": "Vôlei de Praia Misto",
                "gender": Gender.MIXED,
                "rules_json": {
                    "max_athletes": 2,
                    "gender": "MIXED",
                    "schedule_conflict_check": True,
                    "bracket_format": "group-stage",
                    "teams_per_group": 4,
                },
            },
        ],
    },
    {
        "name": "Tênis de Mesa",
        "sport_type": SportType.INDIVIDUAL,
        "description": "Tênis de mesa — simples e duplas.",
        "player_count": 1,
        "rules_json": {
            "schedule_conflict_check": True,
            "best_of": 5,
            "points_per_set": 11,
            "serve_alternation": 2,
        },
        "stats_schema": {
            "individual": [
                "wins",
                "losses",
                "sets_won",
                "sets_lost",
                "points_for",
                "points_against",
            ],
        },
        "modalities": [
            {
                "name": "Tênis de Mesa Simples Masculino",
                "gender": Gender.M,
                "rules_json": {
                    "gender": "M",
                    "schedule_conflict_check": True,
                    "bracket_format": "single-elimination",
                },
            },
            {
                "name": "Tênis de Mesa Simples Feminino",
                "gender": Gender.F,
                "rules_json": {
                    "gender": "F",
                    "schedule_conflict_check": True,
                    "bracket_format": "single-elimination",
                },
            },
            {
                "name": "Tênis de Mesa Duplas Mistas",
                "gender": Gender.MIXED,
                "rules_json": {
                    "gender": "MIXED",
                    "max_athletes": 2,
                    "schedule_conflict_check": True,
                    "bracket_format": "single-elimination",
                },
            },
        ],
    },
    {
        "name": "Karatê",
        "sport_type": SportType.INDIVIDUAL,
        "description": "Karatê WKF — Kata e Kumite.",
        "player_count": 1,
        "rules_json": {
            "schedule_conflict_check": True,
            "has_repechage": True,
            "modality_types": ["kata", "kumite"],
        },
        "stats_schema": {
            "kumite": {
                "individual": [
                    "yukos",
                    "waza_aris",
                    "ippons",
                    "penalties",
                    "senshu",
                    "matches_won",
                    "matches_lost",
                ]
            },
            "kata": {"individual": ["judge_scores", "final_score", "rank"]},
        },
        "modalities": [
            {
                "name": "Karatê Kata Masculino",
                "gender": Gender.M,
                "category": "kata",
                "rules_json": {
                    "gender": "M",
                    "modality_type": "kata",
                    "schedule_conflict_check": True,
                    "bracket_format": "single-elimination",
                },
            },
            {
                "name": "Karatê Kata Feminino",
                "gender": Gender.F,
                "category": "kata",
                "rules_json": {
                    "gender": "F",
                    "modality_type": "kata",
                    "schedule_conflict_check": True,
                    "bracket_format": "single-elimination",
                },
            },
            {
                "name": "Karatê Kumite Masculino Leve",
                "gender": Gender.M,
                "category": "kumite-leve",
                "rules_json": {
                    "gender": "M",
                    "modality_type": "kumite",
                    "weight_category": "leve",
                    "schedule_conflict_check": True,
                    "bracket_format": "double-elimination",
                },
            },
            {
                "name": "Karatê Kumite Masculino Médio",
                "gender": Gender.M,
                "category": "kumite-medio",
                "rules_json": {
                    "gender": "M",
                    "modality_type": "kumite",
                    "weight_category": "médio",
                    "schedule_conflict_check": True,
                    "bracket_format": "double-elimination",
                },
            },
            {
                "name": "Karatê Kumite Feminino Leve",
                "gender": Gender.F,
                "category": "kumite-leve",
                "rules_json": {
                    "gender": "F",
                    "modality_type": "kumite",
                    "weight_category": "leve",
                    "schedule_conflict_check": True,
                    "bracket_format": "double-elimination",
                },
            },
        ],
    },
]


async def seed_sports() -> None:
    async with async_session_factory() as session:
        existing = await session.execute(select(Sport).limit(1))
        if existing.scalar_one_or_none() is not None:
            return

        for sport_data in _SPORTS:
            modalities_data = sport_data.pop("modalities")
            stats_schema = sport_data.pop("stats_schema")

            sport = Sport(**sport_data)
            session.add(sport)
            await session.flush()

            session.add(
                SportStatisticsSchema(sport_id=sport.id, stats_schema=stats_schema)
            )

            for mod_data in modalities_data:
                session.add(Modality(sport_id=sport.id, **mod_data))

            sport_data["modalities"] = modalities_data
            sport_data["stats_schema"] = stats_schema

        await session.commit()


async def seed_showcase_superadmin() -> None:
    async with async_session_factory() as session:
        user_result = await session.execute(
            select(User).where(User.email == _SHOWCASE_SUPERADMIN_EMAIL).limit(1)
        )
        user = user_result.scalar_one_or_none()
        if user is None:
            logger.warning(
                "seed_showcase_superadmin: user email=%s not found, skipping promotion",
                _SHOWCASE_SUPERADMIN_EMAIL,
            )
            return

        if user.role == UserRole.SUPERADMIN and user.is_superuser:
            return

        user.role = UserRole.SUPERADMIN
        user.is_superuser = True
        session.add(user)
        await session.commit()
        logger.info(
            "seed_showcase_superadmin: promoted user id=%s email=%s",
            user.id,
            user.email,
        )


async def seed_demo_league_data(
    session: AsyncSession,
    league_id: int,
) -> dict[str, object] | None:
    existing = await session.execute(
        select(Delegation.id).where(Delegation.league_id == league_id).limit(1)
    )
    if existing.scalar_one_or_none() is not None:
        return None

    today = date.today()
    competition_start = today - timedelta(days=today.weekday())

    sports_result = await session.execute(
        select(Sport).where(Sport.is_active == True).order_by(Sport.id)  # noqa: E712
    )
    sports = list(sports_result.scalars().all())
    if not sports:
        raise RuntimeError(
            "Sports not seeded. Restart the server to trigger the startup seed."
        )

    modalities: list[Modality] = []
    for sport in sports:
        mod_result = await session.execute(
            select(Modality)
            .where(Modality.sport_id == sport.id, Modality.is_active == True)  # noqa: E712
            .order_by(Modality.id)
        )
        modalities.extend(list(mod_result.scalars().all()))

    male_modalities = [m for m in modalities if m.gender == Gender.M]
    female_modalities = [m for m in modalities if m.gender == Gender.F]
    mixed_modalities = [m for m in modalities if m.gender == Gender.MIXED]

    delegations: list[Delegation] = []
    all_athletes: list[Athlete] = []

    def _build_athlete_name(
        gender: AthleteGender, index: int, delegation_code: str
    ) -> str:
        parts = (
            _SHOWCASE_NAME_PARTS_M
            if gender == AthleteGender.M
            else _SHOWCASE_NAME_PARTS_F
        )
        first = parts[index % len(parts)]
        family = delegation_code.lower().capitalize()
        return f"{first} {family} {index + 1:02d}"

    async def _create_athlete(
        delegation: Delegation,
        delegation_code: str,
        gender: AthleteGender,
        index: int,
        modality_links: list[Modality],
    ) -> Athlete:
        athlete_user = User(
            email=f"athlete.{league_id}.{delegation_code.lower()}.{gender.value.lower()}.{index + 1}@sports.local",
            name=_build_athlete_name(gender, index, delegation_code),
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
            name=_build_athlete_name(gender, index, delegation_code),
            code=f"ATL-{league_id}-{delegation_code}-{gender.value}-{index + 1:03d}",
            gender=gender,
            birthdate=date(1996 + (index % 8), ((index % 12) + 1), ((index % 27) + 1)),
        )
        session.add(athlete)
        await session.flush()

        session.add(
            DelegationMember(
                delegation_id=delegation.id,
                user_id=athlete_user.id,
                role=DelegationMemberRole.ATHLETE,
            )
        )
        for modality in modality_links:
            session.add(AthleteModality(athlete_id=athlete.id, modality_id=modality.id))

        all_athletes.append(athlete)
        return athlete

    for delegation_index, (code, name) in enumerate(_SHOWCASE_DELEGATIONS):
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

        for athlete_index, modality in enumerate(male_modalities):
            await _create_athlete(
                delegation=delegation,
                delegation_code=code,
                gender=AthleteGender.M,
                index=athlete_index,
                modality_links=[modality],
            )
        for athlete_index, modality in enumerate(female_modalities):
            await _create_athlete(
                delegation=delegation,
                delegation_code=code,
                gender=AthleteGender.F,
                index=athlete_index,
                modality_links=[modality],
            )
        mixed_offset = max(len(male_modalities), len(female_modalities))
        for athlete_index, modality in enumerate(mixed_modalities):
            await _create_athlete(
                delegation=delegation,
                delegation_code=code,
                gender=AthleteGender.M,
                index=mixed_offset + athlete_index,
                modality_links=[modality],
            )
            await _create_athlete(
                delegation=delegation,
                delegation_code=code,
                gender=AthleteGender.F,
                index=mixed_offset + athlete_index,
                modality_links=[modality],
            )

    await session.commit()

    return {
        "seeded": True,
        "league_id": league_id,
        "delegations": len(delegations),
        "athletes": len(all_athletes),
        "sports_referenced": len(sports),
    }


def _current_week_bounds(timezone_name: str) -> tuple[date, date]:
    local_today = datetime.now(ZoneInfo(timezone_name)).date()
    monday = local_today - timedelta(days=local_today.weekday())
    return monday, monday + timedelta(days=6)


async def _showcase_weekly_sport_focus(
    session: AsyncSession,
    league: League,
) -> list[int]:
    configured_ids = [int(sport_id) for sport_id in (league.sports_config or [])]
    sports_query = select(Sport).where(Sport.is_active == True)  # noqa: E712
    if configured_ids:
        sports_query = sports_query.where(Sport.id.in_(configured_ids))
    sports_result = await session.execute(sports_query.order_by(Sport.id))
    sports = list(sports_result.scalars().all())
    return [sport.id for sport in sports]


async def _seed_showcase_weekly_roster(
    session: AsyncSession,
    league: League,
    competition_id: int,
) -> bool:
    existing = await session.execute(
        select(Enrollment.id)
        .join(Event, Enrollment.event_id == Event.id)
        .where(Event.competition_id == competition_id)
        .limit(1)
    )
    if existing.scalar_one_or_none() is not None:
        return False

    event_rows = (
        await session.execute(
            select(Event, Modality)
            .join(Modality, Modality.id == Event.modality_id)
            .where(Event.competition_id == competition_id)
            .order_by(Event.id)
        )
    ).all()
    if not event_rows:
        return False

    athlete_rows = (
        await session.execute(
            select(Athlete, DelegationMember.delegation_id, AthleteModality.modality_id)
            .join(DelegationMember, DelegationMember.user_id == Athlete.user_id)
            .join(AthleteModality, AthleteModality.athlete_id == Athlete.id)
            .join(Delegation, Delegation.id == DelegationMember.delegation_id)
            .where(
                Athlete.league_id == league.id,
                Athlete.is_active == True,  # noqa: E712
                Delegation.league_id == league.id,
                DelegationMember.left_at == None,  # noqa: E711
            )
            .order_by(DelegationMember.delegation_id, Athlete.id)
        )
    ).all()
    if not athlete_rows:
        return False

    for event, modality in event_rows:
        for athlete, delegation_id, athlete_modality_id in athlete_rows:
            if athlete_modality_id != modality.id:
                continue
            if modality.gender == Gender.M and athlete.gender != AthleteGender.M:
                continue
            if modality.gender == Gender.F and athlete.gender != AthleteGender.F:
                continue
            session.add(
                Enrollment(
                    athlete_id=athlete.id,
                    event_id=event.id,
                    delegation_id=delegation_id,
                    status=EnrollmentStatus.APPROVED,
                )
            )

    await session.flush()
    return True


async def _copy_weekly_enrollments(
    session: AsyncSession,
    source_competition_id: int,
    target_competition_id: int,
) -> bool:
    existing = await session.execute(
        select(Enrollment.id)
        .join(Event, Enrollment.event_id == Event.id)
        .where(Event.competition_id == target_competition_id)
        .limit(1)
    )
    if existing.scalar_one_or_none() is not None:
        return False

    source_rows = (
        await session.execute(
            select(Enrollment, Event.modality_id)
            .join(Event, Enrollment.event_id == Event.id)
            .where(
                Event.competition_id == source_competition_id,
                Enrollment.status == EnrollmentStatus.APPROVED,
            )
            .order_by(Enrollment.id)
        )
    ).all()
    if not source_rows:
        return False

    target_events = list(
        (
            await session.execute(
                select(Event)
                .where(Event.competition_id == target_competition_id)
                .order_by(Event.id)
            )
        )
        .scalars()
        .all()
    )
    if not target_events:
        return False

    target_event_by_modality: dict[int, int] = {}
    for event in target_events:
        target_event_by_modality.setdefault(event.modality_id, event.id)

    copied = False
    seen: set[tuple[int, int, int]] = set()
    for enrollment, modality_id in source_rows:
        target_event_id = target_event_by_modality.get(modality_id)
        if target_event_id is None:
            continue
        key = (enrollment.athlete_id, target_event_id, enrollment.delegation_id)
        if key in seen:
            continue
        seen.add(key)
        session.add(
            Enrollment(
                athlete_id=enrollment.athlete_id,
                event_id=target_event_id,
                delegation_id=enrollment.delegation_id,
                status=EnrollmentStatus.APPROVED,
            )
        )
        copied = True

    await session.flush()
    return copied


async def _ensure_showcase_weekly_competition(
    session: AsyncSession,
    league: League,
) -> bool:
    week_start, week_end = _current_week_bounds(league.timezone)
    competition = (
        await session.execute(
            select(Competition)
            .where(
                Competition.league_id == league.id,
                Competition.start_date == week_start,
                Competition.end_date == week_end,
            )
            .order_by(Competition.id.desc())
            .limit(1)
        )
    ).scalar_one_or_none()

    created = False
    if competition is None:
        latest = (
            await session.execute(
                select(Competition)
                .where(Competition.league_id == league.id)
                .order_by(Competition.number.desc())
                .limit(1)
            )
        ).scalar_one_or_none()
        sport_focus = await _showcase_weekly_sport_focus(session, league)
        if not sport_focus:
            return False

        competition = Competition(
            league_id=league.id,
            number=(latest.number + 1) if latest is not None else 1,
            start_date=week_start,
            end_date=week_end,
            status=CompetitionStatus.SCHEDULED,
            sport_focus=sport_focus,
        )
        session.add(competition)
        await session.flush()

        from app.features.competitions import schedule as schedule_service

        await schedule_service.generate_events(session, competition)
        created = True

    previous = (
        await session.execute(
            select(Competition)
            .where(
                Competition.league_id == league.id,
                Competition.start_date < competition.start_date,
            )
            .order_by(Competition.start_date.desc(), Competition.number.desc())
            .limit(1)
        )
    ).scalar_one_or_none()

    copied = False
    if previous is not None:
        copied = await _copy_weekly_enrollments(session, previous.id, competition.id)

    if not copied:
        await _seed_showcase_weekly_roster(session, league, competition.id)

    await session.commit()
    return created


async def ensure_showcase_weekly_competitions() -> None:
    async with async_session_factory() as session:
        leagues = list(
            (
                await session.execute(
                    select(League).where(
                        League.status == LeagueStatus.ACTIVE,
                        League.is_showcase == True,  # noqa: E712
                        League.auto_simulate == True,  # noqa: E712
                    )
                )
            )
            .scalars()
            .all()
        )
        for league in leagues:
            created = await _ensure_showcase_weekly_competition(session, league)
            if created:
                logger.info(
                    "ensure_showcase_weekly_competitions: created competition league_id=%s",
                    league.id,
                )


async def create_showcase_league(
    session: AsyncSession,
    name: str,
    mode: str,
    sports_config: list[int],
    created_by_id: int,
) -> League:
    from app.domain.models.league import LeagueMode

    mode_enum = LeagueMode(mode.upper())
    is_speed = mode_enum == LeagueMode.SPEED

    # Auto-calculate timing config
    match_duration = 15 if is_speed else 300
    schedule_interval = 10 if is_speed else 300

    # Generate unique slug
    base_slug = name.lower().replace(" ", "-").replace("_", "-")
    slug = base_slug
    suffix = 1
    while True:
        existing = await session.execute(select(League).where(League.slug == slug))
        if existing.scalar_one_or_none() is None:
            break
        slug = f"{base_slug}-{suffix}"
        suffix += 1

    league = League(
        name=name,
        slug=slug,
        description=f"Showcase league ({mode.lower()} mode) with full automation",
        created_by_id=created_by_id,
        sports_config=sports_config,
        is_showcase=True,
        auto_simulate=True,
        transfer_window_enabled=not is_speed,
        timezone="America/Sao_Paulo",
        mode=mode_enum,
        match_duration_seconds=match_duration,
        schedule_interval_seconds=schedule_interval,
    )
    session.add(league)
    await session.flush()

    session.add(
        LeagueMember(
            league_id=league.id,
            user_id=created_by_id,
            role=LeagueMemberRole.LEAGUE_ADMIN,
        )
    )
    await session.commit()
    logger.info("create_showcase_league: created league_id=%s mode=%s", league.id, mode)
    return league


async def seed_showcase_league() -> None:
    async with async_session_factory() as session:
        existing = await session.execute(
            select(League).where(League.is_showcase == True)
        )  # noqa: E712
        existing_league = existing.scalar_one_or_none()
        if existing_league is not None:
            seeded = await seed_demo_league_data(session, existing_league.id)
            if seeded is not None:
                logger.info(
                    "seed_showcase_league: seeded showcase demo data league_id=%s",
                    existing_league.id,
                )
            await ensure_showcase_weekly_competitions()
            return

        superadmin_result = await session.execute(
            select(User)
            .where(User.role.in_([UserRole.SUPERADMIN, UserRole.ADMIN]))
            .order_by(User.id)
            .limit(1)
        )
        superadmin = superadmin_result.scalar_one_or_none()
        if superadmin is None:
            logger.warning(
                "seed_showcase_league: no superadmin found, skipping showcase league creation"
            )
            return

        sports_result = await session.execute(
            select(Sport).where(Sport.is_active == True).order_by(Sport.id)
        )  # noqa: E712
        sports = list(sports_result.scalars().all())
        sports_config = [s.id for s in sports]

        league = await create_showcase_league(
            session=session,
            name="Showcase League",
            mode="NORMAL",
            sports_config=sports_config,
            created_by_id=superadmin.id,
        )

    async with async_session_factory() as session:
        seeded = await seed_demo_league_data(session, league.id)
        if seeded is not None:
            logger.info(
                "seed_showcase_league: seeded showcase demo data league_id=%s",
                league.id,
            )
    await ensure_showcase_weekly_competitions()
