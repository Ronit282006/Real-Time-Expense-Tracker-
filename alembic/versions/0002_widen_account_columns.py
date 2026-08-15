"""widen Account columns for bcrypt hashes and longer emails

Revision ID: 0002
Revises: 0001
Create Date: 2026-08-15

The original schema defined password/re_enter_password as VARCHAR(20),
but bcrypt hashes are 60 characters — registration always failed.
Also widened name/email for real-world values.

For databases created before Alembic (via create_all), run:
    alembic stamp 0001 && alembic upgrade head
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("Account", "name", type_=sa.String(100), existing_type=sa.String(20), nullable=False)
    op.alter_column("Account", "email", type_=sa.String(255), existing_type=sa.String(20), nullable=False)
    op.alter_column("Account", "password", type_=sa.String(255), existing_type=sa.String(20), nullable=False)
    op.alter_column("Account", "re_enter_password", type_=sa.String(255), existing_type=sa.String(20), nullable=False)


def downgrade() -> None:
    # Lossy if existing data exceeds 20 chars.
    op.alter_column("Account", "name", type_=sa.String(20), existing_type=sa.String(100), nullable=False)
    op.alter_column("Account", "email", type_=sa.String(20), existing_type=sa.String(255), nullable=False)
    op.alter_column("Account", "password", type_=sa.String(20), existing_type=sa.String(255), nullable=False)
    op.alter_column("Account", "re_enter_password", type_=sa.String(20), existing_type=sa.String(255), nullable=False)
