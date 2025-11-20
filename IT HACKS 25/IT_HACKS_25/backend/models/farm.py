"""
SQLAlchemy models for farm management database.

Schema Overview:
- farms: Top-level entity representing a farm/facility
- rooms: Individual poultry rooms within a farm
- metrics: Daily performance metrics for each room
"""

from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Index, UniqueConstraint, Boolean, Text, JSON
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func
from datetime import date, datetime
from typing import Optional

Base = declarative_base()


class Farm(Base):
    """
    Represents a farm/facility with multiple rooms.
    Created automatically when CSV is uploaded.
    """
    __tablename__ = "farms"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationship to rooms
    rooms = relationship("Room", back_populates="farm", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Farm(id={self.id}, name='{self.name}')>"


class Room(Base):
    """
    Represents a poultry room within a farm.
    Each room has a unique identifier (room_id) within its farm.
    """
    __tablename__ = "rooms"
    
    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Room identifier from CSV (e.g., "Room 1", "A", "101")
    room_id = Column(String(50), nullable=False)
    
    # Initial flock parameters
    birds_start = Column(Integer, nullable=True)  # Initial number of birds
    flock_age_start = Column(Integer, nullable=True)  # Flock age in days at start
    
    # Metadata
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    farm = relationship("Farm", back_populates="rooms")
    metrics = relationship("Metric", back_populates="room", cascade="all, delete-orphan")
    
    # Ensure room_id is unique within each farm
    __table_args__ = (
        UniqueConstraint('farm_id', 'room_id', name='uq_farm_room'),
        Index('idx_farm_room', 'farm_id', 'room_id'),
    )
    
    def __repr__(self):
        return f"<Room(id={self.id}, farm_id={self.farm_id}, room_id='{self.room_id}')>"


class Metric(Base):
    """
    Daily performance metrics for a room.
    Each metric record represents one day's data for one room.
    """
    __tablename__ = "metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Date of the metric
    date = Column(Date, nullable=False, index=True)
    
    # Production Metrics
    eggs_produced = Column(Integer, nullable=True)
    avg_weight_kg = Column(Float, nullable=True)
    feed_consumed_kg = Column(Float, nullable=True)
    water_consumed_l = Column(Float, nullable=True)
    
    # Performance Indicators
    fcr = Column(Float, nullable=True)  # Feed Conversion Ratio
    mortality_rate = Column(Float, nullable=True)  # Daily mortality rate (%)
    production_rate = Column(Float, nullable=True)  # Egg production rate (%)
    
    # Environmental Conditions
    temperature_c = Column(Float, nullable=True)
    humidity_pct = Column(Float, nullable=True)
    ammonia_ppm = Column(Float, nullable=True)
    
    # Financial Metrics
    revenue = Column(Float, nullable=True)
    cost = Column(Float, nullable=True)
    profit = Column(Float, nullable=True)
    
    # Health & Anomaly Detection
    anomaly_detected = Column(Boolean, default=False)
    anomaly_score = Column(Float, nullable=True)
    health_score = Column(Float, nullable=True)  # 0-100 overall health score
    
    # Flock Information
    birds_remaining = Column(Integer, nullable=True)
    flock_age_days = Column(Integer, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=func.now(), nullable=False)
    
    # Relationship
    room = relationship("Room", back_populates="metrics")
    
    # Composite index for efficient date range queries per room
    __table_args__ = (
        UniqueConstraint('room_id', 'date', name='uq_room_date'),
        Index('idx_room_date', 'room_id', 'date'),
        Index('idx_date', 'date'),
        Index('idx_anomaly', 'anomaly_detected'),
    )
    
    def __repr__(self):
        return f"<Metric(id={self.id}, room_id={self.room_id}, date={self.date}, eggs={self.eggs_produced})>"
    
    def to_dict(self):
        """Convert metric to dictionary for JSON serialization."""
        return {
            "id": self.id,
            "room_id": self.room_id,
            "date": self.date.isoformat() if self.date else None,
            "eggs_produced": self.eggs_produced,
            "avg_weight_kg": self.avg_weight_kg,
            "feed_consumed_kg": self.feed_consumed_kg,
            "water_consumed_l": self.water_consumed_l,
            "fcr": self.fcr,
            "mortality_rate": self.mortality_rate,
            "production_rate": self.production_rate,
            "temperature_c": self.temperature_c,
            "humidity_pct": self.humidity_pct,
            "ammonia_ppm": self.ammonia_ppm,
            "revenue": self.revenue,
            "cost": self.cost,
            "profit": self.profit,
            "anomaly_detected": self.anomaly_detected,
            "anomaly_score": self.anomaly_score,
            "health_score": self.health_score,
            "birds_remaining": self.birds_remaining,
            "flock_age_days": self.flock_age_days,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class MLModel(Base):
    """
    Machine Learning model registry for version tracking and performance monitoring.
    Stores metadata about trained models, their performance, and deployment status.
    """
    __tablename__ = "ml_models"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)  # e.g., "RandomForest_v1", "LSTM_v2"
    version = Column(String(50), nullable=False, unique=True)  # e.g., "v1.0", "v2.1"
    model_type = Column(String(100), nullable=False)  # "random_forest", "lstm", "transformer"
    
    # Model file paths
    model_path = Column(String(500), nullable=True)  # Path to saved model file
    
    # Performance Metrics
    train_mae = Column(Float, nullable=True)
    test_mae = Column(Float, nullable=True)
    train_rmse = Column(Float, nullable=True)
    test_rmse = Column(Float, nullable=True)
    train_r2 = Column(Float, nullable=True)
    test_r2 = Column(Float, nullable=True)
    performance_score = Column(Float, nullable=True)  # Overall score 0-100
    
    # Training Configuration
    n_samples = Column(Integer, nullable=True)
    n_features = Column(Integer, nullable=True)
    hyperparameters = Column(JSON, nullable=True)  # Store as JSON
    
    # Status & Deployment
    is_active = Column(Boolean, default=False)  # Is this the deployed model?
    status = Column(String(50), default="trained")  # "training", "trained", "deployed", "archived"
    
    # Notes & Description
    notes = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=func.now(), nullable=False, index=True)
    trained_by = Column(String(100), nullable=True)  # User or system that trained it
    
    # Relationship to predictions
    predictions = relationship("Prediction", back_populates="model", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_model_version', 'version'),
        Index('idx_model_active', 'is_active'),
    )
    
    def __repr__(self):
        return f"<MLModel(id={self.id}, name='{self.name}', version='{self.version}', active={self.is_active})>"
    
    def to_dict(self):
        """Convert model to dictionary for JSON serialization."""
        return {
            "id": self.id,
            "name": self.name,
            "version": self.version,
            "model_type": self.model_type,
            "model_path": self.model_path,
            "performance_metrics": {
                "train_mae": self.train_mae,
                "test_mae": self.test_mae,
                "train_rmse": self.train_rmse,
                "test_rmse": self.test_rmse,
                "train_r2": self.train_r2,
                "test_r2": self.test_r2,
                "performance_score": self.performance_score
            },
            "training_config": {
                "n_samples": self.n_samples,
                "n_features": self.n_features,
                "hyperparameters": self.hyperparameters
            },
            "is_active": self.is_active,
            "status": self.status,
            "notes": self.notes,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "trained_by": self.trained_by
        }


class Prediction(Base):
    """
    Stores ML predictions for tracking and historical analysis.
    Each prediction represents a forecasted metric value for a specific room and date.
    """
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False, index=True)
    model_id = Column(Integer, ForeignKey("ml_models.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Prediction Details
    target_date = Column(Date, nullable=False, index=True)  # Date being predicted
    metric_name = Column(String(100), nullable=False)  # "avg_weight_kg", "eggs_produced", etc.
    predicted_value = Column(Float, nullable=False)
    confidence = Column(Float, nullable=True)  # 0-1 confidence score
    
    # Forecast Horizon
    prediction_horizon = Column(Integer, nullable=False)  # Days ahead (7, 14, 30)
    
    # Bounds
    upper_bound = Column(Float, nullable=True)  # Upper confidence interval
    lower_bound = Column(Float, nullable=True)  # Lower confidence interval
    
    # Metadata
    created_at = Column(DateTime, default=func.now(), nullable=False)
    prediction_type = Column(String(50), default="forecast")  # "forecast", "anomaly", "recommendation"
    
    # Relationships
    farm = relationship("Farm")
    room = relationship("Room")
    model = relationship("MLModel", back_populates="predictions")
    
    __table_args__ = (
        UniqueConstraint('room_id', 'target_date', 'metric_name', 'model_id', name='uq_prediction'),
        Index('idx_prediction_date', 'target_date'),
        Index('idx_prediction_room', 'room_id', 'target_date'),
        Index('idx_prediction_farm', 'farm_id', 'target_date'),
    )
    
    def __repr__(self):
        return f"<Prediction(room_id={self.room_id}, metric='{self.metric_name}', target_date={self.target_date}, value={self.predicted_value})>"
    
    def to_dict(self):
        """Convert prediction to dictionary for JSON serialization."""
        return {
            "id": self.id,
            "farm_id": self.farm_id,
            "room_id": self.room_id,
            "model_id": self.model_id,
            "target_date": self.target_date.isoformat() if self.target_date else None,
            "metric_name": self.metric_name,
            "predicted_value": self.predicted_value,
            "confidence": self.confidence,
            "prediction_horizon": self.prediction_horizon,
            "upper_bound": self.upper_bound,
            "lower_bound": self.lower_bound,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "prediction_type": self.prediction_type
        }
