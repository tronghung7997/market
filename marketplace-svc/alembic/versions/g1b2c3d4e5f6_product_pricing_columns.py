"""add pricing_strategy and pricing_params to products

Revision ID: g1b2c3d4e5f6
Revises: f1a2b3c4d5e6
Create Date: 2026-06-24
"""
import sqlalchemy as sa
from alembic import op

revision = "g1b2c3d4e5f6"
down_revision = "f1a2b3c4d5e6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("products", sa.Column("pricing_strategy", sa.String(50), nullable=True))
    op.add_column("products", sa.Column("pricing_params", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("products", "pricing_params")
    op.drop_column("products", "pricing_strategy")
