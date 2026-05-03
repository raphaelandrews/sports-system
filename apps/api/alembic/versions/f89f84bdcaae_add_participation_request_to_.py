"""add_participation_request_to_notification_type_enum

Revision ID: f89f84bdcaae
Revises: 9c0109a8c2e7
Create Date: 2026-05-03 10:16:06.775158

"""

from typing import Sequence, Union

import sqlmodel
import sqlmodel.sql.sqltypes
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f89f84bdcaae"
down_revision: Union[str, Sequence[str], None] = "9c0109a8c2e7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TYPE notificationtype ADD VALUE 'PARTICIPATION_REQUEST'")


def downgrade() -> None:
    """Downgrade schema."""
    # PostgreSQL does not support removing enum values directly.
    # To downgrade, the enum would need to be recreated without PARTICIPATION_REQUEST,
    # which is complex and risks data loss. Skipping for safety.
    pass
