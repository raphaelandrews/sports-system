import logging
from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select

from app.config import settings
from app.database import async_session_factory
from app.domain.models.competition import Competition, CompetitionStatus
from app.domain.models.enrollment import Enrollment, EnrollmentStatus
from app.domain.models.athlete import Athlete
from app.domain.models.event import Event, EventStatus, Match, MatchStatus
from app.domain.models.user import NotificationType
from app.features.leagues import repository as league_repository
from app.features.notifications import service as notification_service

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(timezone="UTC")


async def _auto_lock_competitions() -> None:
    now_utc = datetime.now(UTC).replace(tzinfo=None)
    async with async_session_factory() as session:
        leagues = await league_repository.get_active_leagues(session)
        for league in leagues:
            result = await session.execute(
                select(Competition).where(
                    Competition.league_id == league.id,
                    Competition.status == CompetitionStatus.SCHEDULED,
                )
            )
            competitions = result.scalars().all()
            for competition in competitions:
                first_event_result = await session.execute(
                    select(Event)
                    .where(Event.competition_id == competition.id)
                    .order_by(Event.event_date, Event.start_time)
                    .limit(1)
                )
                event = first_event_result.scalar_one_or_none()
                if event is None:
                    continue
                event_dt = datetime.combine(event.event_date, event.start_time)
                if event_dt < now_utc:
                    competition.status = CompetitionStatus.LOCKED
                    session.add(competition)
                    from app.features.bracket import service as bracket_service

                    matches = await bracket_service.generate(session, competition.id)
                    logger.info(
                        "auto_lock_competition competition_id=%s league_id=%s bracket_matches=%s",
                        competition.id,
                        league.id,
                        matches,
                    )
        await session.commit()


async def _send_match_reminders() -> None:
    async with async_session_factory() as session:
        leagues = await league_repository.get_active_leagues(session)
        for league in leagues:
            tz = ZoneInfo(league.timezone)
            tomorrow_start = datetime.now(tz).replace(
                hour=0, minute=0, second=0, microsecond=0
            ) + timedelta(days=1)
            tomorrow_end = tomorrow_start + timedelta(days=1)
            t_start = tomorrow_start.astimezone(UTC).time()
            t_end = tomorrow_end.astimezone(UTC).time()
            result = await session.execute(
                select(Event)
                .join(Competition, Event.competition_id == Competition.id)
                .where(
                    Competition.league_id == league.id,
                    Event.event_date == tomorrow_start.date(),
                    Event.start_time >= t_start,
                    Event.start_time < t_end,
                )
            )
            events = result.scalars().all()
            for event in events:
                # Find approved enrollments for this event
                enrollment_result = await session.execute(
                    select(Enrollment, Athlete)
                    .join(Athlete, Enrollment.athlete_id == Athlete.id)
                    .where(
                        Enrollment.event_id == event.id,
                        Enrollment.status == EnrollmentStatus.APPROVED,
                        Athlete.user_id.isnot(None),
                    )
                )
                notified_users = set()
                for enrollment, athlete in enrollment_result.all():
                    user_id = athlete.user_id
                    if user_id is None or user_id in notified_users:
                        continue
                    notified_users.add(user_id)
                    await notification_service.dispatch(
                        session,
                        user_id,
                        NotificationType.MATCH_REMINDER,
                        {
                            "event_id": event.id,
                            "event_name": f"Evento #{event.id}",
                            "event_date": str(event.event_date),
                            "start_time": str(event.start_time),
                        },
                    )
                    logger.info(
                        "match_reminder_sent user_id=%s event_id=%s league_id=%s",
                        user_id,
                        event.id,
                        league.id,
                    )


def setup_scheduler() -> AsyncIOScheduler:
    scheduler.add_job(
        _auto_lock_competitions, "interval", minutes=5, id="auto_lock_competitions"
    )
    # midnight UTC-3 = 03:00 UTC
    scheduler.add_job(
        _send_match_reminders, "cron", hour=3, minute=0, id="match_reminders"
    )
    return scheduler
