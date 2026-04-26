"""rework user roles

Revision ID: a4b5c6d7e8f9
Revises: f2b3c4d5e6f7
Create Date: 2026-04-24

"""
from typing import Sequence, Union

from alembic import op


revision: str = "a4b5c6d7e8f9"
down_revision: Union[str, Sequence[str], None] = "f2b3c4d5e6f7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'SUPERADMIN'")
        op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'USER'")
    op.execute("UPDATE users SET role = 'SUPERADMIN' WHERE role = 'ADMIN'")
    op.execute("UPDATE users SET role = 'USER' WHERE role IN ('CHIEF', 'COACH', 'ATHLETE')")


def downgrade() -> None:
    op.execute("UPDATE users SET role = 'ADMIN' WHERE role = 'SUPERADMIN'")
    op.execute("UPDATE users SET role = 'ATHLETE' WHERE role = 'USER'")
