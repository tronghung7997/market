"""pricing configs, service tasks, provider adapter columns

Revision ID: f1a2b3c4d5e6
Revises: e2b3c4d5f6a7
Create Date: 2026-06-22
"""
import sqlalchemy as sa
from alembic import op

revision = "f1a2b3c4d5e6"
down_revision = "e2b3c4d5f6a7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # -- new tables --
    op.create_table(
        "pricing_configs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("service_type", sa.String(50), unique=True, nullable=False),
        sa.Column("strategy", sa.String(50), nullable=False),
        sa.Column("params", sa.JSON(), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "service_tasks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("platform", sa.String(50), nullable=False),
        sa.Column("target_url", sa.Text(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("pending", "assigned", "processing", "completed", "failed", name="servicetaskstatus"),
            server_default="pending",
        ),
        sa.Column("assignee", sa.String(100), nullable=True),
        sa.Column("result_data", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # -- extend providers --
    op.add_column("providers", sa.Column("adapter_type", sa.String(50), server_default="mock"))
    op.add_column("providers", sa.Column("pricing_strategy", sa.String(50), server_default="fixed"))
    op.add_column("providers", sa.Column("fallback_provider_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_providers_fallback", "providers", "providers",
        ["fallback_provider_id"], ["id"],
    )

    # -- extend products --
    op.add_column("products", sa.Column("provider_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_products_provider", "products", "providers",
        ["provider_id"], ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_products_provider", "products", type_="foreignkey")
    op.drop_column("products", "provider_id")

    op.drop_constraint("fk_providers_fallback", "providers", type_="foreignkey")
    op.drop_column("providers", "fallback_provider_id")
    op.drop_column("providers", "pricing_strategy")
    op.drop_column("providers", "adapter_type")

    op.drop_table("service_tasks")
    sa.Enum(name="servicetaskstatus").drop(op.get_bind(), checkfirst=True)

    op.drop_table("pricing_configs")
