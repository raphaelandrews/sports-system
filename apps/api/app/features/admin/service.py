"""Startup seed: populates the 10 canonical sports + modalities + statistics schemas.
Runs only when the sports table is empty (idempotent).
"""

import logging
from typing import Any

from sqlalchemy import select

from app.database import async_session_factory
from app.domain.models.sport import (
    Gender,
    Modality,
    Sport,
    SportStatisticsSchema,
    SportType,
)

logger = logging.getLogger(__name__)

_SPORTS: list[dict[str, Any]] = [
    {
        "name": "Futebol",
        "sport_type": SportType.TEAM,
        "stats_schema": {
            "goals": {"type": "integer", "label": "Gols"},
            "assists": {"type": "integer", "label": "Assistências"},
            "yellow_cards": {"type": "integer", "label": "Cartões Amarelos"},
            "red_cards": {"type": "integer", "label": "Cartões Vermelhos"},
            "shots_on_target": {"type": "integer", "label": "Chutes a Gol"},
            "passes_completed": {"type": "integer", "label": "Passes Completados"},
            "tackles": {"type": "integer", "label": "Desarmes"},
            "saves": {"type": "integer", "label": "Defesas"},
            "minutes_played": {"type": "integer", "label": "Minutos Jogados"},
            "rating": {"type": "number", "label": "Nota"},
        },
        "modalities": [
            {
                "name": "Futebol Masculino",
                "gender": Gender.M,
                "category": "masculino",
                "rules_json": {
                    "gender": "M",
                    "modality_type": "team",
                    "team_size": 11,
                    "substitutes": 5,
                    "halves": 2,
                    "half_duration": 45,
                    "schedule_conflict_check": True,
                    "bracket_format": "group-stage-se",
                    "teams_per_group": 4,
                },
            },
            {
                "name": "Futebol Feminino",
                "gender": Gender.F,
                "category": "feminino",
                "rules_json": {
                    "gender": "F",
                    "modality_type": "team",
                    "team_size": 11,
                    "substitutes": 5,
                    "halves": 2,
                    "half_duration": 45,
                    "schedule_conflict_check": True,
                    "bracket_format": "group-stage-se",
                    "teams_per_group": 4,
                },
            },
        ],
    },
    {
        "name": "Basquete",
        "sport_type": SportType.TEAM,
        "stats_schema": {
            "points": {"type": "integer", "label": "Pontos"},
            "rebounds": {"type": "integer", "label": "Rebotes"},
            "assists": {"type": "integer", "label": "Assistências"},
            "steals": {"type": "integer", "label": "Roubos de Bola"},
            "blocks": {"type": "integer", "label": "Tocos"},
            "turnovers": {"type": "integer", "label": "Turnovers"},
            "fg_made": {"type": "integer", "label": "Cestas de Campo"},
            "fg_attempted": {"type": "integer", "label": "Tentativas de Campo"},
            "three_made": {"type": "integer", "label": "Cestas de 3"},
            "ft_made": {"type": "integer", "label": "Lances Livres"},
            "minutes_played": {"type": "integer", "label": "Minutos"},
            "rating": {"type": "number", "label": "Nota"},
        },
        "modalities": [
            {
                "name": "Basquete Masculino",
                "gender": Gender.M,
                "category": "masculino",
                "rules_json": {
                    "gender": "M",
                    "modality_type": "team",
                    "team_size": 5,
                    "substitutes": 7,
                    "quarters": 4,
                    "quarter_duration": 10,
                    "schedule_conflict_check": True,
                    "bracket_format": "single-elimination",
                },
            },
            {
                "name": "Basquete Feminino",
                "gender": Gender.F,
                "category": "feminino",
                "rules_json": {
                    "gender": "F",
                    "modality_type": "team",
                    "team_size": 5,
                    "substitutes": 7,
                    "quarters": 4,
                    "quarter_duration": 10,
                    "schedule_conflict_check": True,
                    "bracket_format": "single-elimination",
                },
            },
        ],
    },
    {
        "name": "Volei",
        "sport_type": SportType.TEAM,
        "stats_schema": {
            "points": {"type": "integer", "label": "Pontos"},
            "kills": {"type": "integer", "label": "Ataques"},
            "aces": {"type": "integer", "label": "Aces"},
            "blocks": {"type": "integer", "label": "Bloqueios"},
            "digs": {"type": "integer", "label": "Defesas"},
            "sets": {"type": "integer", "label": "Levantamentos"},
            "serve_errors": {"type": "integer", "label": "Erros de Saque"},
            "attack_errors": {"type": "integer", "label": "Erros de Ataque"},
            "reception_errors": {"type": "integer", "label": "Erros de Recepção"},
            "minutes_played": {"type": "integer", "label": "Minutos"},
            "rating": {"type": "number", "label": "Nota"},
        },
        "modalities": [
            {
                "name": "Volei Masculino",
                "gender": Gender.M,
                "category": "masculino",
                "rules_json": {
                    "gender": "M",
                    "modality_type": "team",
                    "team_size": 6,
                    "substitutes": 6,
                    "sets": 5,
                    "set_points": 25,
                    "schedule_conflict_check": True,
                    "bracket_format": "group-stage-se",
                    "teams_per_group": 4,
                },
            },
            {
                "name": "Volei Feminino",
                "gender": Gender.F,
                "category": "feminino",
                "rules_json": {
                    "gender": "F",
                    "modality_type": "team",
                    "team_size": 6,
                    "substitutes": 6,
                    "sets": 5,
                    "set_points": 25,
                    "schedule_conflict_check": True,
                    "bracket_format": "group-stage-se",
                    "teams_per_group": 4,
                },
            },
        ],
    },
    {
        "name": "Handebol",
        "sport_type": SportType.TEAM,
        "stats_schema": {
            "goals": {"type": "integer", "label": "Gols"},
            "assists": {"type": "integer", "label": "Assistências"},
            "steals": {"type": "integer", "label": "Roubos"},
            "blocks": {"type": "integer", "label": "Bloqueios"},
            "saves": {"type": "integer", "label": "Defesas"},
            "turnovers": {"type": "integer", "label": "Perdas"},
            "two_minutes": {"type": "integer", "label": "2 Minutos"},
            "red_cards": {"type": "integer", "label": "Cartões Vermelhos"},
            "yellow_cards": {"type": "integer", "label": "Cartões Amarelos"},
            "minutes_played": {"type": "integer", "label": "Minutos"},
            "rating": {"type": "number", "label": "Nota"},
        },
        "modalities": [
            {
                "name": "Handebol Masculino",
                "gender": Gender.M,
                "category": "masculino",
                "rules_json": {
                    "gender": "M",
                    "modality_type": "team",
                    "team_size": 7,
                    "substitutes": 7,
                    "halves": 2,
                    "half_duration": 30,
                    "schedule_conflict_check": True,
                    "bracket_format": "single-elimination",
                },
            },
            {
                "name": "Handebol Feminino",
                "gender": Gender.F,
                "category": "feminino",
                "rules_json": {
                    "gender": "F",
                    "modality_type": "team",
                    "team_size": 7,
                    "substitutes": 7,
                    "halves": 2,
                    "half_duration": 30,
                    "schedule_conflict_check": True,
                    "bracket_format": "single-elimination",
                },
            },
        ],
    },
    {
        "name": "Tenis",
        "sport_type": SportType.INDIVIDUAL,
        "stats_schema": {
            "aces": {"type": "integer", "label": "Aces"},
            "double_faults": {"type": "integer", "label": "Duplas Faltas"},
            "winners": {"type": "integer", "label": "Winners"},
            "unforced_errors": {"type": "integer", "label": "Erros Nao Forcados"},
            "first_serve_percentage": {"type": "number", "label": "% 1o Saque"},
            "break_points_won": {"type": "integer", "label": "Break Points"},
            "return_points_won": {"type": "integer", "label": "Pontos de Devolucao"},
            "net_points_won": {"type": "integer", "label": "Pontos na Rede"},
            "total_points": {"type": "integer", "label": "Total de Pontos"},
            "rating": {"type": "number", "label": "Nota"},
        },
        "modalities": [
            {
                "name": "Tenis Masculino",
                "gender": Gender.M,
                "category": "masculino",
                "rules_json": {
                    "gender": "M",
                    "modality_type": "individual",
                    "sets": 3,
                    "schedule_conflict_check": True,
                    "bracket_format": "single-elimination",
                },
            },
            {
                "name": "Tenis Feminino",
                "gender": Gender.F,
                "category": "feminino",
                "rules_json": {
                    "gender": "F",
                    "modality_type": "individual",
                    "sets": 3,
                    "schedule_conflict_check": True,
                    "bracket_format": "single-elimination",
                },
            },
        ],
    },
    {
        "name": "Natacao",
        "sport_type": SportType.INDIVIDUAL,
        "stats_schema": {
            "time_seconds": {"type": "number", "label": "Tempo (s)"},
            "split_50m": {"type": "number", "label": "Parcial 50m"},
            "split_100m": {"type": "number", "label": "Parcial 100m"},
            "reaction_time": {"type": "number", "label": "Tempo de Reacao"},
            "stroke_rate": {"type": "integer", "label": "Frequencia"},
            "turns": {"type": "integer", "label": "Viradas"},
            "distance": {"type": "integer", "label": "Distancia"},
            "style": {"type": "string", "label": "Estilo"},
            "pool": {"type": "string", "label": "Piscina"},
            "rating": {"type": "number", "label": "Nota"},
        },
        "modalities": [
            {
                "name": "Natacao 100m Livre Masculino",
                "gender": Gender.M,
                "category": "100m-livre",
                "rules_json": {
                    "gender": "M",
                    "modality_type": "individual",
                    "distance": 100,
                    "style": "livre",
                    "schedule_conflict_check": True,
                    "bracket_format": "group-stage",
                    "teams_per_group": 8,
                },
            },
            {
                "name": "Natacao 100m Livre Feminino",
                "gender": Gender.F,
                "category": "100m-livre",
                "rules_json": {
                    "gender": "F",
                    "modality_type": "individual",
                    "distance": 100,
                    "style": "livre",
                    "schedule_conflict_check": True,
                    "bracket_format": "group-stage",
                    "teams_per_group": 8,
                },
            },
        ],
    },
    {
        "name": "Atletismo",
        "sport_type": SportType.INDIVIDUAL,
        "stats_schema": {
            "time_seconds": {"type": "number", "label": "Tempo (s)"},
            "distance_meters": {"type": "integer", "label": "Distancia (m)"},
            "height_meters": {"type": "number", "label": "Altura (m)"},
            "reaction_time": {"type": "number", "label": "Tempo de Reacao"},
            "split_100m": {"type": "number", "label": "Parcial 100m"},
            "split_200m": {"type": "number", "label": "Parcial 200m"},
            "split_400m": {"type": "number", "label": "Parcial 400m"},
            "wind_speed": {"type": "number", "label": "Vento"},
            "attempts": {"type": "integer", "label": "Tentativas"},
            "fouls": {"type": "integer", "label": "Faltas"},
            "rating": {"type": "number", "label": "Nota"},
        },
        "modalities": [
            {
                "name": "100m Rasos Masculino",
                "gender": Gender.M,
                "category": "100m",
                "rules_json": {
                    "gender": "M",
                    "modality_type": "individual",
                    "distance": 100,
                    "schedule_conflict_check": True,
                    "bracket_format": "group-stage",
                    "teams_per_group": 8,
                },
            },
            {
                "name": "100m Rasos Feminino",
                "gender": Gender.F,
                "category": "100m",
                "rules_json": {
                    "gender": "F",
                    "modality_type": "individual",
                    "distance": 100,
                    "schedule_conflict_check": True,
                    "bracket_format": "group-stage",
                    "teams_per_group": 8,
                },
            },
        ],
    },
    {
        "name": "Judo",
        "sport_type": SportType.INDIVIDUAL,
        "stats_schema": {
            "ippons": {"type": "integer", "label": "Ippons"},
            "wazaaris": {"type": "integer", "label": "Waza-aris"},
            "yukos": {"type": "integer", "label": "Yukos"},
            "shidos": {"type": "integer", "label": "Shidos"},
            "match_duration": {"type": "integer", "label": "Duracao (s)"},
            "weight_category": {"type": "string", "label": "Categoria"},
            "techniques": {"type": "string", "label": "Tecnicas"},
            "rating": {"type": "number", "label": "Nota"},
        },
        "modalities": [
            {
                "name": "Judo Masculino Leve",
                "gender": Gender.M,
                "category": "leve",
                "rules_json": {
                    "gender": "M",
                    "modality_type": "individual",
                    "weight_category": "leve",
                    "schedule_conflict_check": True,
                    "bracket_format": "double-elimination",
                },
            },
            {
                "name": "Judo Feminino Leve",
                "gender": Gender.F,
                "category": "leve",
                "rules_json": {
                    "gender": "F",
                    "modality_type": "individual",
                    "weight_category": "leve",
                    "schedule_conflict_check": True,
                    "bracket_format": "double-elimination",
                },
            },
        ],
    },
    {
        "name": "Boxe",
        "sport_type": SportType.INDIVIDUAL,
        "stats_schema": {
            "punches_landed": {"type": "integer", "label": "Golpes"},
            "punches_thrown": {"type": "integer", "label": "Tentativas"},
            "knockdowns": {"type": "integer", "label": "Nocautes"},
            "rounds_won": {"type": "integer", "label": "Rounds Vencidos"},
            "head_punches": {"type": "integer", "label": "Golpes na Cabeca"},
            "body_punches": {"type": "integer", "label": "Golpes no Corpo"},
            "defense_percentage": {"type": "number", "label": "% Defesa"},
            "power_punches": {"type": "integer", "label": "Golpes de Potencia"},
            "stamina": {"type": "integer", "label": "Estamina"},
            "rating": {"type": "number", "label": "Nota"},
        },
        "modalities": [
            {
                "name": "Boxe Masculino Medio",
                "gender": Gender.M,
                "category": "medio",
                "rules_json": {
                    "gender": "M",
                    "modality_type": "individual",
                    "weight_category": "medio",
                    "rounds": 3,
                    "round_duration": 3,
                    "schedule_conflict_check": True,
                    "bracket_format": "single-elimination",
                },
            },
            {
                "name": "Boxe Feminino Leve",
                "gender": Gender.F,
                "category": "leve",
                "rules_json": {
                    "gender": "F",
                    "modality_type": "individual",
                    "weight_category": "leve",
                    "rounds": 3,
                    "round_duration": 3,
                    "schedule_conflict_check": True,
                    "bracket_format": "single-elimination",
                },
            },
        ],
    },
    {
        "name": "Carate",
        "sport_type": SportType.INDIVIDUAL,
        "stats_schema": {
            "points": {"type": "integer", "label": "Pontos"},
            "kicks": {"type": "integer", "label": "Chutes"},
            "punches": {"type": "integer", "label": "Socos"},
            "senshu": {"type": "integer", "label": "Senshu"},
            "penalties": {"type": "integer", "label": "Penalidades"},
            "warnings": {"type": "integer", "label": "Advertencias"},
            "disqualifications": {"type": "integer", "label": "Desqualificacoes"},
            "match_duration": {"type": "integer", "label": "Duracao (s)"},
            "techniques": {"type": "string", "label": "Tecnicas"},
            "rating": {"type": "number", "label": "Nota"},
        },
        "modalities": [
            {
                "name": "Karate Kumite Masculino Medio",
                "gender": Gender.M,
                "category": "kumite-medio",
                "rules_json": {
                    "gender": "M",
                    "modality_type": "individual",
                    "weight_category": "medio",
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
                    "modality_type": "individual",
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
