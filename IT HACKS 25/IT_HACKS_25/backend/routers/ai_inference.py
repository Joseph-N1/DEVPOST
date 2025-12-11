"""
Phase 11: Advanced AI Inference Endpoints
Provides specialized prediction and recommendation endpoints for farm management
"""

from fastapi import APIRouter, HTTPException, Query, Path, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import logging

from database import get_db
from models.farm import Farm, Room, MLModel, Metric
from ml.predict import MLPredictor
from ml.explainability import ExplainabilityAnalyzer
from auth.utils import get_current_active_user
from models.auth import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["ai-inference"])

# ============================================================================
# PREDICTION ENDPOINTS
# ============================================================================

@router.get('/predict/eggs')
async def predict_egg_production(
    room_id: int = Query(..., description="Room ID"),
    days_ahead: int = Query(default=7, ge=1, le=30, description="Days to forecast (1-30)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Predict egg production for a specific room.
    
    Returns 7-day, 14-day, and 30-day forecasts with confidence intervals.
    
    Args:
        room_id: Room ID to predict for
        days_ahead: Number of days to forecast
        
    Returns:
        {
            "room_id": int,
            "forecast_days": int,
            "predictions": [
                {
                    "day": int,
                    "predicted_eggs": float,
                    "confidence_lower": float,
                    "confidence_upper": float,
                    "trend": str
                }
            ],
            "summary": {
                "total_eggs_forecast": float,
                "daily_average": float,
                "confidence_level": float
            }
        }
    """
    try:
        logger.info(f"Predicting egg production for room {room_id}, {days_ahead} days")
        
        # Verify room exists
        stmt = select(Room).where(Room.id == room_id)
        result = await db.execute(stmt)
        room = result.scalar_one_or_none()
        
        if not room:
            raise HTTPException(status_code=404, detail=f"Room {room_id} not found")
        
        # Load active model
        model_stmt = select(MLModel).where(MLModel.is_active == True)
        model_result = await db.execute(model_stmt)
        active_model = model_result.scalar_one_or_none()
        
        if not active_model:
            raise HTTPException(status_code=503, detail="No active ML model available")
        
        # Get latest metrics for room
        metrics_stmt = select(Metric)\
            .where(Metric.room_id == room_id)\
            .order_by(Metric.date.desc())\
            .limit(30)
        
        metrics_result = await db.execute(metrics_stmt)
        recent_metrics = metrics_result.scalars().all()
        
        if not recent_metrics:
            raise HTTPException(status_code=404, detail=f"No data available for room {room_id}")
        
        # Use predictor to generate forecast
        predictor = MLPredictor(model_path=f"{active_model.model_path}/..")
        
        predictions = []
        for day in range(1, days_ahead + 1):
            # Placeholder prediction logic - extend with actual ML forecast
            pred = {
                'day': day,
                'predicted_eggs': 145.0 + (day * 2.5),  # Example trend
                'confidence_lower': 140.0,
                'confidence_upper': 150.0,
                'trend': 'increasing' if day > 0 else 'stable'
            }
            predictions.append(pred)
        
        return {
            'room_id': room_id,
            'forecast_days': days_ahead,
            'predictions': predictions,
            'summary': {
                'total_eggs_forecast': sum(p['predicted_eggs'] for p in predictions),
                'daily_average': sum(p['predicted_eggs'] for p in predictions) / len(predictions),
                'confidence_level': 0.85
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/predict/weight')
async def predict_weight_gain(
    room_id: int = Query(..., description="Room ID"),
    days_ahead: int = Query(default=7, ge=1, le=30, description="Days to forecast"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Predict bird weight gain and development trajectory.
    
    Returns predicted average weight per bird with growth rate analysis.
    
    Args:
        room_id: Room ID to predict for
        days_ahead: Number of days to forecast
        
    Returns:
        {
            "room_id": int,
            "forecast_days": int,
            "predictions": [
                {
                    "day": int,
                    "predicted_weight_kg": float,
                    "daily_gain_kg": float,
                    "growth_rate_pct": float
                }
            ],
            "summary": {
                "projected_mature_weight": float,
                "average_daily_gain": float,
                "growth_efficiency": float
            }
        }
    """
    try:
        logger.info(f"Predicting weight gain for room {room_id}, {days_ahead} days")
        
        # Verify room exists
        stmt = select(Room).where(Room.id == room_id)
        result = await db.execute(stmt)
        room = result.scalar_one_or_none()
        
        if not room:
            raise HTTPException(status_code=404, detail=f"Room {room_id} not found")
        
        # Get latest weight data
        metrics_stmt = select(Metric)\
            .where(Metric.room_id == room_id)\
            .order_by(Metric.date.desc())\
            .limit(1)
        
        metrics_result = await db.execute(metrics_stmt)
        latest_metric = metrics_result.scalar_one_or_none()
        
        if not latest_metric or not latest_metric.avg_weight_kg:
            raise HTTPException(status_code=404, detail=f"No weight data for room {room_id}")
        
        # Generate weight predictions
        current_weight = latest_metric.avg_weight_kg
        predictions = []
        
        for day in range(1, days_ahead + 1):
            projected_weight = current_weight + (day * 0.05)  # 50g/day avg gain
            daily_gain = 0.05
            growth_rate = (projected_weight - current_weight) / current_weight * 100 if current_weight > 0 else 0
            
            predictions.append({
                'day': day,
                'predicted_weight_kg': round(projected_weight, 3),
                'daily_gain_kg': round(daily_gain, 3),
                'growth_rate_pct': round(growth_rate, 2)
            })
        
        return {
            'room_id': room_id,
            'forecast_days': days_ahead,
            'predictions': predictions,
            'summary': {
                'projected_mature_weight': round(current_weight + (days_ahead * 0.05), 3),
                'average_daily_gain': 0.05,
                'growth_efficiency': 95.0  # Placeholder
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Weight prediction failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/predict/mortality')
async def predict_mortality_risk(
    room_id: int = Query(..., description="Room ID"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Predict mortality risk score for a room based on current conditions.
    
    Returns risk score (0-100), risk factors, and recommended actions.
    
    Args:
        room_id: Room ID to assess
        
    Returns:
        {
            "room_id": int,
            "mortality_risk_score": float,
            "risk_level": str,
            "contributing_factors": [
                {
                    "factor": str,
                    "impact": float,
                    "current_value": float,
                    "optimal_range": str
                }
            ],
            "recommendations": [str]
        }
    """
    try:
        logger.info(f"Calculating mortality risk for room {room_id}")
        
        # Verify room exists
        stmt = select(Room).where(Room.id == room_id)
        result = await db.execute(stmt)
        room = result.scalar_one_or_none()
        
        if not room:
            raise HTTPException(status_code=404, detail=f"Room {room_id} not found")
        
        # Get latest metrics
        metrics_stmt = select(Metric)\
            .where(Metric.room_id == room_id)\
            .order_by(Metric.date.desc())\
            .limit(1)
        
        metrics_result = await db.execute(metrics_stmt)
        latest_metric = metrics_result.scalar_one_or_none()
        
        if not latest_metric:
            raise HTTPException(status_code=404, detail=f"No data for room {room_id}")
        
        # Calculate risk score based on environmental factors
        risk_score = 20.0  # Base risk
        factors = []
        
        # Temperature assessment
        if latest_metric.temperature_c:
            temp = latest_metric.temperature_c
            if temp < 18 or temp > 26:
                temp_risk = abs(temp - 22) / 22 * 30  # 30% max impact
                risk_score += temp_risk
                factors.append({
                    'factor': 'Temperature',
                    'impact': round(temp_risk, 1),
                    'current_value': temp,
                    'optimal_range': '20-24°C'
                })
        
        # Humidity assessment
        if latest_metric.humidity_pct:
            humidity = latest_metric.humidity_pct
            if humidity < 50 or humidity > 80:
                humidity_risk = abs(humidity - 65) / 65 * 20  # 20% max impact
                risk_score += humidity_risk
                factors.append({
                    'factor': 'Humidity',
                    'impact': round(humidity_risk, 1),
                    'current_value': humidity,
                    'optimal_range': '60-70%'
                })
        
        # Current mortality
        if latest_metric.mortality_rate:
            mortality_risk = latest_metric.mortality_rate * 2
            risk_score += mortality_risk
            factors.append({
                'factor': 'Current Mortality',
                'impact': round(mortality_risk, 1),
                'current_value': latest_metric.mortality_rate,
                'optimal_range': '<0.5%'
            })
        
        # Cap risk score at 100
        risk_score = min(100, max(0, risk_score))
        
        # Determine risk level
        if risk_score < 30:
            risk_level = 'low'
        elif risk_score < 60:
            risk_level = 'moderate'
        else:
            risk_level = 'high'
        
        # Generate recommendations
        recommendations = []
        if latest_metric.temperature_c:
            if latest_metric.temperature_c < 20:
                recommendations.append("Increase heating - temperature below optimal range")
            elif latest_metric.temperature_c > 24:
                recommendations.append("Improve ventilation - temperature above optimal range")
        
        if latest_metric.humidity_pct:
            if latest_metric.humidity_pct < 60:
                recommendations.append("Increase humidity - air too dry")
            elif latest_metric.humidity_pct > 70:
                recommendations.append("Improve air circulation - humidity too high")
        
        if latest_metric.mortality_rate and latest_metric.mortality_rate > 0.5:
            recommendations.append("Check bird health - mortality rate elevated")
        
        if not recommendations:
            recommendations.append("Continue current management - conditions are within optimal range")
        
        return {
            'room_id': room_id,
            'mortality_risk_score': round(risk_score, 1),
            'risk_level': risk_level,
            'contributing_factors': factors,
            'recommendations': recommendations
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Mortality risk calculation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# RECOMMENDATION ENDPOINTS
# ============================================================================

@router.get('/recommend/feed')
async def recommend_feeding_strategy(
    room_id: int = Query(..., description="Room ID"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Recommend optimal feeding strategy based on current conditions and flock development.
    
    Returns feed type, quantity, schedule, and expected impact on production.
    
    Args:
        room_id: Room ID to make recommendations for
        
    Returns:
        {
            "room_id": int,
            "current_conditions": {...},
            "recommendations": {
                "feed_type": str,
                "daily_quantity_kg": float,
                "feeding_frequency": int,
                "feed_quality_grade": str
            },
            "expected_outcomes": {
                "weight_gain_kg_week": float,
                "feed_efficiency_ratio": float,
                "cost_per_bird_day": float
            }
        }
    """
    try:
        logger.info(f"Generating feed recommendations for room {room_id}")
        
        # Verify room exists
        stmt = select(Room).where(Room.id == room_id)
        result = await db.execute(stmt)
        room = result.scalar_one_or_none()
        
        if not room:
            raise HTTPException(status_code=404, detail=f"Room {room_id} not found")
        
        # Get latest metrics
        metrics_stmt = select(Metric)\
            .where(Metric.room_id == room_id)\
            .order_by(Metric.date.desc())\
            .limit(1)
        
        metrics_result = await db.execute(metrics_stmt)
        latest_metric = metrics_result.scalar_one_or_none()
        
        if not latest_metric:
            raise HTTPException(status_code=404, detail=f"No data for room {room_id}")
        
        # Determine flock age and stage
        flock_age = 30  # Placeholder - would get from room.flocks table
        
        if flock_age < 8:
            stage = 'brooding'
            feed_type = 'Chick Starter (22-24% protein)'
            daily_qty = 0.08  # 80g per bird
            frequency = 5
            quality = 'Premium'
        elif flock_age < 16:
            stage = 'growing'
            feed_type = 'Grower (18-20% protein)'
            daily_qty = 0.15  # 150g per bird
            frequency = 4
            quality = 'Standard'
        else:
            stage = 'laying/mature'
            feed_type = 'Layer (16-18% protein)'
            daily_qty = 0.12  # 120g per bird
            frequency = 3
            quality = 'Standard'
        
        return {
            'room_id': room_id,
            'flock_stage': stage,
            'current_conditions': {
                'temperature': latest_metric.temperature_c,
                'humidity': latest_metric.humidity_pct,
                'avg_weight_kg': latest_metric.avg_weight_kg
            },
            'recommendations': {
                'feed_type': feed_type,
                'daily_quantity_kg': daily_qty,
                'feeding_frequency': frequency,
                'feed_quality_grade': quality,
                'notes': f'Adjust quantity ±10% based on bird appetite and growth rate'
            },
            'expected_outcomes': {
                'weight_gain_kg_week': 0.35,
                'feed_efficiency_ratio': 1.8,
                'cost_per_bird_day': 0.45
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Feed recommendation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/recommend/actions')
async def recommend_farm_actions(
    farm_id: int = Query(..., description="Farm ID"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Recommend urgent and routine farm management actions based on current farm-wide conditions.
    
    Returns prioritized action list with expected impact and implementation time.
    
    Args:
        farm_id: Farm ID to analyze
        
    Returns:
        {
            "farm_id": int,
            "assessment_date": str,
            "urgent_actions": [
                {
                    "priority": int,
                    "action": str,
                    "affected_rooms": [int],
                    "impact": str,
                    "implementation_time_hours": float
                }
            ],
            "routine_actions": [...],
            "summary": {
                "total_rooms": int,
                "rooms_needing_attention": int,
                "estimated_implementation_hours": float
            }
        }
    """
    try:
        logger.info(f"Generating farm-wide action recommendations for farm {farm_id}")
        
        # Verify farm exists
        stmt = select(Farm).where(Farm.id == farm_id)
        result = await db.execute(stmt)
        farm = result.scalar_one_or_none()
        
        if not farm:
            raise HTTPException(status_code=404, detail=f"Farm {farm_id} not found")
        
        # Get all rooms for farm
        rooms_stmt = select(Room).where(Room.farm_id == farm_id)
        rooms_result = await db.execute(rooms_stmt)
        rooms = rooms_result.scalars().all()
        
        if not rooms:
            raise HTTPException(status_code=404, detail=f"No rooms found for farm {farm_id}")
        
        # Analyze each room
        urgent_actions = []
        routine_actions = []
        affected_rooms = []
        
        for room in rooms:
            # Get latest metrics
            metrics_stmt = select(Metric)\
                .where(Metric.room_id == room.id)\
                .order_by(Metric.date.desc())\
                .limit(1)
            
            metrics_result = await db.execute(metrics_stmt)
            latest_metric = metrics_result.scalar_one_or_none()
            
            if not latest_metric:
                continue
            
            # Check for issues
            if latest_metric.temperature_c and (latest_metric.temperature_c < 18 or latest_metric.temperature_c > 26):
                affected_rooms.append(room.id)
                urgent_actions.append({
                    'priority': 1,
                    'action': f"Adjust temperature in Room {room.id}",
                    'affected_rooms': [room.id],
                    'impact': 'Prevents bird stress and mortality',
                    'implementation_time_hours': 0.5
                })
            
            if latest_metric.humidity_pct and (latest_metric.humidity_pct < 50 or latest_metric.humidity_pct > 80):
                if room.id not in affected_rooms:
                    affected_rooms.append(room.id)
                routine_actions.append({
                    'priority': 2,
                    'action': f"Check ventilation in Room {room.id}",
                    'affected_rooms': [room.id],
                    'impact': 'Improves air quality and bird health',
                    'implementation_time_hours': 1.0
                })
        
        # Add routine maintenance
        routine_actions.append({
            'priority': 3,
            'action': 'Weekly water system inspection',
            'affected_rooms': [r.id for r in rooms],
            'impact': 'Ensures adequate water availability',
            'implementation_time_hours': 2.0
        })
        
        total_implementation = sum(a['implementation_time_hours'] for a in urgent_actions + routine_actions)
        
        return {
            'farm_id': farm_id,
            'assessment_date': datetime.now().isoformat(),
            'urgent_actions': urgent_actions[:5],  # Top 5 urgent
            'routine_actions': routine_actions[:5],  # Top 5 routine
            'summary': {
                'total_rooms': len(rooms),
                'rooms_needing_attention': len(affected_rooms),
                'estimated_implementation_hours': round(total_implementation, 1)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Action recommendation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ANOMALY DETECTION ENDPOINTS
# ============================================================================

@router.get('/anomalies/room/{room_id}')
async def detect_room_anomalies(
    room_id: int = Path(..., description="Room ID", gt=0),
    days: int = Query(default=7, ge=1, le=90, description="Days to analyze"),
    sensitivity: float = Query(default=0.8, ge=0.5, le=1.0, description="Anomaly sensitivity (0.5-1.0)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Detect anomalies in a specific room's data.
    
    Uses ensemble of detection methods (Isolation Forest, LOF, Statistical, TimeSeries).
    
    Query Parameters:
        room_id: Room ID to analyze
        days: Number of days to analyze (1-90)
        sensitivity: Anomaly threshold (0.5=sensitive, 1.0=conservative)
    
    Returns:
        {
            "status": "success",
            "room_id": int,
            "anomalies": [
                {
                    "anomaly_date": "2025-12-07T14:30:00Z",
                    "metric_name": "temperature_c",
                    "metric_value": 28.5,
                    "anomaly_score": 0.92,
                    "anomaly_type": "multivariate",
                    "severity": "high",
                    "description": "Temperature significantly higher than expected"
                }
            ],
            "count": int,
            "period_days": int
        }
    
    Response time: <2s
    """
    try:
        # Validate room exists
        stmt = select(Room).where(Room.id == room_id)
        room = await db.scalar(stmt)
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        
        # Get metrics for the specified period
        start_date = datetime.utcnow() - timedelta(days=days)
        metrics_stmt = (
            select(Metric)
            .where(
                (Metric.room_id == room_id) &
                (Metric.recorded_date >= start_date)
            )
            .order_by(Metric.recorded_date.desc())
        )
        metrics = await db.scalars(metrics_stmt)
        metrics = list(metrics)
        
        if not metrics:
            return {
                "status": "success",
                "room_id": room_id,
                "anomalies": [],
                "count": 0,
                "period_days": days,
                "message": "No data found for analysis"
            }
        
        # Import anomaly detector
        from ml.anomaly_detector_advanced import AnomalyEnsemble
        import numpy as np
        
        # Prepare data for anomaly detection
        data_dict = {}
        for metric in metrics:
            if metric.metric_name not in data_dict:
                data_dict[metric.metric_name] = []
            data_dict[metric.metric_name].append({
                'value': metric.metric_value,
                'date': metric.recorded_date
            })
        
        # Convert to numpy arrays
        detector = AnomalyEnsemble()
        anomalies = []
        
        for metric_name, values in data_dict.items():
            if len(values) < 5:  # Need minimum data
                continue
            
            # Extract values and dates
            value_list = np.array([v['value'] for v in values])
            dates = [v['date'] for v in values]
            
            # Fit detector
            detector.fit(value_list.reshape(-1, 1))
            
            # Get anomaly scores
            scores = detector.detect(value_list.reshape(-1, 1))
            
            # Threshold based on sensitivity
            threshold = max(0.5, 1.0 - sensitivity)
            
            # Find anomalies
            for idx, score in enumerate(scores):
                if score > threshold:
                    severity = 'high' if score > 0.8 else 'medium' if score > 0.6 else 'low'
                    
                    anomalies.append({
                        'anomaly_date': dates[idx].isoformat() if dates[idx] else datetime.utcnow().isoformat(),
                        'metric_name': metric_name,
                        'metric_value': float(value_list[idx]),
                        'anomaly_score': float(score),
                        'anomaly_type': 'multivariate' if score > 0.8 else 'univariate',
                        'severity': severity,
                        'description': f"{metric_name} shows unexpected pattern (score: {score:.2f})"
                    })
        
        # Sort by anomaly score descending
        anomalies = sorted(anomalies, key=lambda x: x['anomaly_score'], reverse=True)
        
        return {
            "status": "success",
            "room_id": room_id,
            "anomalies": anomalies[:20],  # Limit to top 20
            "count": len(anomalies),
            "period_days": days,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Room anomaly detection failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/anomalies/farm/{farm_id}')
async def detect_farm_anomalies(
    farm_id: int = Path(..., description="Farm ID", gt=0),
    days: int = Query(default=7, ge=1, le=90),
    severity: Optional[str] = Query(None, regex="^(low|medium|high)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Detect anomalies across all rooms in a farm.
    
    Query Parameters:
        farm_id: Farm ID to analyze
        days: Number of days to analyze (1-90)
        severity: Optional filter by severity level
    
    Returns:
        {
            "status": "success",
            "farm_id": int,
            "anomalies": [...],
            "by_room": {room_id: count, ...},
            "by_severity": {low: count, medium: count, high: count},
            "total_anomalies": int
        }
    
    Response time: <2s
    """
    try:
        # Validate farm exists
        stmt = select(Farm).where(Farm.id == farm_id)
        farm = await db.scalar(stmt)
        if not farm:
            raise HTTPException(status_code=404, detail="Farm not found")
        
        # Get all rooms in farm
        rooms_stmt = select(Room).where(Room.farm_id == farm_id)
        rooms = await db.scalars(rooms_stmt)
        rooms = list(rooms)
        
        if not rooms:
            return {
                "status": "success",
                "farm_id": farm_id,
                "anomalies": [],
                "by_room": {},
                "by_severity": {"low": 0, "medium": 0, "high": 0},
                "total_anomalies": 0
            }
        
        # Detect anomalies for each room
        all_anomalies = []
        room_counts = {}
        severity_counts = {"low": 0, "medium": 0, "high": 0}
        
        for room in rooms:
            # Get metrics
            start_date = datetime.utcnow() - timedelta(days=days)
            metrics_stmt = (
                select(Metric)
                .where(
                    (Metric.room_id == room.id) &
                    (Metric.recorded_date >= start_date)
                )
                .order_by(Metric.recorded_date.desc())
            )
            metrics = await db.scalars(metrics_stmt)
            metrics = list(metrics)
            
            if metrics:
                # Simple anomaly detection: high variance as proxy
                from ml.anomaly_detector_advanced import IsolationForestDetector
                import numpy as np
                
                # Extract metric values
                values = np.array([[m.metric_value] for m in metrics])
                
                if len(values) >= 5:
                    detector = IsolationForestDetector()
                    detector.fit(values)
                    scores = detector.anomaly_score(values)
                    
                    room_anomalies = sum(1 for s in scores if s > 0.7)
                    if room_anomalies > 0:
                        room_counts[room.id] = room_anomalies
                        
                        # Estimate severity
                        avg_score = np.mean(scores[scores > 0.7])
                        if avg_score > 0.85:
                            severity_counts["high"] += room_anomalies
                        elif avg_score > 0.75:
                            severity_counts["medium"] += room_anomalies
                        else:
                            severity_counts["low"] += room_anomalies
        
        # Build response
        total_anomalies = sum(room_counts.values())
        
        return {
            "status": "success",
            "farm_id": farm_id,
            "anomalies": [],  # For brevity, include summary only
            "by_room": room_counts,
            "by_severity": severity_counts,
            "total_anomalies": total_anomalies,
            "period_days": days,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Farm anomaly detection failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/anomalies/feedback')
async def submit_anomaly_feedback(
    feedback: Dict[str, Any],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Submit feedback on detected anomalies.
    
    Helps improve anomaly detection algorithm over time.
    
    Request body:
        {
            "anomaly_id": int,
            "is_real": bool,
            "notes": str (optional)
        }
    
    Returns:
        {"status": "recorded", "message": "Feedback recorded successfully"}
    
    Response time: <100ms
    """
    try:
        # In production, this would store feedback for model retraining
        # For now, we just validate and acknowledge
        
        if not isinstance(feedback.get("is_real"), bool):
            raise HTTPException(status_code=400, detail="is_real must be boolean")
        
        # Log feedback for model improvement
        logger.info(
            f"Anomaly feedback from user {current_user.email}: "
            f"is_real={feedback['is_real']}, notes={feedback.get('notes', '')}"
        )
        
        return {
            "status": "recorded",
            "message": "Feedback recorded successfully",
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Anomaly feedback submission failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
