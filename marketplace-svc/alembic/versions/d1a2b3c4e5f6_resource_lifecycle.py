"""resource lifecycle fields

Revision ID: d1a2b3c4e5f6
Revises: c7e3f1a2d4b6
Create Date: 2026-06-21
"""
import sqlalchemy as sa
from alembic import op

revision = "d1a2b3c4e5f6"
down_revision = "c7e3f1a2d4b6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("product_variants", sa.Column("duration_days", sa.Integer(), nullable=True))
    op.add_column("resources", sa.Column("order_id", sa.Integer(), nullable=True))
    op.add_column("resources", sa.Column("assigned_at", sa.DateTime(timezone=True), nullable=True))
    op.create_foreign_key("fk_resources_order", "resources", "orders", ["order_id"], ["id"])


def downgrade() -> None:
    op.drop_constraint("fk_resources_order", "resources", type_="foreignkey")
    op.drop_column("resources", "assigned_at")
    op.drop_column("resources", "order_id")
    op.drop_column("product_variants", "duration_days")
