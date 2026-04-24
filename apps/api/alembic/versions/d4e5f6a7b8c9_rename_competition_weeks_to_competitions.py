"""rename competition_weeks to competitions

Revision ID: d4e5f6a7b8c9
Revises: a3f2c1e8b4d9
Create Date: 2026-04-24

"""
from typing import Sequence, Union

from alembic import op

revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, Sequence[str], None] = 'a3f2c1e8b4d9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.rename_table("competition_weeks", "competitions")
    op.alter_column("competitions", "week_number", new_column_name="number")
    op.alter_column("events", "week_id", new_column_name="competition_id")
    op.alter_column("athlete_statistics", "week_id", new_column_name="competition_id")
    op.alter_column("records", "week_id", new_column_name="competition_id")


def downgrade() -> None:
    op.alter_column("records", "competition_id", new_column_name="week_id")
    op.alter_column("athlete_statistics", "competition_id", new_column_name="week_id")
    op.alter_column("events", "competition_id", new_column_name="week_id")
    op.alter_column("competitions", "number", new_column_name="week_number")
    op.rename_table("competitions", "competition_weeks")
