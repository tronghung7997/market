"""enrich product fields

Revision ID: c7e3f1a2d4b6
Revises: b5ad8d42be9b
Create Date: 2026-06-20
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

revision = "c7e3f1a2d4b6"
down_revision = "b5ad8d42be9b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("products", sa.Column("service_type", sa.String(50), nullable=True, server_default="other"))
    op.add_column("products", sa.Column("features", JSON, nullable=True))
    op.add_column("products", sa.Column("specs", JSON, nullable=True))
    op.add_column("products", sa.Column("warranty_text", sa.Text, nullable=True))
    op.add_column("products", sa.Column("highlight_text", sa.Text, nullable=True))
    op.add_column("products", sa.Column("sold_count", sa.Integer, nullable=False, server_default="0"))
    op.add_column("products", sa.Column("rating_avg", sa.Float, nullable=True))
    op.add_column("products", sa.Column("rating_count", sa.Integer, nullable=False, server_default="0"))


def downgrade() -> None:
    op.drop_column("products", "rating_count")
    op.drop_column("products", "rating_avg")
    op.drop_column("products", "sold_count")
    op.drop_column("products", "highlight_text")
    op.drop_column("products", "warranty_text")
    op.drop_column("products", "specs")
    op.drop_column("products", "features")
    op.drop_column("products", "service_type")
