from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, require_admin, require_chief_or_admin
from app.database import get_session
from app.models.user import User
from app.schemas.common import Meta, PaginatedResponse
from app.schemas.delegation import (
    DelegationCreate,
    DelegationDetailResponse,
    DelegationResponse,
    DelegationUpdate,
    InviteCreate,
    InviteResponse,
    MemberHistoryItem,
)
from app.services import delegation_service

router = APIRouter(prefix="/delegations", tags=["delegations"])


@router.get("", response_model=PaginatedResponse[DelegationResponse])
async def list_delegations(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
) -> PaginatedResponse[DelegationResponse]:
    delegations, total = await delegation_service.list_delegations(session, page, per_page)
    return PaginatedResponse(
        data=[DelegationResponse.model_validate(d) for d in delegations],
        meta=Meta(total=total, page=page, per_page=per_page),
    )


@router.post("", response_model=DelegationResponse, status_code=status.HTTP_201_CREATED)
async def create_delegation(
    data: DelegationCreate,
    session: AsyncSession = Depends(get_session),
    admin: User = Depends(require_admin),
) -> DelegationResponse:
    delegation = await delegation_service.create_delegation(session, data, admin)
    await session.commit()
    await session.refresh(delegation)
    return DelegationResponse.model_validate(delegation)


@router.post("/ai-generate", response_model=list[DelegationResponse], status_code=status.HTTP_201_CREATED)
async def ai_generate_delegations(
    count: int = Query(5, ge=1, le=15),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> list[DelegationResponse]:
    delegations = await delegation_service.ai_generate(session, count)
    await session.commit()
    for d in delegations:
        await session.refresh(d)
    return [DelegationResponse.model_validate(d) for d in delegations]


@router.get("/{delegation_id}", response_model=DelegationDetailResponse)
async def get_delegation(
    delegation_id: int,
    session: AsyncSession = Depends(get_session),
) -> DelegationDetailResponse:
    return await delegation_service.get_delegation_detail(session, delegation_id)


@router.patch("/{delegation_id}", response_model=DelegationResponse)
async def update_delegation(
    delegation_id: int,
    data: DelegationUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> DelegationResponse:
    delegation = await delegation_service.update_delegation(session, delegation_id, data, current_user)
    await session.commit()
    await session.refresh(delegation)
    return DelegationResponse.model_validate(delegation)


@router.delete("/{delegation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def archive_delegation(
    delegation_id: int,
    session: AsyncSession = Depends(get_session),
    admin: User = Depends(require_admin),
) -> None:
    await delegation_service.archive_delegation(session, delegation_id, admin)
    await session.commit()


@router.get("/{delegation_id}/history", response_model=list[MemberHistoryItem])
async def get_member_history(
    delegation_id: int,
    session: AsyncSession = Depends(get_session),
) -> list[MemberHistoryItem]:
    return await delegation_service.get_member_history(session, delegation_id)


@router.post("/{delegation_id}/invite", response_model=InviteResponse, status_code=status.HTTP_201_CREATED)
async def invite_user(
    delegation_id: int,
    data: InviteCreate,
    session: AsyncSession = Depends(get_session),
    chief: User = Depends(require_chief_or_admin),
) -> InviteResponse:
    invite = await delegation_service.invite_user(session, delegation_id, data.user_id, chief)
    await session.commit()
    await session.refresh(invite)
    return InviteResponse.model_validate(invite)


@router.get("/{delegation_id}/invites", response_model=list[InviteResponse])
async def list_invites(
    delegation_id: int,
    session: AsyncSession = Depends(get_session),
    chief: User = Depends(require_chief_or_admin),
) -> list[InviteResponse]:
    invites = await delegation_service.list_invites(session, delegation_id, chief)
    return [InviteResponse.model_validate(i) for i in invites]


@router.delete("/{delegation_id}/invites/{invite_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_invite(
    delegation_id: int,
    invite_id: int,
    session: AsyncSession = Depends(get_session),
    chief: User = Depends(require_chief_or_admin),
) -> None:
    await delegation_service.revoke_invite(session, delegation_id, invite_id, chief)
    await session.commit()


@router.post("/{delegation_id}/transfer/{user_id}", response_model=InviteResponse, status_code=status.HTTP_201_CREATED)
async def transfer_athlete(
    delegation_id: int,
    user_id: int,
    session: AsyncSession = Depends(get_session),
    chief: User = Depends(require_chief_or_admin),
) -> InviteResponse:
    invite = await delegation_service.transfer_athlete(session, delegation_id, user_id, chief)
    await session.commit()
    await session.refresh(invite)
    return InviteResponse.model_validate(invite)


# ── Invite accept / refuse (no delegation prefix) ─────────────────────────────
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
