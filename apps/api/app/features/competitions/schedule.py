import logging
from datetime import date, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.event import Event, EventPhase, EventStatus
from app.domain.models.sport import Gender, Modality, Sport, SportType
from app.domain.models.competition import Competition
from app.domain.models.league import League, LeagueMode

logger = logging.getLogger(__name__)

# Tue–Sun offsets from week Monday start
_DAY_OFFSETS = [1, 2, 3, 4, 5, 6]
_SLOTS = ["09:00", "11:00", "13:30", "16:00", "18:30", "20:30"]


def _slot_time(slot_str: str):
    from datetime import time

    h, m = slot_str.split(":")
    return time(int(h), int(m))


def _modality_sort_key(modality: Modality, sport: Sport) -> tuple[int, str, int, str, int]:
    gender_order = {
        Gender.M: 0,
        Gender.F: 1,
        Gender.MIXED: 2,
    }
    sport_type_order = {
        SportType.TEAM: 0,
        SportType.INDIVIDUAL: 1,
    }
    return (
        sport_type_order.get(sport.sport_type, 99),
        sport.name,
        gender_order.get(modality.gender, 99),
        modality.category or "",
        modality.id or 0,
    )


def _hybrid_followup_phases(bracket_format: str) -> list[EventPhase]:
    if bracket_format in ("group-stage-se", "group-stage-de"):
        return [
            EventPhase.QUARTER,
            EventPhase.SEMI,
            EventPhase.BRONZE,
            EventPhase.FINAL,
        ]
    return []


async def generate_events(
    session: AsyncSession,
    competition: Competition,
) -> list[Event]:
    """
    For each sport_id in competition.sport_focus, find active modalities and create
    one Event per modality, spread across Tue–Sun slots.
    Returns list of created Events.
    """
    sport_ids: list[int] = [int(s) for s in (competition.sport_focus or [])]
    if not sport_ids:
        return []

    modalities_result = await session.execute(
        select(Modality, Sport)
        .join(Sport, Sport.id == Modality.sport_id)
        .where(
            Modality.sport_id.in_(sport_ids),
            Modality.is_active == True,  # noqa: E712
        )
    )
    modality_rows = list(modalities_result.all())
    modalities = [
        modality
        for modality, _sport in sorted(
            modality_rows,
            key=lambda row: _modality_sort_key(row[0], row[1]),
        )
    ]

    # Check league mode
    league = await session.get(League, competition.league_id)
    is_speed = league is not None and league.mode == LeagueMode.SPEED

    if is_speed:
        # Speed mode: all events start at 10-second intervals from competition start
        return await _generate_speed_events(session, competition, modalities)

    # Normal mode: spread across available days from start_date to end_date
    valid_days: list[date] = []
    current = competition.start_date
    while current <= competition.end_date:
        valid_days.append(current)
        current += timedelta(days=1)

    slots: list[tuple[date, object]] = []
    for day in valid_days:
        for slot_str in _SLOTS:
            slots.append((day, _slot_time(slot_str)))

    if len(modalities) > len(slots):
        raise RuntimeError(
            "Not enough schedule slots to create all seed events: "
            f"{len(modalities)} modalities for {len(slots)} slots."
        )

    required_slots = len(modalities) + sum(
        len(_hybrid_followup_phases(mod.rules_json.get("bracket_format", "group-stage")))
        for mod in modalities
    )
    if required_slots > len(slots):
        raise RuntimeError(
            "Not enough schedule slots to create all seed events: "
            f"{required_slots} required for {len(slots)} available slots."
        )

    created: list[Event] = []
    slot_index = 0
    for mod in modalities:
        event_date, start_time = slots[slot_index]
        slot_index += 1
        bracket_format = mod.rules_json.get("bracket_format", "group-stage")
        if bracket_format in ("single-elimination", "double-elimination"):
            phase = EventPhase.QUARTER
        else:
            phase = EventPhase.GROUPS
        event = Event(
            competition_id=competition.id,
            modality_id=mod.id,
            event_date=event_date,
            start_time=start_time,
            phase=phase,
            status=EventStatus.SCHEDULED,
        )
        session.add(event)
        created.append(event)

        for phase in _hybrid_followup_phases(bracket_format):
            followup_date, followup_time = slots[slot_index]
            slot_index += 1
            followup_event = Event(
                competition_id=competition.id,
                modality_id=mod.id,
                event_date=followup_date,
                start_time=followup_time,
                phase=phase,
                status=EventStatus.SCHEDULED,
            )
            session.add(followup_event)
            created.append(followup_event)

    await session.flush()
    for event in created:
        await session.refresh(event)
    logger.info(
        "schedule_generated competition_id=%s events=%s", competition.id, len(created)
    )
    return created


async def _generate_speed_events(
    session: AsyncSession,
    competition: Competition,
    modalities: list[Modality],
) -> list[Event]:
    """Speed mode: schedule all events at 10-second intervals starting from NOW."""
    from datetime import time

    # Start from now, not midnight
    now = datetime.now()
    base_time = now.replace(microsecond=0) + timedelta(seconds=10)  # Give 10s buffer
    interval_seconds = 10

    created: list[Event] = []
    slot_index = 0
    for mod in modalities:
        event_dt = base_time + timedelta(seconds=slot_index * interval_seconds)
        slot_index += 1
        bracket_format = mod.rules_json.get("bracket_format", "group-stage")
        if bracket_format in ("single-elimination", "double-elimination"):
            phase = EventPhase.QUARTER
        else:
            phase = EventPhase.GROUPS
        event = Event(
            competition_id=competition.id,
            modality_id=mod.id,
            event_date=event_dt.date(),
            start_time=event_dt.time(),
            phase=phase,
            status=EventStatus.SCHEDULED,
        )
        session.add(event)
        created.append(event)

        for followup_phase in _hybrid_followup_phases(bracket_format):
            followup_dt = base_time + timedelta(seconds=slot_index * interval_seconds)
            slot_index += 1
            followup_event = Event(
                competition_id=competition.id,
                modality_id=mod.id,
                event_date=followup_dt.date(),
                start_time=followup_dt.time(),
                phase=followup_phase,
                status=EventStatus.SCHEDULED,
            )
            session.add(followup_event)
            created.append(followup_event)

    await session.flush()
    for event in created:
        await session.refresh(event)
    logger.info(
        "speed_schedule_generated competition_id=%s events=%s interval=%ss start=%s",
        competition.id,
        len(created),
        interval_seconds,
        base_time,
    )
    return created
