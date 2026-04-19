"""add gender to athletes

Revision ID: b6e7e4e5368c
Revises: 627739ebd29e
Create Date: 2026-04-19 10:03:02.078760

"""
from typing import Sequence, Union

import sqlmodel
import sqlmodel.sql.sqltypes
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b6e7e4e5368c'
down_revision: Union[str, Sequence[str], None] = '627739ebd29e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    athlete_gender = sa.Enum('M', 'F', name='athletegender')
    athlete_gender.create(op.get_bind(), checkfirst=True)
    op.add_column('athletes', sa.Column('gender', athlete_gender, nullable=True))


def downgrade() -> None:
    op.drop_column('athletes', 'gender')
    sa.Enum(name='athletegender').drop(op.get_bind(), checkfirst=True)
