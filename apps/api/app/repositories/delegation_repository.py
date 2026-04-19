from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.delegation import Delegation, DelegationInvite, DelegationMember, InviteStatus
from app.models.user import User


async def get_by_id(session: AsyncSession, delegation_id: int) -> Delegation | None:
    return await session.get(Delegation, delegation_id)


async def get_by_code(session: AsyncSession, code: str) -> Delegation | None:
    result = await session.execute(select(Delegation).where(Delegation.code == code))
    return result.scalar_one_or_none()


async def list_active(
    session: AsyncSession, page: int = 1, per_page: int = 20
) -> tuple[list[Delegation], int]:
    offset = (page - 1) * per_page
    count_result = await session.execute(
        select(func.count()).select_from(Delegation).where(Delegation.is_active == True)  # noqa: E712
    )
    total = count_result.scalar_one()
    result = await session.execute(
        select(Delegation)
        .where(Delegation.is_active == True)  # noqa: E712
        .order_by(Delegation.name)
        .offset(offset)
        .limit(per_page)
    )
    return result.scalars().all(), total  # type: ignore[return-value]


async def create(session: AsyncSession, delegation: Delegation) -> Delegation:
    session.add(delegation)
    await session.flush()
    return delegation


async def save(session: AsyncSession, delegation: Delegation) -> Delegation:
    session.add(delegation)
    await session.flush()
    return delegation


async def get_active_members_with_users(
    session: AsyncSession, delegation_id: int
) -> list[tuple[DelegationMember, User]]:
    result = await session.execute(
        select(DelegationMember, User)
        .join(User, DelegationMember.user_id == User.id)
        .where(
            DelegationMember.delegation_id == delegation_id,
            DelegationMember.left_at == None,  # noqa: E711
        )
        .order_by(DelegationMember.joined_at)
    )
    return result.all()  # type: ignore[return-value]


async def get_member_history_with_users(
    session: AsyncSession, delegation_id: int
) -> list[tuple[DelegationMember, User]]:
    result = await session.execute(
        select(DelegationMember, User)
        .join(User, DelegationMember.user_id == User.id)
        .where(DelegationMember.delegation_id == delegation_id)
        .order_by(DelegationMember.joined_at.desc())
    )
    return result.all()  # type: ignore[return-value]


async def get_active_membership(session: AsyncSession, user_id: int) -> DelegationMember | None:
    result = await session.execute(
        select(DelegationMember).where(
            DelegationMember.user_id == user_id,
            DelegationMember.left_at == None,  # noqa: E711
        )
    )
    return result.scalar_one_or_none()


async def create_member(session: AsyncSession, member: DelegationMember) -> DelegationMember:
    session.add(member)
    await session.flush()
    return member


async def save_member(session: AsyncSession, member: DelegationMember) -> DelegationMember:
    session.add(member)
    await session.flush()
    return member


async def get_pending_invites(
    session: AsyncSession, delegation_id: int
) -> list[DelegationInvite]:
    result = await session.execute(
        select(DelegationInvite).where(
            DelegationInvite.delegation_id == delegation_id,
            DelegationInvite.status == InviteStatus.PENDING,
        )
    )
    return result.scalars().all()  # type: ignore[return-value]


async def get_invite_by_id(session: AsyncSession, invite_id: int) -> DelegationInvite | None:
    return await session.get(DelegationInvite, invite_id)


async def create_invite(session: AsyncSession, invite: DelegationInvite) -> DelegationInvite:
    session.add(invite)
    await session.flush()
    return invite


async def save_invite(session: AsyncSession, invite: DelegationInvite) -> DelegationInvite:
    session.add(invite)
    await session.flush()
    return invite


async def get_current_delegation_id(session: AsyncSession, user_id: int) -> int | None:
    result = await session.execute(
        select(DelegationMember.delegation_id).where(
            DelegationMember.user_id == user_id,
            DelegationMember.left_at == None,  # noqa: E711
        )
    )
    return result.scalar_one_or_none()
