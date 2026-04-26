"""rename weekstatus enum to competitionstatus

Revision ID: a8b1a6464e9e
Revises: a4b5c6d7e8f9
Create Date: 2026-04-24 17:32:30.346709

"""
from typing import Sequence, Union

from alembic import op

revision: str = 'a8b1a6464e9e'
down_revision: Union[str, Sequence[str], None] = 'a4b5c6d7e8f9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE weekstatus RENAME TO competitionstatus")
    op.drop_index('uq_league_members_active_league_user', table_name='league_members', postgresql_where='(left_at IS NULL)')
    op.drop_constraint('leagues_slug_key', 'leagues', type_='unique')
    op.drop_index('ix_leagues_slug', table_name='leagues')
    op.create_index('ix_leagues_slug', 'leagues', ['slug'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_leagues_slug', table_name='leagues')
    op.create_index('ix_leagues_slug', 'leagues', ['slug'], unique=False)
    op.create_unique_constraint('leagues_slug_key', 'leagues', ['slug'])
    op.create_index('uq_league_members_active_league_user', 'league_members', ['league_id', 'user_id'], unique=True, postgresql_where='(left_at IS NULL)')
    op.execute("ALTER TYPE competitionstatus RENAME TO weekstatus")
