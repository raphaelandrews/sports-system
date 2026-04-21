import logging
import random

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.athlete import Athlete, AthleteModality
from app.models.delegation import Delegation, DelegationMember
from app.models.enrollment import Enrollment, EnrollmentStatus
from app.models.event import Event
from app.models.sport import Modality
from app.models.user import User, UserRole
from app.models.week import CompetitionWeek, WeekStatus
from app.repositories import enrollment_repository
from app.repositories.delegation_repository import get_current_delegation_id
from app.schemas.common import Meta, PaginatedResponse
from app.schemas.enrollment import EnrollmentCreate, EnrollmentResponse, EnrollmentReview
from app.services import eligibility_service

logger = logging.getLogger(__name__)


async def list_enrollments(
    session: AsyncSession,
    current_user: User,
    delegation_id: int | None,
    event_id: int | None,
    enrollment_status: EnrollmentStatus | None,
    page: int,
    per_page: int,
) -> PaginatedResponse[EnrollmentResponse]:
    offset = (page - 1) * per_page
    if current_user.role == UserRole.ADMIN:
        enrollments, total = await enrollment_repository.list_all(
            session, offset, per_page,
            event_id=event_id,
            status=enrollment_status,
            delegation_id=delegation_id,
        )
    else:
        chief_delegation_id = await get_current_delegation_id(session, current_user.id)
        if chief_delegation_id is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User has no delegation")
        enrollments, total = await enrollment_repository.list_by_delegation(
            session, chief_delegation_id, offset, per_page,
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
    week: CompetitionWeek,
    delegation_id: int,
) -> None:
    rules = modality.rules_json

    eligible, reason = await eligibility_service.is_athlete_eligible_for_week(
        session, athlete.id, athlete.user_id, delegation_id, week
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

    max_athletes = rules.get("max_athletes")
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
    current_user: User,
    data: EnrollmentCreate,
) -> EnrollmentResponse:
    if current_user.role != UserRole.ADMIN:
        chief_delegation_id = await get_current_delegation_id(session, current_user.id)
        if chief_delegation_id != data.delegation_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot enroll athletes for another delegation",
            )

    athlete_result = await session.execute(
        select(Athlete).where(Athlete.id == data.athlete_id, Athlete.is_active == True)  # noqa: E712
    )
    athlete = athlete_result.scalar_one_or_none()
    if athlete is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Athlete not found")

    event = await session.get(Event, data.event_id)
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    week = await session.get(CompetitionWeek, event.week_id)
    if week is None or week.status in (WeekStatus.LOCKED, WeekStatus.ACTIVE, WeekStatus.COMPLETED):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Enrollments are closed — week is locked or completed",
        )

    modality = await session.get(Modality, event.modality_id)
    if modality is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Modality not found")

    existing = await enrollment_repository.get_by_athlete_and_event(session, data.athlete_id, data.event_id)
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Athlete already enrolled in this event")

    await _validate(session, athlete, event, modality, week, data.delegation_id)

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
    current_user: User,
    enrollment_id: int,
) -> None:
    enrollment = await enrollment_repository.get_by_id(session, enrollment_id)
    if enrollment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment not found")

    if current_user.role != UserRole.ADMIN:
        chief_delegation_id = await get_current_delegation_id(session, current_user.id)
        if chief_delegation_id != enrollment.delegation_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot cancel enrollment for another delegation",
            )

    event = await session.get(Event, enrollment.event_id)
    if event is not None:
        week = await session.get(CompetitionWeek, event.week_id)
        if week is not None and week.status in (WeekStatus.LOCKED, WeekStatus.ACTIVE, WeekStatus.COMPLETED):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Cannot cancel enrollment — week is locked",
            )

    await session.delete(enrollment)
    await session.commit()


async def review_enrollment(
    session: AsyncSession,
    enrollment_id: int,
    data: EnrollmentReview,
) -> EnrollmentResponse:
    enrollment = await enrollment_repository.get_by_id(session, enrollment_id)
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


async def ai_generate(session: AsyncSession) -> list[EnrollmentResponse]:
    weeks_result = await session.execute(
        select(CompetitionWeek)
        .where(CompetitionWeek.status.in_([WeekStatus.DRAFT, WeekStatus.SCHEDULED]))
        .order_by(CompetitionWeek.week_number.desc())
        .limit(1)
    )
    week = weeks_result.scalar_one_or_none()
    if week is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No open week found for AI generation",
        )

    events_result = await session.execute(
        select(Event).where(Event.week_id == week.id).limit(6)
    )
    events = list(events_result.scalars().all())
    if not events:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No events found in open week",
        )

    delegations_result = await session.execute(
        select(Delegation).where(Delegation.is_active == True)  # noqa: E712
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
        max_athletes = modality.rules_json.get("max_athletes", 1)
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
    logger.info("ai_generate_enrollments created=%s week_id=%s", len(created), week.id)
    return created
