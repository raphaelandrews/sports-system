"""add league mode and timing fields

Revision ID: c5ccce3cc814
Revises: a8b1a6464e9e
Create Date: 2026-04-26 20:08:44.332797

"""

from typing import Sequence, Union

import sqlmodel
import sqlmodel.sql.sqltypes
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c5ccce3cc814"
down_revision: Union[str, Sequence[str], None] = "a8b1a6464e9e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create enum type first
    leaguemode = sa.Enum("NORMAL", "SPEED", name="leaguemode")
    leaguemode.create(op.get_bind())

    # Add columns
    op.add_column("leagues", sa.Column("mode", leaguemode, nullable=True))
    op.add_column(
        "leagues", sa.Column("match_duration_seconds", sa.Integer(), nullable=True)
    )
    op.add_column(
        "leagues", sa.Column("schedule_interval_seconds", sa.Integer(), nullable=True)
    )

    # Set default values for existing rows
    op.execute(
        "UPDATE leagues SET mode = 'NORMAL', match_duration_seconds = 300, schedule_interval_seconds = 300"
    )

    # Make columns non-nullable
    op.alter_column("leagues", "mode", nullable=False)
    op.alter_column("leagues", "match_duration_seconds", nullable=False)
    op.alter_column("leagues", "schedule_interval_seconds", nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("leagues", "schedule_interval_seconds")
    op.drop_column("leagues", "match_duration_seconds")
    op.drop_column("leagues", "mode")
    sa.Enum("NORMAL", "SPEED", name="leaguemode").drop(op.get_bind())
