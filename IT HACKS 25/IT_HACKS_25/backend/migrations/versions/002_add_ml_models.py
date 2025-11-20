"""Add ML models and predictions tables

Revision ID: 002_add_ml_models
Revises: 001_initial
Create Date: 2025-11-20
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002_add_ml_models'
down_revision = '001_initial'
branch_labels = None
depends_on = None


def upgrade():
    # Create ml_models table
    op.create_table(
        'ml_models',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('version', sa.String(length=50), nullable=False),
        sa.Column('model_type', sa.String(length=100), nullable=False),
        sa.Column('model_path', sa.String(length=500), nullable=True),
        sa.Column('train_mae', sa.Float(), nullable=True),
        sa.Column('test_mae', sa.Float(), nullable=True),
        sa.Column('train_rmse', sa.Float(), nullable=True),
        sa.Column('test_rmse', sa.Float(), nullable=True),
        sa.Column('train_r2', sa.Float(), nullable=True),
        sa.Column('test_r2', sa.Float(), nullable=True),
        sa.Column('performance_score', sa.Float(), nullable=True),
        sa.Column('n_samples', sa.Integer(), nullable=True),
        sa.Column('n_features', sa.Integer(), nullable=True),
        sa.Column('hyperparameters', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('is_active', sa.Boolean(), default=False),
        sa.Column('status', sa.String(length=50), default='trained'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('trained_by', sa.String(length=100), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('version')
    )
    op.create_index('idx_model_version', 'ml_models', ['version'], unique=False)
    op.create_index('idx_model_active', 'ml_models', ['is_active'], unique=False)
    op.create_index(op.f('ix_ml_models_id'), 'ml_models', ['id'], unique=False)
    op.create_index(op.f('ix_ml_models_created_at'), 'ml_models', ['created_at'], unique=False)

    # Create predictions table
    op.create_table(
        'predictions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('farm_id', sa.Integer(), nullable=False),
        sa.Column('room_id', sa.Integer(), nullable=False),
        sa.Column('model_id', sa.Integer(), nullable=True),
        sa.Column('target_date', sa.Date(), nullable=False),
        sa.Column('metric_name', sa.String(length=100), nullable=False),
        sa.Column('predicted_value', sa.Float(), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('prediction_horizon', sa.Integer(), nullable=False),
        sa.Column('upper_bound', sa.Float(), nullable=True),
        sa.Column('lower_bound', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('prediction_type', sa.String(length=50), default='forecast'),
        sa.ForeignKeyConstraint(['farm_id'], ['farms.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['room_id'], ['rooms.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['model_id'], ['ml_models.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('room_id', 'target_date', 'metric_name', 'model_id', name='uq_prediction')
    )
    op.create_index('idx_prediction_date', 'predictions', ['target_date'], unique=False)
    op.create_index('idx_prediction_room', 'predictions', ['room_id', 'target_date'], unique=False)
    op.create_index('idx_prediction_farm', 'predictions', ['farm_id', 'target_date'], unique=False)
    op.create_index(op.f('ix_predictions_id'), 'predictions', ['id'], unique=False)
    op.create_index(op.f('ix_predictions_farm_id'), 'predictions', ['farm_id'], unique=False)
    op.create_index(op.f('ix_predictions_room_id'), 'predictions', ['room_id'], unique=False)
    op.create_index(op.f('ix_predictions_model_id'), 'predictions', ['model_id'], unique=False)


def downgrade():
    # Drop predictions table
    op.drop_index(op.f('ix_predictions_model_id'), table_name='predictions')
    op.drop_index(op.f('ix_predictions_room_id'), table_name='predictions')
    op.drop_index(op.f('ix_predictions_farm_id'), table_name='predictions')
    op.drop_index(op.f('ix_predictions_id'), table_name='predictions')
    op.drop_index('idx_prediction_farm', table_name='predictions')
    op.drop_index('idx_prediction_room', table_name='predictions')
    op.drop_index('idx_prediction_date', table_name='predictions')
    op.drop_table('predictions')
    
    # Drop ml_models table
    op.drop_index(op.f('ix_ml_models_created_at'), table_name='ml_models')
    op.drop_index(op.f('ix_ml_models_id'), table_name='ml_models')
    op.drop_index('idx_model_active', table_name='ml_models')
    op.drop_index('idx_model_version', table_name='ml_models')
    op.drop_table('ml_models')
