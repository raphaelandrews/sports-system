from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.delegation import (
    DelegationInvite,
    DelegationMember,
    DelegationMemberRole,
    InviteStatus,
)
from app.domain.models.user import NotificationType, User
from app.features.auth import user_repository
from app.features.delegations import repository as delegation_repository
from app.features.delegations._core import get_delegation
from app.features.delegations._helpers import (
    is_transfer_window_open,
    next_transfer_window_iso,
)
from app.features.leagues import repository as league_repository
from app.features.notifications import service as notification_service


async def invite_user(
    session: AsyncSession,
    league_id: int,
    delegation_id: int,
    user_id: int,
) -> DelegationInvite:
    delegation = await get_delegation(session, league_id, delegation_id)

    target_user = await user_repository.get_by_id(session, user_id)
    if target_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    existing = await delegation_repository.get_pending_invites(session, delegation_id)
    if any(inv.user_id == user_id for inv in existing):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Invite already pending for this user",
        )

    invite = DelegationInvite(delegation_id=delegation_id, user_id=user_id)
    await delegation_repository.create_invite(session, invite)

    await notification_service.dispatch(
        session,
        user_id,
        NotificationType.INVITE,
        {
            "delegation_id": delegation_id,
            "delegation_name": delegation.name,
            "invite_id": invite.id,
        },
    )
    return invite


async def list_invites(
    session: AsyncSession, league_id: int, delegation_id: int
) -> list[DelegationInvite]:
    await get_delegation(session, league_id, delegation_id)
    return await delegation_repository.get_pending_invites(session, delegation_id)


async def revoke_invite(
    session: AsyncSession, league_id: int, delegation_id: int, invite_id: int
) -> None:
    await get_delegation(session, league_id, delegation_id)

    invite = await delegation_repository.get_invite_by_id(session, invite_id)
    if invite is None or invite.delegation_id != delegation_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Invite not found"
        )
    if invite.status != InviteStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Invite already resolved"
        )

    invite.status = InviteStatus.REFUSED
    await delegation_repository.save_invite(session, invite)


async def accept_invite(
    session: AsyncSession, invite_id: int, user: User
) -> DelegationMember:
    invite = await delegation_repository.get_invite_by_id(session, invite_id)
    if invite is None or invite.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Invite not found"
        )
    if invite.status != InviteStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Invite already resolved"
        )

    target_delegation = await delegation_repository.get_by_id(
        session, invite.delegation_id
    )
    if target_delegation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Delegation not found"
        )

    now = datetime.now(UTC).replace(tzinfo=None)
    assert user.id is not None
    assert target_delegation.league_id is not None
    current = await delegation_repository.get_active_membership(
        session, user.id, target_delegation.league_id
    )
    if current is not None:
        current.left_at = now
        await delegation_repository.save_member(session, current)

    invite.status = InviteStatus.ACCEPTED
    await delegation_repository.save_invite(session, invite)

    member = DelegationMember(
        delegation_id=invite.delegation_id,
        user_id=user.id,
        role=DelegationMemberRole.ATHLETE,
    )
    return await delegation_repository.create_member(session, member)


async def refuse_invite(session: AsyncSession, invite_id: int, user: User) -> None:
    invite = await delegation_repository.get_invite_by_id(session, invite_id)
    if invite is None or invite.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Invite not found"
        )
    if invite.status != InviteStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Invite already resolved"
        )

    invite.status = InviteStatus.REFUSED
    await delegation_repository.save_invite(session, invite)


async def transfer_athlete(
    session: AsyncSession,
    league_id: int,
    delegation_id: int,
    user_id: int,
) -> DelegationInvite:
    league = await league_repository.get_by_id(session, league_id)
    if league is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="League not found"
        )

    if league.transfer_window_enabled and not is_transfer_window_open(league.timezone):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Transfer window closed. Next window: {next_transfer_window_iso(league.timezone)}",
        )

    delegation = await get_delegation(session, league_id, delegation_id)

    target_user = await user_repository.get_by_id(session, user_id)
    if target_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    current_membership = await delegation_repository.get_active_membership(
        session, user_id, league_id
    )
    if current_membership is None or current_membership.delegation_id == delegation_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not in a different delegation",
        )

    existing = await delegation_repository.get_pending_invites(session, delegation_id)
    if any(inv.user_id == user_id for inv in existing):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Transfer already pending for this user",
        )

    invite = DelegationInvite(delegation_id=delegation_id, user_id=user_id)
    await delegation_repository.create_invite(session, invite)

    await notification_service.dispatch(
        session,
        user_id,
        NotificationType.TRANSFER,
        {
            "delegation_id": delegation_id,
            "delegation_name": delegation.name,
            "invite_id": invite.id,
        },
    )
    return invite
