from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.shared.core.deps import (
    get_current_user,
    require_league_admin,
    require_league_chief,
)
from app.database import get_session
from app.domain.models.league import LeagueMember
from app.domain.models.user import User
from app.domain.schemas.common import Meta, PaginatedResponse
from app.domain.schemas.delegation import (
    DelegationCreate,
    DelegationDetailResponse,
    DelegationResponse,
    DelegationStatisticsResponse,
    DelegationUpdate,
    InviteCreate,
    InviteResponse,
    MemberHistoryItem,
)
from app.features.delegations import service as delegation_service

router = APIRouter(prefix="/leagues/{league_id}/delegations", tags=["delegations"])
independent_router = APIRouter(prefix="/delegations", tags=["delegations"])


@router.get("", response_model=PaginatedResponse[DelegationResponse])
async def list_delegations(
    league_id: int,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
) -> PaginatedResponse[DelegationResponse]:
    delegations, total = await delegation_service.list_delegations(
        session, league_id, page, per_page
    )
    return PaginatedResponse(
        data=[DelegationResponse.model_validate(d) for d in delegations],
        meta=Meta(total=total, page=page, per_page=per_page),
    )


@router.post("", response_model=DelegationResponse, status_code=status.HTTP_201_CREATED)
async def create_delegation(
    league_id: int,
    data: DelegationCreate,
    session: AsyncSession = Depends(get_session),
    _: LeagueMember = Depends(require_league_admin()),
) -> DelegationResponse:
    delegation = await delegation_service.create_delegation(session, data, league_id)
    await session.commit()
    await session.refresh(delegation)
    return DelegationResponse.model_validate(delegation)


@router.post(
    "/ai-generate",
    response_model=list[DelegationResponse],
    status_code=status.HTTP_201_CREATED,
)
async def ai_generate_delegations(
    league_id: int,
    count: int = Query(5, ge=1, le=15),
    session: AsyncSession = Depends(get_session),
    _: LeagueMember = Depends(require_league_admin()),
) -> list[DelegationResponse]:
    delegations = await delegation_service.ai_generate(session, league_id, count)
    await session.commit()
    for delegation in delegations:
        await session.refresh(delegation)
    return [DelegationResponse.model_validate(delegation) for delegation in delegations]


@router.post(
    "/ai-populate",
    response_model=list[DelegationResponse],
    status_code=status.HTTP_201_CREATED,
)
async def ai_populate_delegations(
    league_id: int,
    count: int = Query(5, ge=1, le=15),
    session: AsyncSession = Depends(get_session),
    _: LeagueMember = Depends(require_league_admin()),
) -> list[DelegationResponse]:
    delegations = await delegation_service.ai_populate(session, league_id, count)
    await session.commit()
    for delegation in delegations:
        await session.refresh(delegation)
    return [DelegationResponse.model_validate(delegation) for delegation in delegations]


@router.get("/{delegation_id}", response_model=DelegationDetailResponse)
async def get_delegation(
    league_id: int,
    delegation_id: int,
    session: AsyncSession = Depends(get_session),
) -> DelegationDetailResponse:
    return await delegation_service.get_delegation_detail(
        session, league_id, delegation_id
    )


@router.get("/{delegation_id}/statistics", response_model=DelegationStatisticsResponse)
async def get_delegation_statistics(
    league_id: int,
    delegation_id: int,
    session: AsyncSession = Depends(get_session),
) -> DelegationStatisticsResponse:
    return await delegation_service.get_delegation_statistics(
        session, league_id, delegation_id
    )


@router.patch("/{delegation_id}", response_model=DelegationResponse)
async def update_delegation(
    league_id: int,
    delegation_id: int,
    data: DelegationUpdate,
    session: AsyncSession = Depends(get_session),
    member: LeagueMember = Depends(require_league_chief()),
) -> DelegationResponse:
    delegation = await delegation_service.update_delegation(
        session, league_id, delegation_id, data, member
    )
    await session.commit()
    await session.refresh(delegation)
    return DelegationResponse.model_validate(delegation)


@router.delete("/{delegation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def archive_delegation(
    league_id: int,
    delegation_id: int,
    session: AsyncSession = Depends(get_session),
    _: LeagueMember = Depends(require_league_admin()),
) -> None:
    await delegation_service.archive_delegation(session, league_id, delegation_id)
    await session.commit()


@router.post("/{delegation_id}/assign-chief", response_model=DelegationResponse)
async def assign_chief(
    league_id: int,
    delegation_id: int,
    session: AsyncSession = Depends(get_session),
    member: LeagueMember = Depends(require_league_admin()),
) -> DelegationResponse:
    delegation = await delegation_service.assign_chief(
        session, league_id, delegation_id, member.user_id
    )
    await session.commit()
    await session.refresh(delegation)
    return DelegationResponse.model_validate(delegation)


@router.get("/{delegation_id}/history", response_model=list[MemberHistoryItem])
async def get_member_history(
    league_id: int,
    delegation_id: int,
    session: AsyncSession = Depends(get_session),
) -> list[MemberHistoryItem]:
    return await delegation_service.get_member_history(
        session, league_id, delegation_id
    )


@router.post(
    "/{delegation_id}/invite",
    response_model=InviteResponse,
    status_code=status.HTTP_201_CREATED,
)
async def invite_user(
    league_id: int,
    delegation_id: int,
    data: InviteCreate,
    session: AsyncSession = Depends(get_session),
    _: LeagueMember = Depends(require_league_chief()),
) -> InviteResponse:
    invite = await delegation_service.invite_user(
        session, league_id, delegation_id, data.user_id
    )
    await session.commit()
    await session.refresh(invite)
    return InviteResponse.model_validate(invite)


@router.get("/{delegation_id}/invites", response_model=list[InviteResponse])
async def list_invites(
    league_id: int,
    delegation_id: int,
    session: AsyncSession = Depends(get_session),
    _: LeagueMember = Depends(require_league_chief()),
) -> list[InviteResponse]:
    invites = await delegation_service.list_invites(session, league_id, delegation_id)
    return [InviteResponse.model_validate(invite) for invite in invites]


@router.delete(
    "/{delegation_id}/invites/{invite_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def revoke_invite(
    league_id: int,
    delegation_id: int,
    invite_id: int,
    session: AsyncSession = Depends(get_session),
    _: LeagueMember = Depends(require_league_chief()),
) -> None:
    await delegation_service.revoke_invite(session, league_id, delegation_id, invite_id)
    await session.commit()


@router.post(
    "/{delegation_id}/transfer/{user_id}",
    response_model=InviteResponse,
    status_code=status.HTTP_201_CREATED,
)
async def transfer_athlete(
    league_id: int,
    delegation_id: int,
    user_id: int,
    session: AsyncSession = Depends(get_session),
    _: LeagueMember = Depends(require_league_chief()),
) -> InviteResponse:
    invite = await delegation_service.transfer_athlete(
        session, league_id, delegation_id, user_id
    )
    await session.commit()
    await session.refresh(invite)
    return InviteResponse.model_validate(invite)


@independent_router.post(
    "/independent",
    response_model=DelegationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_independent_delegation(
    data: DelegationCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> DelegationResponse:
    delegation = await delegation_service.create_delegation(
        session, data, creator=current_user
    )
    await session.commit()
    await session.refresh(delegation)
    return DelegationResponse.model_validate(delegation)


@independent_router.get("/my/list", response_model=list[DelegationResponse])
async def list_my_delegations(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> list[DelegationResponse]:
    if current_user.id is None:
        return []
    delegations = await delegation_service.list_delegations_by_chief(
        session, current_user.id
    )
    return [DelegationResponse.model_validate(d) for d in delegations]


@independent_router.patch("/{delegation_id}", response_model=DelegationResponse)
async def update_independent_delegation(
    delegation_id: int,
    data: DelegationUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> DelegationResponse:
    delegation = await delegation_service.get_delegation(session, None, delegation_id)
    if delegation.chief_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own delegation",
        )
    updated = await delegation_service.update_delegation(
        session, None, delegation_id, data
    )
    await session.commit()
    await session.refresh(updated)
    return DelegationResponse.model_validate(updated)


from app.domain.schemas.delegation import (
    LeagueParticipationRequestCreate,
    LeagueParticipationRequestReview,
    LeagueParticipationRequestResponse,
)


@independent_router.post(
    "/{delegation_id}/participation-requests",
    response_model=LeagueParticipationRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_participation_request(
    delegation_id: int,
    data: LeagueParticipationRequestCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> LeagueParticipationRequestResponse:
    request = await delegation_service.create_participation_request(
        session, delegation_id, data.league_id, current_user
    )
    return LeagueParticipationRequestResponse.model_validate(request)


@router.get(
    "/participation-requests", response_model=list[LeagueParticipationRequestResponse]
)
async def list_league_participation_requests(
    league_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> list[LeagueParticipationRequestResponse]:
    requests = await delegation_service.list_participation_requests_for_league(
        session, league_id, current_user
    )
    return [LeagueParticipationRequestResponse.model_validate(r) for r in requests]


@router.post(
    "/participation-requests/{request_id}/review",
    response_model=LeagueParticipationRequestResponse,
)
async def review_participation_request(
    league_id: int,
    request_id: int,
    data: LeagueParticipationRequestReview,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> LeagueParticipationRequestResponse:
    request = await delegation_service.review_participation_request(
        session, league_id, request_id, data.status, current_user
    )
    return LeagueParticipationRequestResponse.model_validate(request)


invites_router = APIRouter(prefix="/invites", tags=["invites"])


@invites_router.post("/{invite_id}/accept", status_code=status.HTTP_200_OK)
async def accept_invite(
    invite_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> dict[str, str]:
    await delegation_service.accept_invite(session, invite_id, current_user)
    await session.commit()
    return {"status": "accepted"}


@invites_router.post("/{invite_id}/refuse", status_code=status.HTTP_200_OK)
async def refuse_invite(
    invite_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> dict[str, str]:
    await delegation_service.refuse_invite(session, invite_id, current_user)
    await session.commit()
    return {"status": "refused"}
