"""fastapi users fields

Revision ID: a3f2c1e8b4d9
Revises: 10eeacc3ca6c
Create Date: 2026-04-21 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'a3f2c1e8b4d9'
down_revision: Union[str, Sequence[str], None] = '10eeacc3ca6c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('users', 'password_hash', new_column_name='hashed_password')
    op.add_column('users', sa.Column('is_superuser', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    op.drop_column('users', 'is_verified')
    op.drop_column('users', 'is_superuser')
    op.alter_column('users', 'hashed_password', new_column_name='password_hash')
