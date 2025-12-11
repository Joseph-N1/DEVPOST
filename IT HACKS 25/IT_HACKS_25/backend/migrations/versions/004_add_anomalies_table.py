"""Add anomalies table for advanced anomaly detection.

Revision ID: 004_add_anomalies_table
Revises: 003_add_auth_tables
Create Date: 2025-12-07 14:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '004_add_anomalies_table'
down_revision = '003_add_auth_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create anomalies table."""
    op.create_table(
        'anomalies',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('room_id', sa.Integer(), nullable=True),
        sa.Column('farm_id', sa.Integer(), nullable=True),
        sa.Column('anomaly_date', sa.DateTime(), nullable=False),
        sa.Column('metric_name', sa.String(100), nullable=False),
        sa.Column('metric_value', sa.Float(), nullable=False),
        sa.Column('anomaly_score', sa.Float(), nullable=False),
        sa.Column('anomaly_type', sa.String(50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('severity', sa.String(20), nullable=False),
        sa.Column('is_confirmed', sa.Boolean(), default=False),
        sa.Column('feedback_provided', sa.Boolean(), default=False),
        sa.Column('user_feedback', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['room_id'], ['rooms.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['farm_id'], ['farms.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for common queries
    op.create_index('ix_anomalies_room_id', 'anomalies', ['room_id'])
    op.create_index('ix_anomalies_farm_id', 'anomalies', ['farm_id'])
    op.create_index('ix_anomalies_date', 'anomalies', ['anomaly_date'])
    op.create_index('ix_anomalies_score', 'anomalies', ['anomaly_score'])
    op.create_index('ix_anomalies_severity', 'anomalies', ['severity'])
    op.create_index('ix_anomalies_type', 'anomalies', ['anomaly_type'])


def downgrade() -> None:
    """Drop anomalies table."""
    op.drop_index('ix_anomalies_type', table_name='anomalies')
    op.drop_index('ix_anomalies_severity', table_name='anomalies')
    op.drop_index('ix_anomalies_score', table_name='anomalies')
    op.drop_index('ix_anomalies_date', table_name='anomalies')
    op.drop_index('ix_anomalies_farm_id', table_name='anomalies')
    op.drop_index('ix_anomalies_room_id', table_name='anomalies')
    op.drop_table('anomalies')
