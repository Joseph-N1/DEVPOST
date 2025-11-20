"""Initial migration: create farms, rooms, metrics tables

Revision ID: 001_initial
Revises: 
Create Date: 2025-01-20 00:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create farms table
    op.create_table(
        'farms',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_farms_id'), 'farms', ['id'], unique=False)
    
    # Create rooms table
    op.create_table(
        'rooms',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('farm_id', sa.Integer(), nullable=False),
        sa.Column('room_id', sa.String(length=50), nullable=False),
        sa.Column('birds_start', sa.Integer(), nullable=True),
        sa.Column('flock_age_start', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['farm_id'], ['farms.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('farm_id', 'room_id', name='uq_farm_room')
    )
    op.create_index(op.f('ix_rooms_id'), 'rooms', ['id'], unique=False)
    op.create_index(op.f('ix_rooms_farm_id'), 'rooms', ['farm_id'], unique=False)
    op.create_index('idx_farm_room', 'rooms', ['farm_id', 'room_id'], unique=False)
    
    # Create metrics table
    op.create_table(
        'metrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('room_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('eggs_produced', sa.Integer(), nullable=True),
        sa.Column('avg_weight_kg', sa.Float(), nullable=True),
        sa.Column('feed_consumed_kg', sa.Float(), nullable=True),
        sa.Column('water_consumed_l', sa.Float(), nullable=True),
        sa.Column('fcr', sa.Float(), nullable=True),
        sa.Column('mortality_rate', sa.Float(), nullable=True),
        sa.Column('production_rate', sa.Float(), nullable=True),
        sa.Column('temperature_c', sa.Float(), nullable=True),
        sa.Column('humidity_pct', sa.Float(), nullable=True),
        sa.Column('ammonia_ppm', sa.Float(), nullable=True),
        sa.Column('revenue', sa.Float(), nullable=True),
        sa.Column('cost', sa.Float(), nullable=True),
        sa.Column('profit', sa.Float(), nullable=True),
        sa.Column('anomaly_detected', sa.Boolean(), default=False),
        sa.Column('anomaly_score', sa.Float(), nullable=True),
        sa.Column('health_score', sa.Float(), nullable=True),
        sa.Column('birds_remaining', sa.Integer(), nullable=True),
        sa.Column('flock_age_days', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['room_id'], ['rooms.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('room_id', 'date', name='uq_room_date')
    )
    op.create_index(op.f('ix_metrics_id'), 'metrics', ['id'], unique=False)
    op.create_index(op.f('ix_metrics_room_id'), 'metrics', ['room_id'], unique=False)
    op.create_index(op.f('ix_metrics_date'), 'metrics', ['date'], unique=False)
    op.create_index('idx_room_date', 'metrics', ['room_id', 'date'], unique=False)
    op.create_index('idx_anomaly', 'metrics', ['anomaly_detected'], unique=False)


def downgrade() -> None:
    op.drop_table('metrics')
    op.drop_table('rooms')
    op.drop_table('farms')
