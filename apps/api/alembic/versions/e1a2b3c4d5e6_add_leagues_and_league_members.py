"""add leagues and league_members

Revision ID: e1a2b3c4d5e6
Revises: d4e5f6a7b8c9
Create Date: 2026-04-24

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from sqlalchemy.dialects import postgresql


revision: str = "e1a2b3c4d5e6"
down_revision: Union[str, Sequence[str], None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    league_status = postgresql.ENUM(
        "ACTIVE", "ARCHIVED", name="leaguestatus", create_type=False
    )
    league_member_role = postgresql.ENUM(
        "LEAGUE_ADMIN", "CHIEF", "COACH", "ATHLETE", name="leaguememberrole", create_type=False
    )
    bind = op.get_bind()
    league_status.create(bind, checkfirst=True)
    league_member_role.create(bind, checkfirst=True)

    op.create_table(
        "leagues",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("slug", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("description", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column("created_by_id", sa.Integer(), nullable=False),
        sa.Column("sports_config", sa.JSON(), nullable=False),
        sa.Column("is_showcase", sa.Boolean(), nullable=False),
        sa.Column("auto_simulate", sa.Boolean(), nullable=False),
        sa.Column("transfer_window_enabled", sa.Boolean(), nullable=False),
        sa.Column("timezone", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("status", league_status, nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index(op.f("ix_leagues_slug"), "leagues", ["slug"], unique=False)

    op.create_table(
        "league_members",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("league_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("role", league_member_role, nullable=False),
        sa.Column("joined_at", sa.DateTime(), nullable=False),
        sa.Column("left_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["league_id"], ["leagues.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "uq_league_members_active_league_user",
        "league_members",
        ["league_id", "user_id"],
        unique=True,
        postgresql_where=sa.text("left_at IS NULL"),
    )


def downgrade() -> None:
    op.drop_index("uq_league_members_active_league_user", table_name="league_members")
    op.drop_table("league_members")
    op.drop_index(op.f("ix_leagues_slug"), table_name="leagues")
    op.drop_table("leagues")

    bind = op.get_bind()
    postgresql.ENUM(name="leaguememberrole").drop(bind, checkfirst=True)
    postgresql.ENUM(name="leaguestatus").drop(bind, checkfirst=True)
