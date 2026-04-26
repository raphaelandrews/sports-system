import logging
from datetime import UTC, date, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.event import Event, Match, MatchStatus
from app.domain.models.narrative import AIGeneration, Narrative
from app.domain.models.result import Medal, Result
from app.domain.models.sport import Modality, Sport
from app.features.narratives import ai as ai_service

logger = logging.getLogger(__name__)

_NARRATIVE_SYSTEM = (
    "Você é um jornalista esportivo cobrindo uma olimpíada escolar/universitária. "
    "Escreva narrativas envolventes em português brasileiro, com estilo dinâmico e emocionante. "
    "Use markdown para formatar o texto. Máximo 400 palavras."
)


async def _build_context(
    session: AsyncSession, league_id: int, target_date: date
) -> str:
    matches_result = await session.execute(
        select(Match, Event, Modality, Sport)
        .join(Event, Event.id == Match.event_id)
        .join(Competition, Competition.id == Event.competition_id)
        .join(Modality, Modality.id == Event.modality_id)
        .join(Sport, Sport.id == Modality.sport_id)
        .where(
            Competition.league_id == league_id,
            Event.event_date == target_date,
            Match.status == MatchStatus.COMPLETED,
        )
    )
    rows = matches_result.all()

    if not rows:
        return f"Nenhuma partida concluída em {target_date}."

    lines = [f"Partidas concluídas em {target_date}:"]
    for match, event, modality, sport in rows:
        winner_side = ""
        if match.winner_delegation_id == match.team_a_delegation_id:
            winner_side = "Equipe A venceu"
        elif match.winner_delegation_id == match.team_b_delegation_id:
            winner_side = "Equipe B venceu"
        else:
            winner_side = "Empate"
        lines.append(
            f"- {sport.name} / {modality.name}: {match.score_a}×{match.score_b} ({winner_side})"
        )

    results_result = await session.execute(
        select(Result)
        .join(Match, Match.id == Result.match_id)
        .join(Event, Event.id == Match.event_id)
        .join(Competition, Competition.id == Event.competition_id)
        .where(
            Competition.league_id == league_id,
            Event.event_date == target_date,
            Result.medal.is_not(None),
        )
    )
    medals = results_result.scalars().all()
    if medals:
        lines.append("\nMedalhas do dia:")
        for r in medals:
            lines.append(f"  - Delegação {r.delegation_id}: {r.medal}")

    return "\n".join(lines)


async def get_for_date(
    session: AsyncSession, league_id: int, target_date: date
) -> Narrative | None:
    result = await session.execute(
        select(Narrative).where(
            Narrative.league_id == league_id, Narrative.narrative_date == target_date
        )
    )
    return result.scalar_one_or_none()


async def get_today(session: AsyncSession, league_id: int) -> Narrative | None:
    today = datetime.now(UTC).replace(tzinfo=None).date()
    return await get_for_date(session, league_id, today)


async def generate(
    session: AsyncSession, league_id: int, target_date: date | None = None
) -> Narrative:
    if target_date is None:
        target_date = datetime.now(UTC).replace(tzinfo=None).date()

    existing = await get_for_date(session, league_id, target_date)

    context = await _build_context(session, league_id, target_date)
    user_prompt = f"Gere a narrativa do dia para {target_date}:\n\n{context}"
    content = await ai_service.generate_text(
        _NARRATIVE_SYSTEM, user_prompt, max_tokens=800
    )

    if existing is not None:
        existing.content = content
        existing.generated_at = datetime.now(UTC).replace(tzinfo=None)
        session.add(existing)
        narrative = existing
    else:
        narrative = Narrative(
            league_id=league_id, narrative_date=target_date, content=content
        )
        session.add(narrative)

    session.add(AIGeneration(league_id=league_id, generation_type="narrative", count=1))
    await session.commit()
    await session.refresh(narrative)
    logger.info("narrative_generated date=%s", target_date)
    return narrative


async def get_history(session: AsyncSession, league_id: int) -> list[AIGeneration]:
    result = await session.execute(
        select(AIGeneration)
        .where(AIGeneration.league_id == league_id)
        .order_by(AIGeneration.created_at.desc())
        .limit(100)
    )
    return list(result.scalars().all())
