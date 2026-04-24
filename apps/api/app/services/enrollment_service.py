import logging
import random

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.league import LeagueMember, LeagueMemberRole
from app.models.athlete import Athlete, AthleteModality
from app.models.delegation import Delegation, DelegationMember
from app.models.enrollment import Enrollment, EnrollmentStatus
from app.models.event import Event
from app.models.sport import Modality, Sport
from app.models.competition import Competition, CompetitionStatus
from app.repositories import enrollment_repository
from app.repositories.delegation_repository import get_current_delegation_id
from app.schemas.common import Meta, PaginatedResponse
from app.schemas.enrollment import EnrollmentCreate, EnrollmentResponse, EnrollmentReview
from app.services import eligibility_service

logger = logging.getLogger(__name__)


def _get_numeric_rule(rules: dict, key: str) -> int | None:
    value = rules.get(key)
    return value if isinstance(value, int) else None


def _resolve_max_athletes(modality: Modality, sport: Sport | None) -> int:
    modality_rules = modality.rules_json
    sport_rules = sport.rules_json if sport is not None else {}
    player_count = sport.player_count if sport is not None else None

    for rules in (modality_rules, sport_rules):
        roster_size = _get_numeric_rule(rules, "roster_size")
        if roster_size is not None:
            return roster_size

    if player_count is not None:
        for rules in (modality_rules, sport_rules):
            substitutes = _get_numeric_rule(rules, "substitutes")
            if substitutes is not None:
                return player_count + substitutes

    for rules in (modality_rules, sport_rules):
        max_athletes = _get_numeric_rule(rules, "max_athletes")
        if max_athletes is not None:
            return max_athletes

    return player_count or 1


async def list_enrollments(
    session: AsyncSession,
    league_id: int,
    current_user_id: int,
    membership: LeagueMember,
    delegation_id: int | None,
    event_id: int | None,
    enrollment_status: EnrollmentStatus | None,
    page: int,
    per_page: int,
) -> PaginatedResponse[EnrollmentResponse]:
    offset = (page - 1) * per_page
    if membership.role == LeagueMemberRole.LEAGUE_ADMIN:
        enrollments, total = await enrollment_repository.list_all(
            session, league_id, offset, per_page,
            event_id=event_id,
            status=enrollment_status,
            delegation_id=delegation_id,
        )
    else:
        chief_delegation_id = await get_current_delegation_id(session, current_user_id, league_id)
        if chief_delegation_id is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User has no delegation")
        enrollments, total = await enrollment_repository.list_by_delegation(
            session, league_id, chief_delegation_id, offset, per_page,
            event_id=event_id,
            status=enrollment_status,
        )
    return PaginatedResponse(
        data=[EnrollmentResponse.model_validate(e) for e in enrollments],
        meta=Meta(total=total, page=page, per_page=per_page),
    )


async def _validate(
    session: AsyncSession,
    athlete: Athlete,
    event: Event,
    modality: Modality,
    sport: Sport | None,
    competition: Competition,
    delegation_id: int,
) -> None:
    rules = modality.rules_json

    eligible, reason = await eligibility_service.is_athlete_eligible_for_week(
        session, athlete.id, athlete.user_id, delegation_id, competition
    )
    if not eligible:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=reason)

    required_gender = rules.get("gender")
    if required_gender and required_gender != "MIXED":
        if athlete.gender is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Athlete has no gender set — required for this modality",
            )
        if athlete.gender.value != required_gender:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Modality requires gender '{required_gender}', athlete is '{athlete.gender.value}'",
            )

    max_athletes = _resolve_max_athletes(modality, sport)
    if max_athletes is not None:
        count = await enrollment_repository.count_by_event_and_delegation(
            session,
            event.id,
            delegation_id,
            [EnrollmentStatus.PENDING, EnrollmentStatus.APPROVED],
        )
        if count >= max_athletes:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Maximum athletes for this modality reached ({max_athletes})",
            )

    weight_category = rules.get("weight_category")
    if weight_category is not None:
        am_result = await session.execute(
            select(AthleteModality).where(
                AthleteModality.athlete_id == athlete.id,
                AthleteModality.modality_id == modality.id,
            )
        )
        am = am_result.scalar_one_or_none()
        if am is None or am.category != weight_category:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Athlete not registered in weight category '{weight_category}' for this modality",
            )

    if rules.get("schedule_conflict_check"):
        conflict = await enrollment_repository.get_athlete_conflicting_enrollment(
            session, athlete.id, event.event_date, event.start_time, event.id
        )
        if conflict is not None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Athlete already enrolled in another event at the same date and time",
            )


async def create_enrollment(
    session: AsyncSession,
    league_id: int,
    current_user_id: int,
    membership: LeagueMember,
    data: EnrollmentCreate,
) -> EnrollmentResponse:
    if membership.role != LeagueMemberRole.LEAGUE_ADMIN:
        chief_delegation_id = await get_current_delegation_id(session, current_user_id, league_id)
        if chief_delegation_id != data.delegation_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot enroll athletes for another delegation",
            )

    if not await enrollment_repository.delegation_in_league(session, league_id, data.delegation_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delegation not found")

    athlete_result = await session.execute(
        select(Athlete).where(
            Athlete.id == data.athlete_id,
            Athlete.league_id == league_id,
            Athlete.is_active == True,  # noqa: E712
        )
    )
    athlete = athlete_result.scalar_one_or_none()
    if athlete is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Athlete not found")

    event_result = await session.execute(
        select(Event)
        .join(Competition, Competition.id == Event.competition_id)
        .where(
            Event.id == data.event_id,
            Competition.league_id == league_id,
        )
    )
    event = event_result.scalar_one_or_none()
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    competition = await session.get(Competition, event.competition_id)
    if competition is None or competition.status in (CompetitionStatus.LOCKED, CompetitionStatus.ACTIVE, CompetitionStatus.COMPLETED):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Enrollments are closed — competition is locked or completed",
        )

    modality = await session.get(Modality, event.modality_id)
    if modality is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Modality not found")
    sport = await session.get(Sport, modality.sport_id)

    existing = await enrollment_repository.get_by_athlete_and_event(session, data.athlete_id, data.event_id)
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Athlete already enrolled in this event")

    await _validate(session, athlete, event, modality, sport, competition, data.delegation_id)

    enrollment = Enrollment(
        athlete_id=data.athlete_id,
        event_id=data.event_id,
        delegation_id=data.delegation_id,
        status=EnrollmentStatus.PENDING,
    )
    enrollment = await enrollment_repository.create(session, enrollment)
    await session.commit()
    return EnrollmentResponse.model_validate(enrollment)


async def cancel_enrollment(
    session: AsyncSession,
    league_id: int,
    current_user_id: int,
    membership: LeagueMember,
    enrollment_id: int,
) -> None:
    enrollment = await enrollment_repository.get_by_id_in_league(session, league_id, enrollment_id)
    if enrollment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment not found")

    if membership.role != LeagueMemberRole.LEAGUE_ADMIN:
        chief_delegation_id = await get_current_delegation_id(session, current_user_id, league_id)
        if chief_delegation_id != enrollment.delegation_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot cancel enrollment for another delegation",
            )

    event = await session.get(Event, enrollment.event_id)
    if event is not None:
        competition = await session.get(Competition, event.competition_id)
        if competition is not None and competition.status in (CompetitionStatus.LOCKED, CompetitionStatus.ACTIVE, CompetitionStatus.COMPLETED):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Cannot cancel enrollment — competition is locked",
            )

    await session.delete(enrollment)
    await session.commit()


async def review_enrollment(
    session: AsyncSession,
    league_id: int,
    enrollment_id: int,
    data: EnrollmentReview,
) -> EnrollmentResponse:
    enrollment = await enrollment_repository.get_by_id_in_league(session, league_id, enrollment_id)
    if enrollment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment not found")

    if data.status == EnrollmentStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Review status must be APPROVED or REJECTED",
        )

    enrollment.status = data.status
    enrollment.validation_message = data.validation_message
    enrollment = await enrollment_repository.save(session, enrollment)
    await session.commit()
    return EnrollmentResponse.model_validate(enrollment)


async def ai_generate(session: AsyncSession, league_id: int) -> list[EnrollmentResponse]:
    competitions_result = await session.execute(
        select(Competition)
        .where(
            Competition.league_id == league_id,
            Competition.status.in_([CompetitionStatus.DRAFT, CompetitionStatus.SCHEDULED]),
        )
        .order_by(Competition.number.desc())
        .limit(1)
    )
    competition = competitions_result.scalar_one_or_none()
    if competition is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No open competition found for AI generation",
        )

    events_result = await session.execute(
        select(Event).where(Event.competition_id == competition.id).limit(6)
    )
    events = list(events_result.scalars().all())
    if not events:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No events found in open week",
        )

    delegations_result = await session.execute(
        select(Delegation).where(
            Delegation.league_id == league_id,
            Delegation.is_active == True,  # noqa: E712
        )
    )
    delegations = list(delegations_result.scalars().all())
    if not delegations:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No delegations found",
        )

    created: list[EnrollmentResponse] = []

    for event in events:
        modality = await session.get(Modality, event.modality_id)
        if modality is None:
            continue
        sport = await session.get(Sport, modality.sport_id)
        max_athletes = _resolve_max_athletes(modality, sport)
        sample_size = min(len(delegations), 4)
        for delegation in random.sample(delegations, sample_size):
            member_user_ids_result = await session.execute(
                select(DelegationMember.user_id).where(
                    DelegationMember.delegation_id == delegation.id,
                    DelegationMember.left_at == None,  # noqa: E711
                )
            )
            member_user_ids = list(member_user_ids_result.scalars().all())
            if not member_user_ids:
                continue

            athletes_result = await session.execute(
                select(Athlete).where(
                    Athlete.league_id == league_id,
                    Athlete.user_id.in_(member_user_ids),
                    Athlete.is_active == True,  # noqa: E712
                ).limit(max_athletes)
            )
            athletes = list(athletes_result.scalars().all())

            for athlete in athletes:
                existing = await enrollment_repository.get_by_athlete_and_event(
                    session, athlete.id, event.id
                )
                if existing is not None:
                    continue
                enrollment = Enrollment(
                    athlete_id=athlete.id,
                    event_id=event.id,
                    delegation_id=delegation.id,
                    status=EnrollmentStatus.APPROVED,
                )
                session.add(enrollment)
                await session.flush()
                await session.refresh(enrollment)
                created.append(EnrollmentResponse.model_validate(enrollment))

            if len(created) >= 30:
                break
        if len(created) >= 30:
            break

    await session.commit()
    logger.info("ai_generate_enrollments created=%s competition_id=%s", len(created), competition.id)
    return created
