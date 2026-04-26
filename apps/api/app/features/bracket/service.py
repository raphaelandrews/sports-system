import logging
from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.enrollment import Enrollment, EnrollmentStatus
from app.domain.models.event import Event, EventPhase, EventStatus, Match, MatchStatus
from app.domain.models.sport import Modality

logger = logging.getLogger(__name__)

_PHASE_BY_COUNT = [
    (2, EventPhase.FINAL),
    (4, EventPhase.SEMI),
    (8, EventPhase.QUARTER),
]


def _first_round_phase(team_count: int) -> EventPhase:
    for threshold, phase in _PHASE_BY_COUNT:
        if team_count <= threshold:
            return phase
    return EventPhase.QUARTER


def _elim_phases_after(start: EventPhase) -> list[EventPhase]:
    order = [EventPhase.QUARTER, EventPhase.SEMI, EventPhase.BRONZE, EventPhase.FINAL]
    idx = order.index(start) if start in order else 0
    return order[idx + 1 :]


async def generate(session: AsyncSession, competition_id: int) -> int:
    """
    For each Event in the competition, read approved Enrollment delegation_ids
    and create matches according to the modality's bracket_format.
    Returns total matches created.
    """
    events_result = await session.execute(
        select(Event).where(Event.competition_id == competition_id)
    )
    events = list(events_result.scalars().all())

    modality_ids = list({e.modality_id for e in events})
    modalities_result = await session.execute(
        select(Modality).where(Modality.id.in_(modality_ids))
    )
    modality_map: dict[int, Modality] = {m.id: m for m in modalities_result.scalars().all()}

    events_by_modality: dict[int, list[Event]] = {}
    for event in events:
        events_by_modality.setdefault(event.modality_id, []).append(event)

    total = 0

    for modality_id, mod_events in events_by_modality.items():
        modality = modality_map.get(modality_id)
        bracket_format = modality.rules_json.get("bracket_format", "group-stage") if modality else "group-stage"

        if bracket_format == "group-stage":
            total += await _generate_group_stage(session, mod_events, modality)
        else:
            total += await _generate_elimination(session, mod_events, modality, bracket_format)

    await session.flush()
    return total


async def _generate_group_stage(
    session: AsyncSession,
    mod_events: list[Event],
    modality: Modality | None,
) -> int:
    teams_per_group: int | None = None
    if modality:
        val = modality.rules_json.get("teams_per_group")
        if isinstance(val, int) and val > 0:
            teams_per_group = val

    seed_event = next((e for e in mod_events if e.phase == EventPhase.GROUPS), mod_events[0])

    enroll_result = await session.execute(
        select(Enrollment.delegation_id)
        .where(
            Enrollment.event_id == seed_event.id,
            Enrollment.status == EnrollmentStatus.APPROVED,
        )
        .distinct()
    )
    delegation_ids = list(enroll_result.scalars().all())

    if len(delegation_ids) < 2:
        logger.info("bracket_skip group modality_id=%s delegations=%s", seed_event.modality_id, len(delegation_ids))
        return 0

    if teams_per_group and len(delegation_ids) > teams_per_group:
        groups = [
            delegation_ids[i : i + teams_per_group]
            for i in range(0, len(delegation_ids), teams_per_group)
        ]
    else:
        groups = [delegation_ids]

    existing_events = {e.id: e for e in mod_events if e.phase == EventPhase.GROUPS}
    group_events: list[tuple[Event, list[int]]] = []

    for g_idx, group_teams in enumerate(groups):
        if g_idx == 0:
            group_event = seed_event
        else:
            existing_list = [e for e in existing_events.values() if e.id != seed_event.id]
            if g_idx - 1 < len(existing_list):
                group_event = existing_list[g_idx - 1]
            else:
                group_event = Event(
                    competition_id=seed_event.competition_id,
                    modality_id=seed_event.modality_id,
                    event_date=seed_event.event_date,
                    start_time=seed_event.start_time,
                    venue=seed_event.venue,
                    phase=EventPhase.GROUPS,
                    status=EventStatus.SCHEDULED,
                )
                session.add(group_event)
                await session.flush()
                await session.refresh(group_event)
        group_events.append((group_event, group_teams))

    total = 0
    for group_event, group_teams in group_events:
        existing_matches_result = await session.execute(
            select(Match).where(Match.event_id == group_event.id).limit(1)
        )
        if existing_matches_result.scalar_one_or_none() is not None:
            logger.info("bracket_skip_existing event_id=%s", group_event.id)
            continue

        for i in range(len(group_teams)):
            for j in range(i + 1, len(group_teams)):
                session.add(Match(
                    event_id=group_event.id,
                    team_a_delegation_id=group_teams[i],
                    team_b_delegation_id=group_teams[j],
                    status=MatchStatus.SCHEDULED,
                ))
                total += 1

        logger.info("bracket_generated group event_id=%s matches=%s", group_event.id, total)

    return total


async def _generate_elimination(
    session: AsyncSession,
    mod_events: list[Event],
    modality: Modality | None,
    bracket_format: str,
) -> int:
    seed_event = mod_events[0]

    existing_matches_result = await session.execute(
        select(Match).where(Match.event_id == seed_event.id).limit(1)
    )
    if existing_matches_result.scalar_one_or_none() is not None:
        logger.info("bracket_skip_existing event_id=%s", seed_event.id)
        return 0

    enroll_result = await session.execute(
        select(Enrollment.delegation_id)
        .where(
            Enrollment.event_id == seed_event.id,
            Enrollment.status == EnrollmentStatus.APPROVED,
        )
        .distinct()
    )
    delegation_ids = list(enroll_result.scalars().all())

    if len(delegation_ids) < 2:
        logger.info("bracket_skip elim modality_id=%s delegations=%s", seed_event.modality_id, len(delegation_ids))
        return 0

    capped = delegation_ids[:8]
    first_round_phase = _first_round_phase(len(capped))

    seed_event.phase = first_round_phase

    pairs = _seed_pairs(capped)
    total = 0
    for team_a, team_b in pairs:
        session.add(Match(
            event_id=seed_event.id,
            team_a_delegation_id=team_a,
            team_b_delegation_id=team_b,
            status=MatchStatus.SCHEDULED,
        ))
        total += 1

    logger.info(
        "bracket_generated elim event_id=%s phase=%s matches=%s",
        seed_event.id, first_round_phase, total,
    )

    subsequent_phases = _elim_phases_after(first_round_phase)
    for day_offset, phase in enumerate(subsequent_phases, start=1):
        skeleton_event = Event(
            competition_id=seed_event.competition_id,
            modality_id=seed_event.modality_id,
            event_date=seed_event.event_date + timedelta(days=day_offset),
            start_time=seed_event.start_time,
            venue=seed_event.venue,
            phase=phase,
            status=EventStatus.SCHEDULED,
        )
        session.add(skeleton_event)
        logger.info(
            "bracket_skeleton event modality_id=%s phase=%s",
            seed_event.modality_id, phase,
        )

    return total


def _seed_pairs(teams: list[int]) -> list[tuple[int, int]]:
    n = len(teams)
    pairs: list[tuple[int, int]] = []
    for i in range(n // 2):
        pairs.append((teams[i], teams[n - 1 - i]))
    if n % 2 == 1:
        pairs.append((teams[n // 2], teams[n // 2]))
    return pairs
