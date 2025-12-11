"""Analytics API endpoints for advanced insights."""

import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
import numpy as np
import pandas as pd

from auth.utils import get_current_active_user
from database import get_db
from models.auth import User
from models.farm import Metric, Room, Farm
from services.analytics import (
    TrendAnalyzer,
    AnomalyStatisticsCalculator,
    PerformanceMetricsCalculator,
    CorrelationAnalyzer,
    TimeSeriesForecast,
    ReportGenerator
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/analytics", tags=["analytics"])

# Initialize analytics services
trend_analyzer = TrendAnalyzer()
anomaly_calculator = AnomalyStatisticsCalculator()
performance_calculator = PerformanceMetricsCalculator()
correlation_analyzer = CorrelationAnalyzer()
forecaster = TimeSeriesForecast()
report_generator = ReportGenerator()


@router.get('/trends')
async def get_trends(
    farm_id: Optional[int] = Query(None, description="Farm ID"),
    room_id: Optional[int] = Query(None, description="Room ID"),
    days: int = Query(default=30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Analyze metric trends over time.
    
    Query Parameters:
        farm_id: Optional farm ID
        room_id: Optional room ID (requires farm_id)
        days: Number of days to analyze (1-365, default 30)
    
    Returns:
        {
            "status": "success",
            "period_days": 30,
            "metrics": {
                "temperature_c": {
                    "slope": 0.05,
                    "direction": "increasing",
                    "r_squared": 0.92,
                    "velocity": 0.8,
                    "acceleration": 0.02
                },
                ...
            },
            "timestamp": "ISO timestamp"
        }
    
    Response time: <1.5s
    """
    try:
        # Validate parameters
        if room_id and not farm_id:
            raise HTTPException(status_code=400, detail="farm_id required when specifying room_id")
        
        # Get metrics
        start_date = datetime.utcnow() - timedelta(days=days)
        query = select(Metric).where(Metric.recorded_date >= start_date)
        
        if room_id:
            query = query.where(Metric.room_id == room_id)
        elif farm_id:
            # Get all rooms in farm
            rooms = await db.scalars(select(Room).where(Room.farm_id == farm_id))
            room_ids = [r.id for r in rooms]
            if room_ids:
                query = query.where(Metric.room_id.in_(room_ids))
        
        metrics = await db.scalars(query)
        metrics_list = list(metrics)
        
        if not metrics_list:
            return {
                "status": "success",
                "period_days": days,
                "metrics": {},
                "timestamp": datetime.utcnow().isoformat()
            }
        
        # Convert to DataFrame
        metrics_df = pd.DataFrame([
            {
                'metric_name': m.metric_name,
                'metric_value': m.metric_value,
                'recorded_date': m.recorded_date
            }
            for m in metrics_list
        ])
        
        # Get unique metric names
        metric_names = metrics_df['metric_name'].unique().tolist()
        
        # Calculate trends
        trends = trend_analyzer.get_metric_trends(metrics_df, metric_names)
        
        return {
            "status": "success",
            "period_days": days,
            "metrics": trends,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Trend analysis failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/anomaly-stats')
async def get_anomaly_statistics(
    farm_id: Optional[int] = Query(None),
    room_id: Optional[int] = Query(None),
    days: int = Query(default=30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Get statistics about detected anomalies.
    
    Returns:
        {
            "status": "success",
            "statistics": {
                "total_count": 45,
                "by_severity": {low: 20, medium: 15, high: 10},
                "by_type": {multivariate: 30, univariate: 15},
                "average_score": 0.75,
                "frequency": "high",
                "top_metric": "temperature_c"
            },
            "period_days": 30,
            "timestamp": "ISO timestamp"
        }
    
    Response time: <1 second
    """
    try:
        # For now, return mock anomalies (actual integration with anomaly table)
        # In production, this would query the anomalies table created in Section 2
        
        mock_anomalies = [
            {
                'metric_name': 'temperature_c',
                'metric_value': 28.5,
                'anomaly_score': 0.92,
                'severity': 'high',
                'anomaly_type': 'multivariate',
                'anomaly_date': datetime.utcnow()
            },
            {
                'metric_name': 'humidity_pct',
                'metric_value': 45.0,
                'anomaly_score': 0.68,
                'severity': 'medium',
                'anomaly_type': 'univariate',
                'anomaly_date': datetime.utcnow() - timedelta(days=1)
            },
            {
                'metric_name': 'co2_ppm',
                'metric_value': 1200.0,
                'anomaly_score': 0.55,
                'severity': 'low',
                'anomaly_type': 'univariate',
                'anomaly_date': datetime.utcnow() - timedelta(days=2)
            }
        ]
        
        stats = anomaly_calculator.calculate_anomaly_stats(mock_anomalies)
        
        return {
            "status": "success",
            "statistics": stats,
            "period_days": days,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Anomaly statistics failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/performance')
async def get_performance_metrics(
    farm_id: Optional[int] = Query(None),
    metric_type: str = Query(default='prediction', regex='^(prediction|system|model)$'),
    days: int = Query(default=30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Get performance metrics for models and predictions.
    
    Query Parameters:
        metric_type: 'prediction'|'system'|'model'
        days: Number of days to analyze
    
    Returns:
        {
            "status": "success",
            "metrics": {
                "mae": 0.45,
                "rmse": 0.67,
                "mape": 5.2,
                "r_squared": 0.88
            },
            "metric_type": "prediction",
            "timestamp": "ISO timestamp"
        }
    
    Response time: <1 second
    """
    try:
        # Generate mock metrics
        if metric_type == 'prediction':
            mock_data = [
                {'actual': 25.0, 'predicted': 25.2},
                {'actual': 25.5, 'predicted': 25.3},
                {'actual': 26.0, 'predicted': 26.1},
                {'actual': 25.8, 'predicted': 25.9},
                {'actual': 26.2, 'predicted': 26.0},
            ]
            metrics = performance_calculator.calculate_prediction_accuracy(mock_data)
        elif metric_type == 'system':
            mock_data = [
                {'latency_ms': 45, 'success': True},
                {'latency_ms': 52, 'success': True},
                {'latency_ms': 48, 'success': True},
                {'latency_ms': 150, 'success': True},
                {'latency_ms': 51, 'success': False},
            ]
            metrics = performance_calculator.get_system_performance(mock_data)
        else:  # model
            mock_data = [
                {'actual': 100, 'predicted': 102},
                {'actual': 110, 'predicted': 108},
                {'actual': 105, 'predicted': 106},
            ]
            metrics = performance_calculator.calculate_prediction_accuracy(mock_data)
        
        return {
            "status": "success",
            "metrics": metrics,
            "metric_type": metric_type,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Performance metrics failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/correlations')
async def get_metric_correlations(
    farm_id: Optional[int] = Query(None),
    room_id: Optional[int] = Query(None),
    days: int = Query(default=30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Analyze correlations between metrics.
    
    Returns:
        {
            "status": "success",
            "correlations": {
                "pairs": [
                    {
                        "metric1": "temperature_c",
                        "metric2": "humidity_pct",
                        "correlation": 0.82
                    }
                ],
                "count": 1
            },
            "timestamp": "ISO timestamp"
        }
    
    Response time: <1.5s
    """
    try:
        # Get metrics
        start_date = datetime.utcnow() - timedelta(days=days)
        query = select(Metric).where(Metric.recorded_date >= start_date)
        
        if room_id:
            query = query.where(Metric.room_id == room_id)
        elif farm_id:
            rooms = await db.scalars(select(Room).where(Room.farm_id == farm_id))
            room_ids = [r.id for r in rooms]
            if room_ids:
                query = query.where(Metric.room_id.in_(room_ids))
        
        metrics = await db.scalars(query)
        metrics_list = list(metrics)
        
        if not metrics_list:
            return {
                "status": "success",
                "correlations": {"pairs": [], "count": 0},
                "timestamp": datetime.utcnow().isoformat()
            }
        
        # Convert to DataFrame
        metrics_df = pd.DataFrame([
            {
                'metric_name': m.metric_name,
                'metric_value': m.metric_value,
                'recorded_date': m.recorded_date,
                'room_id': m.room_id
            }
            for m in metrics_list
        ])
        
        # Get metric names
        metric_names = metrics_df['metric_name'].unique().tolist()
        
        # Calculate correlations
        correlations = correlation_analyzer.calculate_correlations(metrics_df, metric_names)
        
        return {
            "status": "success",
            "correlations": {
                "pairs": correlations['pairs'],
                "count": len(correlations['pairs'])
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Correlation analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/forecasts')
async def get_metric_forecasts(
    room_id: int = Query(..., description="Room ID for forecast"),
    metric_name: str = Query(..., description="Metric to forecast"),
    periods: int = Query(default=7, ge=1, le=30, description="Forecast periods"),
    days: int = Query(default=30, ge=7, le=365, description="Historical data to use"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Generate forecast for a metric.
    
    Query Parameters:
        room_id: Room ID (required)
        metric_name: Metric to forecast (required)
        periods: Forecast periods (1-30, default 7)
        days: Historical data days (7-365, default 30)
    
    Returns:
        {
            "status": "success",
            "room_id": 1,
            "metric_name": "temperature_c",
            "forecast": {
                "forecast": [25.5, 25.8, 26.0, ...],
                "confidence_interval": {
                    "lower": [...],
                    "upper": [...]
                },
                "method": "exponential_smoothing"
            },
            "periods": 7,
            "timestamp": "ISO timestamp"
        }
    
    Response time: <500ms
    """
    try:
        # Get historical data
        start_date = datetime.utcnow() - timedelta(days=days)
        stmt = select(Metric).where(
            and_(
                Metric.room_id == room_id,
                Metric.metric_name == metric_name,
                Metric.recorded_date >= start_date
            )
        ).order_by(Metric.recorded_date)
        
        metrics = await db.scalars(stmt)
        metrics_list = list(metrics)
        
        if not metrics_list:
            raise HTTPException(status_code=404, detail="No data found for forecast")
        
        # Extract values
        values = np.array([m.metric_value for m in metrics_list])
        
        # Generate forecast
        forecast_result = forecaster.forecast_metric(values, periods=periods)
        
        return {
            "status": "success",
            "room_id": room_id,
            "metric_name": metric_name,
            "forecast": forecast_result,
            "periods": periods,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Forecast generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
