import secrets

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.delegation import Delegation, DelegationMember, DelegationMemberRole
from app.models.user import ChiefRequest, ChiefRequestStatus, NotificationType, User, UserRole
from app.repositories import chief_request_repository, user_repository
from app.schemas.user import ChiefRequestCreate, ChiefRequestReview, UserUpdate
from app.services import notification_service


async def update_me(session: AsyncSession, user: User, data: UserUpdate) -> User:
    if not data.has_updates():
        return user
    if data.name is not None:
        user.name = data.name
    return await user_repository.save(session, user)


async def request_chief(session: AsyncSession, user: User, data: ChiefRequestCreate) -> ChiefRequest:
    req = ChiefRequest(
        user_id=user.id,
        delegation_name=data.delegation_name,
        message=data.message,
    )
    return await chief_request_repository.create(session, req)


async def list_pending_requests(
    session: AsyncSession, page: int, per_page: int
) -> tuple[list[ChiefRequest], int]:
    return await chief_request_repository.list_pending(session, page, per_page)


async def review_request(
    session: AsyncSession,
    request_id: int,
    data: ChiefRequestReview,
    admin: User,
) -> ChiefRequest:
    req = await chief_request_repository.get_by_id(session, request_id)
    if req is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    if req.status != ChiefRequestStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Request already reviewed")

    req.status = data.status
    req.reviewed_by = admin.id
    await chief_request_repository.save(session, req)

    user = await user_repository.get_by_id(session, req.user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if data.status == ChiefRequestStatus.APPROVED:
        user.role = UserRole.CHIEF
        await user_repository.save(session, user)

        code = req.delegation_name[:4].upper().replace(" ", "") + secrets.token_hex(2).upper()
        delegation = Delegation(code=code, name=req.delegation_name, chief_id=user.id)
        session.add(delegation)
        await session.flush()

        session.add(DelegationMember(delegation_id=delegation.id, user_id=user.id, role=DelegationMemberRole.CHIEF))
        await session.flush()

        await notification_service.dispatch(
            session,
            user.id,
            NotificationType.REQUEST_REVIEWED,
            {"status": "APPROVED", "delegation_name": req.delegation_name},
        )
    else:
        await notification_service.dispatch(
            session,
            user.id,
            NotificationType.REQUEST_REVIEWED,
            {"status": "REJECTED", "delegation_name": req.delegation_name},
        )

    return req
