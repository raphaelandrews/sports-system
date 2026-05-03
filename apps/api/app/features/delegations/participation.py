from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.delegation import (
    DelegationStatus,
    LeagueParticipationRequest,
)
from app.domain.models.league import LeagueMemberRole
from app.domain.models.league_delegation import LeagueDelegation
from app.domain.models.user import NotificationType, User
from app.features.delegations import repository as delegation_repository
from app.features.delegations._core import get_delegation
from app.features.leagues import repository as league_repository
from app.features.notifications import service as notification_service


async def create_participation_request(
    session: AsyncSession,
    delegation_id: int,
    league_id: int,
    current_user: User,
) -> LeagueParticipationRequest:
    delegation = await get_delegation(session, None, delegation_id)
    if current_user.id is None or delegation.chief_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the chief can request participation",
        )

    existing = await delegation_repository.list_participation_requests_for_delegation(
        session, delegation_id
    )
    for req in existing:
        if req.league_id == league_id and req.status == "PENDING":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A pending request for this league already exists",
            )

    league = await league_repository.get_by_id(session, league_id)
    if league is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="League not found",
        )

    if current_user.id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized",
        )

    request = LeagueParticipationRequest(
        delegation_id=delegation_id,
        league_id=league_id,
        requested_by=current_user.id,
    )
    await delegation_repository.create_participation_request(session, request)
    await session.commit()
    await session.refresh(request)

    league_members = await league_repository.get_members(session, league_id)
    for member in league_members:
        if member.role == LeagueMemberRole.LEAGUE_ADMIN and member.user_id is not None:
            await notification_service.dispatch(
                session,
                member.user_id,
                NotificationType.PARTICIPATION_REQUEST,
                {
                    "request_id": request.id,
                    "delegation_id": delegation_id,
                    "delegation_name": delegation.name,
                    "league_id": league_id,
                    "league_name": league.name,
                },
            )

    return request


async def list_participation_requests_for_league(
    session: AsyncSession,
    league_id: int,
    current_user: User,
) -> list[LeagueParticipationRequest]:
    if current_user.id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized",
        )

    membership = await league_repository.get_member(session, league_id, current_user.id)
    if membership is None or membership.role != LeagueMemberRole.LEAGUE_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only league admins can view requests",
        )

    return list(
        await delegation_repository.list_participation_requests_for_league(
            session, league_id
        )
    )


async def review_participation_request(
    session: AsyncSession,
    league_id: int,
    request_id: int,
    new_status: str,
    current_user: User,
) -> LeagueParticipationRequest:
    if current_user.id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized",
        )

    membership = await league_repository.get_member(session, league_id, current_user.id)
    if membership is None or membership.role != LeagueMemberRole.LEAGUE_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only league admins can review requests",
        )

    request = await delegation_repository.get_participation_request_by_id(
        session, request_id
    )
    if request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found",
        )
    if request.league_id != league_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request does not belong to this league",
        )

    if new_status not in ("APPROVED", "REJECTED"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be APPROVED or REJECTED",
        )

    request.status = DelegationStatus(new_status)
    request.reviewed_by = current_user.id

    if new_status == "APPROVED":
        existing = await delegation_repository.get_league_delegation(
            session, league_id, request.delegation_id
        )
        if existing is None:
            session.add(
                LeagueDelegation(
                    league_id=league_id,
                    delegation_id=request.delegation_id,
                )
            )

    await session.commit()
    await session.refresh(request)

    delegation = await get_delegation(session, None, request.delegation_id)
    league = await league_repository.get_by_id(session, league_id)
    if delegation.chief_id is not None:
        await notification_service.dispatch(
            session,
            delegation.chief_id,
            NotificationType.REQUEST_REVIEWED,
            {
                "request_id": request.id,
                "delegation_id": delegation.id,
                "delegation_name": delegation.name,
                "league_id": league_id,
                "league_name": league.name if league else None,
                "status": new_status,
            },
        )

    return request
