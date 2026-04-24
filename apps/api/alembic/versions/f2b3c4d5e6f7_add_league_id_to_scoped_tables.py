"""add league_id to scoped tables

Revision ID: f2b3c4d5e6f7
Revises: e1a2b3c4d5e6
Create Date: 2026-04-24

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f2b3c4d5e6f7"
down_revision: Union[str, Sequence[str], None] = "e1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("competitions", sa.Column("league_id", sa.Integer(), nullable=True))
    op.add_column("delegations", sa.Column("league_id", sa.Integer(), nullable=True))
    op.add_column("athletes", sa.Column("league_id", sa.Integer(), nullable=True))
    op.add_column("chief_requests", sa.Column("league_id", sa.Integer(), nullable=True))
    op.add_column("narratives", sa.Column("league_id", sa.Integer(), nullable=True))
    op.add_column("ai_generations", sa.Column("league_id", sa.Integer(), nullable=True))

    op.create_foreign_key(None, "competitions", "leagues", ["league_id"], ["id"])
    op.create_foreign_key(None, "delegations", "leagues", ["league_id"], ["id"])
    op.create_foreign_key(None, "athletes", "leagues", ["league_id"], ["id"])
    op.create_foreign_key(None, "chief_requests", "leagues", ["league_id"], ["id"])
    op.create_foreign_key(None, "narratives", "leagues", ["league_id"], ["id"])
    op.create_foreign_key(None, "ai_generations", "leagues", ["league_id"], ["id"])

    op.execute(
        """
        INSERT INTO leagues (
            name,
            slug,
            description,
            created_by_id,
            sports_config,
            is_showcase,
            auto_simulate,
            transfer_window_enabled,
            timezone,
            status,
            created_at
        )
        SELECT
            'Showcase League',
            'showcase',
            'Migrated default showcase league',
            (SELECT id FROM users ORDER BY id LIMIT 1),
            COALESCE((SELECT json_agg(id ORDER BY id) FROM sports), '[]'::json),
            TRUE,
            TRUE,
            TRUE,
            'America/Sao_Paulo',
            'ACTIVE',
            NOW()
        WHERE NOT EXISTS (SELECT 1 FROM leagues WHERE slug = 'showcase')
          AND EXISTS (SELECT 1 FROM users)
        """
    )

    op.execute(
        """
        UPDATE competitions
        SET league_id = (SELECT id FROM leagues WHERE slug = 'showcase')
        WHERE league_id IS NULL
        """
    )
    op.execute(
        """
        UPDATE delegations
        SET league_id = (SELECT id FROM leagues WHERE slug = 'showcase')
        WHERE league_id IS NULL
        """
    )
    op.execute(
        """
        UPDATE athletes
        SET league_id = (SELECT id FROM leagues WHERE slug = 'showcase')
        WHERE league_id IS NULL
        """
    )
    op.execute(
        """
        UPDATE chief_requests
        SET league_id = (SELECT id FROM leagues WHERE slug = 'showcase')
        WHERE league_id IS NULL
        """
    )
    op.execute(
        """
        UPDATE narratives
        SET league_id = (SELECT id FROM leagues WHERE slug = 'showcase')
        WHERE league_id IS NULL
        """
    )
    op.execute(
        """
        UPDATE ai_generations
        SET league_id = (SELECT id FROM leagues WHERE slug = 'showcase')
        WHERE league_id IS NULL
        """
    )

    op.alter_column("competitions", "league_id", nullable=False)
    op.alter_column("delegations", "league_id", nullable=False)
    op.alter_column("athletes", "league_id", nullable=False)
    op.alter_column("chief_requests", "league_id", nullable=False)

    op.execute(
        """
        INSERT INTO league_members (league_id, user_id, role, joined_at, left_at)
        SELECT
            (SELECT id FROM leagues WHERE slug = 'showcase'),
            dm.user_id,
            (
                CASE dm.role
                    WHEN 'CHIEF' THEN 'CHIEF'
                    WHEN 'COACH' THEN 'COACH'
                    ELSE 'ATHLETE'
                END
            )::leaguememberrole,
            dm.joined_at,
            dm.left_at
        FROM delegation_members dm
        WHERE NOT EXISTS (
            SELECT 1
            FROM league_members lm
            WHERE lm.league_id = (SELECT id FROM leagues WHERE slug = 'showcase')
              AND lm.user_id = dm.user_id
              AND lm.role = (
                  CASE dm.role
                      WHEN 'CHIEF' THEN 'CHIEF'
                      WHEN 'COACH' THEN 'COACH'
                      ELSE 'ATHLETE'
                  END
              )::leaguememberrole
              AND (
                  (lm.left_at IS NULL AND dm.left_at IS NULL) OR
                  lm.left_at = dm.left_at
              )
        )
        """
    )


def downgrade() -> None:
    op.execute("DELETE FROM league_members WHERE league_id = (SELECT id FROM leagues WHERE slug = 'showcase')")
    op.alter_column("chief_requests", "league_id", nullable=True)
    op.alter_column("athletes", "league_id", nullable=True)
    op.alter_column("delegations", "league_id", nullable=True)
    op.alter_column("competitions", "league_id", nullable=True)

    op.drop_constraint(None, "ai_generations", type_="foreignkey")
    op.drop_constraint(None, "narratives", type_="foreignkey")
    op.drop_constraint(None, "chief_requests", type_="foreignkey")
    op.drop_constraint(None, "athletes", type_="foreignkey")
    op.drop_constraint(None, "delegations", type_="foreignkey")
    op.drop_constraint(None, "competitions", type_="foreignkey")

    op.drop_column("ai_generations", "league_id")
    op.drop_column("narratives", "league_id")
    op.drop_column("chief_requests", "league_id")
    op.drop_column("athletes", "league_id")
    op.drop_column("delegations", "league_id")
    op.drop_column("competitions", "league_id")

    op.execute("DELETE FROM leagues WHERE slug = 'showcase'")
