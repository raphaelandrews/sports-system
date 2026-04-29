from fastapi import APIRouter

router = APIRouter(prefix="/leagues/{league_id}/admin", tags=["admin"])
superadmin_router = APIRouter(prefix="/admin", tags=["superadmin"])
