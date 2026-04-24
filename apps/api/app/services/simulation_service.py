import logging
import random
from datetime import UTC, datetime, timedelta
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import sse
from app.models.competition import Competition
from app.models.enrollment import Enrollment, EnrollmentStatus
from app.models.event import Event, EventPhase, Match, MatchEvent, MatchEventType, MatchStatus
from app.models.result import AthleteStatistic, Medal, Record, Result
from app.models.sport import Modality, Sport, SportType
from app.repositories import result_repository

logger = logging.getLogger(__name__)


def _now() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def _phase_medals(phase: EventPhase) -> tuple[int, Optional[Medal], int, Optional[Medal]]:
    """Returns (winner_rank, winner_medal, loser_rank, loser_medal)."""
    if phase == EventPhase.FINAL:
        return 1, Medal.GOLD, 2, Medal.SILVER
    if phase == EventPhase.BRONZE:
        return 3, Medal.BRONZE, 4, None
    return 1, None, 2, None


# -- Sport-specific score generators --

def _sim_football(phase: EventPhase) -> tuple[int, int, list[tuple]]:
    sa = random.randint(0, 4)
    sb = random.randint(0, 4)
    knockout = phase in (EventPhase.QUARTER, EventPhase.SEMI, EventPhase.FINAL, EventPhase.BRONZE)
    if knockout and sa == sb:
        if random.random() < 0.5:
            sa += 1
        else:
            sb += 1
    events: list[tuple] = []
    for _ in range(sa):
        events.append((MatchEventType.GOAL, random.randint(1, 90), "a"))
    for _ in range(sb):
        events.append((MatchEventType.GOAL, random.randint(1, 90), "b"))
    return sa, sb, events


def _sim_handball(phase: EventPhase) -> tuple[int, int, list[tuple]]:
    sa = random.randint(15, 35)
    sb = random.randint(15, 35)
    knockout = phase in (EventPhase.QUARTER, EventPhase.SEMI, EventPhase.FINAL, EventPhase.BRONZE)
    if knockout and sa == sb:
        sa += random.randint(1, 5)
    return sa, sb, []


def _sim_basketball(phase: EventPhase) -> tuple[int, int, list[tuple]]:
    sa = random.randint(50, 90)
    sb = random.randint(50, 90)
    knockout = phase in (EventPhase.QUARTER, EventPhase.SEMI, EventPhase.FINAL, EventPhase.BRONZE)
    if knockout and sa == sb:
        sa += random.randint(2, 10)
    events: list[tuple] = []
    for _ in range(sa // 6):
        events.append((MatchEventType.POINT, random.randint(1, 40), "a"))
    for _ in range(sb // 6):
        events.append((MatchEventType.POINT, random.randint(1, 40), "b"))
    return sa, sb, events


def _sim_volleyball(best_of: int = 5) -> tuple[int, int, list[tuple]]:
    win_sets = (best_of + 1) // 2
    lose_sets = random.randint(0, win_sets - 1)
    if random.random() < 0.5:
        return win_sets, lose_sets, []
    return lose_sets, win_sets, []


def _sim_table_tennis() -> tuple[int, int, list[tuple]]:
    win_sets = 3
    lose_sets = random.randint(0, 2)
    if random.random() < 0.5:
        return win_sets, lose_sets, []
    return lose_sets, win_sets, []


def _sim_combat() -> tuple[int, int, list[tuple]]:
    outcome = random.choice(["ippon", "waza_ari", "decision"])
    a_wins = random.random() < 0.5
    if outcome == "ippon":
        slot = "a" if a_wins else "b"
        evt = [(MatchEventType.IPPON, random.randint(1, 5), slot)]
        return (10, 0, evt) if a_wins else (0, 10, evt)
    if outcome == "waza_ari":
        slot = "a" if a_wins else "b"
        evt = [(MatchEventType.WAZA_ARI, random.randint(1, 5), slot)]
        return (5, 0, evt) if a_wins else (0, 5, evt)
    high = random.randint(2, 9)
    low = random.randint(0, high - 1)
    return (high, low, []) if a_wins else (low, high, [])


def _sim_timed() -> tuple[int, int, list[tuple]]:
    """Time in centiseconds — lower wins."""
    sa = random.randint(800, 6000)
    sb = random.randint(800, 6000)
    while sa == sb:
        sb = random.randint(800, 6000)
    return sa, sb, []


def _generate_scores(sport: Sport, event: Event) -> tuple[int, int, list[tuple], bool]:
    """Returns (score_a, score_b, raw_events, lower_wins)."""
    name = sport.name
    if name == "Futebol":
        sa, sb, evts = _sim_football(event.phase)
        return sa, sb, evts, False
    if name == "Handebol":
        sa, sb, evts = _sim_handball(event.phase)
        return sa, sb, evts, False
    if name == "Basquete":
        sa, sb, evts = _sim_basketball(event.phase)
        return sa, sb, evts, False
    if name == "Vôlei":
        sa, sb, evts = _sim_volleyball(best_of=5)
        return sa, sb, evts, False
    if name == "Vôlei de Praia":
        sa, sb, evts = _sim_volleyball(best_of=3)
        return sa, sb, evts, False
    if name == "Tênis de Mesa":
        sa, sb, evts = _sim_table_tennis()
        return sa, sb, evts, False
    if name in ("Judô", "Karatê"):
        sa, sb, evts = _sim_combat()
        return sa, sb, evts, False
    if name in ("Atletismo", "Natação"):
        sa, sb, evts = _sim_timed()
        return sa, sb, evts, True
    # Generic fallback
    sa = random.randint(0, 10)
    sb = random.randint(0, 10)
    if sa == sb:
        sa += 1
    return sa, sb, [], False


async def _check_and_update_record(
    session: AsyncSession,
    modality: Modality,
    event: Event,
    winner_delegation_id: int,
    winner_score: int,
    lower_wins: bool,
) -> None:
    existing = await result_repository.get_best_record_for_modality(session, modality.id)

    is_new_record = False
    if existing is None:
        is_new_record = True
    else:
        current_val = float(existing.value)
        if lower_wins:
            is_new_record = winner_score < current_val
        else:
            is_new_record = winner_score > current_val

    if not is_new_record:
        return

    # Pick any enrolled athlete from the winning delegation as the record holder
    enrolled_result = await session.execute(
        select(Enrollment).where(
            Enrollment.event_id == event.id,
            Enrollment.delegation_id == winner_delegation_id,
            Enrollment.status == EnrollmentStatus.APPROVED,
        ).limit(1)
    )
    enrollment = enrolled_result.scalar_one_or_none()
    if enrollment is None:
        return  # No athlete to attribute record to — skip

    session.add(Record(
        modality_id=modality.id,
        athlete_id=enrollment.athlete_id,
        delegation_id_at_time=winner_delegation_id,
        value=str(winner_score),
        competition_id=event.competition_id,
    ))
    logger.info(
        "new_record modality_id=%s value=%s athlete_id=%s",
        modality.id, winner_score, enrollment.athlete_id,
    )


async def simulate_match(session: AsyncSession, match_id: int) -> None:
    match = await session.get(Match, match_id)
    if match is None:
        raise ValueError(f"Match {match_id} not found")
    if match.status == MatchStatus.COMPLETED:
        return

    event = await session.get(Event, match.event_id)
    competition = await session.get(Competition, event.competition_id)
    modality = await session.get(Modality, event.modality_id)
    sport = await session.get(Sport, modality.sport_id)

    now = _now()
    score_a, score_b, raw_events, lower_wins = _generate_scores(sport, event)

    if lower_wins:
        winner_id = match.team_a_delegation_id if score_a < score_b else match.team_b_delegation_id
    elif score_a != score_b:
        winner_id = match.team_a_delegation_id if score_a > score_b else match.team_b_delegation_id
    else:
        winner_id = None  # draw (group stage only)

    match.score_a = score_a
    match.score_b = score_b
    match.winner_delegation_id = winner_id
    match.status = MatchStatus.COMPLETED
    if match.started_at is None:
        match.started_at = now - timedelta(minutes=5)
    match.ended_at = now
    session.add(match)

    # Match events
    for event_type, minute, slot in raw_events:
        delegation_id_at_time = (
            match.team_a_delegation_id if slot == "a" else match.team_b_delegation_id
        )
        session.add(MatchEvent(
            match_id=match.id,
            minute=minute,
            event_type=event_type,
            delegation_id_at_time=delegation_id_at_time,
        ))

    # Results with medals
    winner_rank, winner_medal, loser_rank, loser_medal = _phase_medals(event.phase)

    if winner_id is not None:
        loser_id = (
            match.team_b_delegation_id
            if winner_id == match.team_a_delegation_id
            else match.team_a_delegation_id
        )
        winner_score = score_a if winner_id == match.team_a_delegation_id else score_b
        loser_score = score_b if winner_id == match.team_a_delegation_id else score_a
        session.add(Result(
            match_id=match.id,
            delegation_id=winner_id,
            rank=winner_rank,
            medal=winner_medal,
            value_json={"score": winner_score},
        ))
        session.add(Result(
            match_id=match.id,
            delegation_id=loser_id,
            rank=loser_rank,
            medal=loser_medal,
            value_json={"score": loser_score},
        ))
    else:
        session.add(Result(match_id=match.id, delegation_id=match.team_a_delegation_id, rank=1, value_json={"score": score_a}))
        session.add(Result(match_id=match.id, delegation_id=match.team_b_delegation_id, rank=1, value_json={"score": score_b}))

    # Athlete statistics
    enrolled = await session.execute(
        select(Enrollment).where(
            Enrollment.event_id == event.id,
            Enrollment.status == EnrollmentStatus.APPROVED,
        )
    )
    for enrollment in enrolled.scalars().all():
        stat = await result_repository.get_athlete_statistic(
            session, enrollment.athlete_id, modality.sport_id, event.competition_id
        )
        if stat is None:
            stat = AthleteStatistic(
                athlete_id=enrollment.athlete_id,
                sport_id=modality.sport_id,
                competition_id=event.competition_id,
                stats_json={},
            )
        s = dict(stat.stats_json)
        s["matches_played"] = s.get("matches_played", 0) + 1
        if winner_id == enrollment.delegation_id:
            s["wins"] = s.get("wins", 0) + 1
        elif winner_id is not None:
            s["losses"] = s.get("losses", 0) + 1
        else:
            s["draws"] = s.get("draws", 0) + 1
        stat.stats_json = s
        await result_repository.save_athlete_statistic(session, stat)

    # Record check — best mark per modality
    if winner_id is not None:
        winner_score = score_a if winner_id == match.team_a_delegation_id else score_b
        await _check_and_update_record(
            session,
            modality=modality,
            event=event,
            winner_delegation_id=winner_id,
            winner_score=winner_score,
            lower_wins=lower_wins,
        )

    await session.flush()

    await sse.broadcast(match_id, {
        "type": "match_finished",
        "match_id": match_id,
        "score_a": score_a,
        "score_b": score_b,
        "winner_delegation_id": winner_id,
    })
    if competition is not None:
        await sse.broadcast_medal_board(competition.league_id, {"type": "medal_board_updated", "match_id": match_id})

    logger.info(
        "simulate_match match_id=%s sport=%s score=%s-%s winner=%s",
        match_id, sport.name, score_a, score_b, winner_id,
    )
