"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-08-15

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    transaction_type = sa.Enum("income", "expense", name="transactiontype")

    op.create_table(
        "Account",
        sa.Column("profile_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=20), nullable=False),
        sa.Column("email", sa.String(length=20), nullable=False),
        sa.Column("password", sa.String(length=20), nullable=False),
        sa.Column("mobile_number", sa.String(length=20), nullable=False),
        sa.Column("re_enter_password", sa.String(length=20), nullable=False),
        sa.Column("role", sa.String(length=20), server_default="user", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("token_version", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("auth_provider", sa.String(length=20), server_default="local", nullable=False),
        sa.Column("google_id", sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint("profile_id"),
        sa.UniqueConstraint("google_id"),
    )
    op.create_index(op.f("ix_Account_profile_id"), "Account", ["profile_id"], unique=False)

    op.create_table(
        "Categories",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index(op.f("ix_Categories_id"), "Categories", ["id"], unique=False)

    op.create_table(
        "Transactions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("type", transaction_type, nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("note", sa.String(length=255), nullable=True),
        sa.Column("transaction_datetime", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["Account.profile_id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_Transactions_id"), "Transactions", ["id"], unique=False)
    op.create_index(op.f("ix_Transactions_user_id"), "Transactions", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_Transactions_user_id"), table_name="Transactions")
    op.drop_index(op.f("ix_Transactions_id"), table_name="Transactions")
    op.drop_table("Transactions")

    op.drop_index(op.f("ix_Categories_id"), table_name="Categories")
    op.drop_table("Categories")

    op.drop_index(op.f("ix_Account_profile_id"), table_name="Account")
    op.drop_table("Account")

    sa.Enum(name="transactiontype").drop(op.get_bind(), checkfirst=True)
