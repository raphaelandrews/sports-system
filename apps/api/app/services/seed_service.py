"""Startup seed: populates the 10 canonical sports + modalities + statistics schemas.
Runs only when the sports table is empty (idempotent).
"""

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_factory
from app.models.sport import Gender, Modality, Sport, SportStatisticsSchema, SportType

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
            "team": ["wins", "losses", "draws", "points", "goals_for", "goals_against", "goal_diff", "cards_yellow", "cards_red"],
            "individual": ["goals", "assists", "cards_yellow", "cards_red", "matches_played", "minutes_played"],
        },
        "modalities": [
            {"name": "Futebol Masculino", "gender": Gender.M, "rules_json": {"max_athletes": 16, "substitutes": 5, "gender": "M", "schedule_conflict_check": True}},
            {"name": "Futebol Feminino", "gender": Gender.F, "rules_json": {"max_athletes": 16, "substitutes": 5, "gender": "F", "schedule_conflict_check": True}},
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
            "team": ["wins", "losses", "sets_won", "sets_lost", "points_scored", "points_conceded"],
            "individual": ["aces", "blocks", "attack_points", "errors", "sets_played"],
        },
        "modalities": [
            {"name": "Vôlei Masculino", "gender": Gender.M, "rules_json": {"max_athletes": 12, "substitutes": 6, "gender": "M", "schedule_conflict_check": True}},
            {"name": "Vôlei Feminino", "gender": Gender.F, "rules_json": {"max_athletes": 12, "substitutes": 6, "gender": "F", "schedule_conflict_check": True}},
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
            "individual": ["points_1pt", "points_2pt", "points_3pt", "rebounds_off", "rebounds_def", "assists", "blocks", "steals", "fouls"],
        },
        "modalities": [
            {"name": "Basquete Masculino", "gender": Gender.M, "rules_json": {"max_athletes": 12, "substitutes": 7, "gender": "M", "schedule_conflict_check": True}},
            {"name": "Basquete Feminino", "gender": Gender.F, "rules_json": {"max_athletes": 12, "substitutes": 7, "gender": "F", "schedule_conflict_check": True}},
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
            "individual": ["time_seconds", "distance_meters", "height_meters", "position", "attempts_used"],
        },
        "modalities": [
            {"name": "100m Rasos Masculino", "gender": Gender.M, "rules_json": {"gender": "M", "schedule_conflict_check": True, "metric": "time"}},
            {"name": "100m Rasos Feminino", "gender": Gender.F, "rules_json": {"gender": "F", "schedule_conflict_check": True, "metric": "time"}},
            {"name": "400m Masculino", "gender": Gender.M, "rules_json": {"gender": "M", "schedule_conflict_check": True, "metric": "time"}},
            {"name": "400m Feminino", "gender": Gender.F, "rules_json": {"gender": "F", "schedule_conflict_check": True, "metric": "time"}},
            {"name": "Salto em Distância Masculino", "gender": Gender.M, "rules_json": {"gender": "M", "schedule_conflict_check": True, "metric": "distance", "attempts": 3}},
            {"name": "Salto em Distância Feminino", "gender": Gender.F, "rules_json": {"gender": "F", "schedule_conflict_check": True, "metric": "distance", "attempts": 3}},
            {"name": "Revezamento 4×100m Masculino", "gender": Gender.M, "rules_json": {"gender": "M", "max_athletes": 4, "schedule_conflict_check": True, "metric": "time"}},
            {"name": "Revezamento 4×100m Feminino", "gender": Gender.F, "rules_json": {"gender": "F", "max_athletes": 4, "schedule_conflict_check": True, "metric": "time"}},
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
                "M": ["até 60kg", "até 66kg", "até 73kg", "até 81kg", "até 90kg", "+90kg"],
                "F": ["até 48kg", "até 52kg", "até 57kg", "até 63kg", "até 70kg", "+70kg"],
            },
        },
        "stats_schema": {
            "individual": ["ippons", "waza_aris", "shidos", "matches_won", "matches_lost"],
        },
        "modalities": [
            {"name": "Judô Masculino até 66kg", "gender": Gender.M, "category": "até 66kg", "rules_json": {"gender": "M", "weight_category": "até 66kg", "schedule_conflict_check": True}},
            {"name": "Judô Masculino até 81kg", "gender": Gender.M, "category": "até 81kg", "rules_json": {"gender": "M", "weight_category": "até 81kg", "schedule_conflict_check": True}},
            {"name": "Judô Masculino +90kg", "gender": Gender.M, "category": "+90kg", "rules_json": {"gender": "M", "weight_category": "+90kg", "schedule_conflict_check": True}},
            {"name": "Judô Feminino até 57kg", "gender": Gender.F, "category": "até 57kg", "rules_json": {"gender": "F", "weight_category": "até 57kg", "schedule_conflict_check": True}},
            {"name": "Judô Feminino até 70kg", "gender": Gender.F, "category": "até 70kg", "rules_json": {"gender": "F", "weight_category": "até 70kg", "schedule_conflict_check": True}},
            {"name": "Judô Feminino +70kg", "gender": Gender.F, "category": "+70kg", "rules_json": {"gender": "F", "weight_category": "+70kg", "schedule_conflict_check": True}},
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
            "team": ["wins", "losses", "draws", "points", "goals_for", "goals_against", "goal_diff"],
            "individual": ["goals", "assists", "saves", "cards_yellow", "cards_red", "cards_blue", "suspensions_2min"],
        },
        "modalities": [
            {"name": "Handebol Masculino", "gender": Gender.M, "rules_json": {"max_athletes": 14, "substitutes": 7, "gender": "M", "schedule_conflict_check": True}},
            {"name": "Handebol Feminino", "gender": Gender.F, "rules_json": {"max_athletes": 14, "substitutes": 7, "gender": "F", "schedule_conflict_check": True}},
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
            "individual": ["time_centiseconds", "position", "best_personal_centiseconds"],
        },
        "modalities": [
            {"name": "50m Livre Masculino", "gender": Gender.M, "rules_json": {"gender": "M", "schedule_conflict_check": True, "distance": 50, "stroke": "livre"}},
            {"name": "50m Livre Feminino", "gender": Gender.F, "rules_json": {"gender": "F", "schedule_conflict_check": True, "distance": 50, "stroke": "livre"}},
            {"name": "100m Livre Masculino", "gender": Gender.M, "rules_json": {"gender": "M", "schedule_conflict_check": True, "distance": 100, "stroke": "livre"}},
            {"name": "100m Livre Feminino", "gender": Gender.F, "rules_json": {"gender": "F", "schedule_conflict_check": True, "distance": 100, "stroke": "livre"}},
            {"name": "50m Costas Masculino", "gender": Gender.M, "rules_json": {"gender": "M", "schedule_conflict_check": True, "distance": 50, "stroke": "costas"}},
            {"name": "50m Costas Feminino", "gender": Gender.F, "rules_json": {"gender": "F", "schedule_conflict_check": True, "distance": 50, "stroke": "costas"}},
            {"name": "100m Medley Masculino", "gender": Gender.M, "rules_json": {"gender": "M", "schedule_conflict_check": True, "distance": 100, "stroke": "medley"}},
            {"name": "100m Medley Feminino", "gender": Gender.F, "rules_json": {"gender": "F", "schedule_conflict_check": True, "distance": 100, "stroke": "medley"}},
            {"name": "Revezamento 4×50m Livre Misto", "gender": Gender.MIXED, "rules_json": {"gender": "MIXED", "max_athletes": 4, "schedule_conflict_check": True, "distance": 50, "stroke": "livre"}},
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
            "team": ["wins", "losses", "sets_won", "sets_lost", "points_scored", "points_conceded"],
            "individual": ["aces", "blocks", "attack_points", "errors"],
        },
        "modalities": [
            {"name": "Vôlei de Praia Masculino", "gender": Gender.M, "rules_json": {"max_athletes": 2, "gender": "M", "schedule_conflict_check": True}},
            {"name": "Vôlei de Praia Feminino", "gender": Gender.F, "rules_json": {"max_athletes": 2, "gender": "F", "schedule_conflict_check": True}},
            {"name": "Vôlei de Praia Misto", "gender": Gender.MIXED, "rules_json": {"max_athletes": 2, "gender": "MIXED", "schedule_conflict_check": True}},
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
            "individual": ["wins", "losses", "sets_won", "sets_lost", "points_for", "points_against"],
        },
        "modalities": [
            {"name": "Tênis de Mesa Simples Masculino", "gender": Gender.M, "rules_json": {"gender": "M", "schedule_conflict_check": True}},
            {"name": "Tênis de Mesa Simples Feminino", "gender": Gender.F, "rules_json": {"gender": "F", "schedule_conflict_check": True}},
            {"name": "Tênis de Mesa Duplas Mistas", "gender": Gender.MIXED, "rules_json": {"gender": "MIXED", "max_athletes": 2, "schedule_conflict_check": True}},
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
            "kumite": {"individual": ["yukos", "waza_aris", "ippons", "penalties", "senshu", "matches_won", "matches_lost"]},
            "kata": {"individual": ["judge_scores", "final_score", "rank"]},
        },
        "modalities": [
            {"name": "Karatê Kata Masculino", "gender": Gender.M, "category": "kata", "rules_json": {"gender": "M", "modality_type": "kata", "schedule_conflict_check": True}},
            {"name": "Karatê Kata Feminino", "gender": Gender.F, "category": "kata", "rules_json": {"gender": "F", "modality_type": "kata", "schedule_conflict_check": True}},
            {"name": "Karatê Kumite Masculino Leve", "gender": Gender.M, "category": "kumite-leve", "rules_json": {"gender": "M", "modality_type": "kumite", "weight_category": "leve", "schedule_conflict_check": True}},
            {"name": "Karatê Kumite Masculino Médio", "gender": Gender.M, "category": "kumite-medio", "rules_json": {"gender": "M", "modality_type": "kumite", "weight_category": "médio", "schedule_conflict_check": True}},
            {"name": "Karatê Kumite Feminino Leve", "gender": Gender.F, "category": "kumite-leve", "rules_json": {"gender": "F", "modality_type": "kumite", "weight_category": "leve", "schedule_conflict_check": True}},
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

            session.add(SportStatisticsSchema(sport_id=sport.id, stats_schema=stats_schema))

            for mod_data in modalities_data:
                session.add(Modality(sport_id=sport.id, **mod_data))

            sport_data["modalities"] = modalities_data
            sport_data["stats_schema"] = stats_schema

        await session.commit()
