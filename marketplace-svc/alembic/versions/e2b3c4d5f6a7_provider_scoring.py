"""provider scoring + resource provider link

Revision ID: e2b3c4d5f6a7
Revises: d1a2b3c4e5f6
Create Date: 2026-06-21
"""
import sqlalchemy as sa
from alembic import op

revision = "e2b3c4d5f6a7"
down_revision = "d1a2b3c4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("providers", sa.Column("quality_score", sa.Float(), nullable=True))
    op.add_column("resources", sa.Column("provider_id", sa.Integer(), nullable=True))
    op.create_foreign_key("fk_resources_provider", "resources", "providers", ["provider_id"], ["id"])


def downgrade() -> None:
    op.drop_constraint("fk_resources_provider", "resources", type_="foreignkey")
    op.drop_column("resources", "provider_id")
    op.drop_column("providers", "quality_score")
