"""
Model Monitoring & Performance Dashboard Endpoints

Provides real-time monitoring data for:
- Training history and model performance trends
- Active model information
- Prediction statistics and latency metrics
- System health and resource usage
- Model comparison and ranking
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta
import logging
from typing import Optional, List

from database import get_db
from models.auth import User
from services.monitoring import (
    TrainingMetricsCollector,
    PredictionStatsCollector,
    SystemHealthMonitor
)
from services.feature_importance import feature_importance_tracker
from auth.utils import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/monitor", tags=["monitoring"])


# ======================================================================
# TRAINING HISTORY
# ======================================================================

@router.get("/training-history")
async def get_training_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    sort_by: str = Query("date", regex="^(date|mae|rmse|r2|performance)$"),
    order: str = Query("asc|desc", regex="^(asc|desc)$")
):
    """
    Get training history for dashboard.
    """
    try:
        if current_user.role.value not in ["viewer", "manager", "admin"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")

        history = await TrainingMetricsCollector.get_training_history(
            db=db,
            limit=limit,
            offset=offset
        )

        # Handle sorting
        if sort_by != "date":
            key = "performance_score" if sort_by == "performance" else sort_by
            reverse = order == "desc"
            history = sorted(history, key=lambda x: x.get("metrics", {}).get(key, 0), reverse=reverse)

        return {
            "status": "success",
            "count": len(history),
            "limit": limit,
            "offset": offset,
            "data": history,
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Error getting training history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ======================================================================
# ACTIVE MODEL
# ======================================================================

@router.get("/active-model")
async def get_active_model(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get current active model with metrics & trend.
    """
    try:
        if current_user.role.value not in ["viewer", "manager", "admin"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")

        from models.farm import MLModel
        from sqlalchemy import select

        stmt = select(MLModel).where(MLModel.is_active == True).order_by(MLModel.created_at.desc())
        active_model = await db.scalar(stmt)

        if not active_model:
            return {
                "status": "no_active_model",
                "message": "No active model deployed",
                "timestamp": datetime.utcnow().isoformat()
            }

        trend_data = await TrainingMetricsCollector.get_model_trend(db=db, days=7)

        trend = "stable"
        if trend_data.get("data"):
            recent = trend_data["data"][-1].get("r2", 0)
            previous = trend_data["data"][0].get("r2", 0)
            if recent > previous + 0.01:
                trend = "improving"
            elif recent < previous - 0.01:
                trend = "declining"

        return {
            "status": "success",
            "model": {
                "id": active_model.id,
                "version": active_model.version,
                "model_type": active_model.model_type,
                "trained_at": active_model.created_at.isoformat() if active_model.created_at else None,
                "metrics": {
                    "mae": active_model.test_mae or 0,
                    "rmse": active_model.test_rmse or 0,
                    "r2": active_model.test_r2 or 0,
                    "performance_score": active_model.performance_score or 0
                },
                "n_samples": active_model.n_samples,
                "n_features": active_model.n_features,
                "status": active_model.status,
            },
            "trend": trend,
            "days_deployed": (datetime.utcnow() - active_model.created_at).days if active_model.created_at else 0,
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Error getting active model: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ======================================================================
# PREDICTION STATS
# ======================================================================

@router.get("/prediction-stats")
async def get_prediction_stats(
    current_user: User = Depends(get_current_user),
    hours: int = Query(24, ge=1, le=720),
    endpoint: Optional[str] = Query(None)
):
    """
    Get prediction performance statistics.
    """
    try:
        if current_user.role.value not in ["viewer", "manager", "admin"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")

        stats = await PredictionStatsCollector.get_prediction_stats(hours=hours)

        if endpoint and endpoint in stats.get("by_endpoint", {}):
            endpoint_stats = stats["by_endpoint"][endpoint]
            endpoint_stats["endpoint"] = endpoint
            endpoint_stats["timestamp"] = datetime.utcnow().isoformat()
            return {"status": "success", "data": endpoint_stats}

        stats["timestamp"] = datetime.utcnow().isoformat()
        return {"status": "success", "data": stats}

    except Exception as e:
        logger.error(f"Error getting prediction stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ======================================================================
# SYSTEM HEALTH
# ======================================================================

@router.get("/system-health")
async def get_system_health(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get system health and resource metrics.
    """
    try:
        if current_user.role.value not in ["viewer", "manager", "admin"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")

        health = await SystemHealthMonitor.get_system_status(db=db)

        return {"status": "success", "data": health}

    except Exception as e:
        logger.error(f"Error getting system health: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ======================================================================
# MODEL COMPARISON
# ======================================================================

@router.get("/model-comparison")
async def get_model_comparison(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(5, ge=1, le=20),
    metric: str = Query("r2", regex="^(mae|rmse|r2)$")
):
    """
    Compare top models by metric.
    """
    try:
        if current_user.role.value not in ["viewer", "manager", "admin"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")

        comparison = await TrainingMetricsCollector.compare_models(db=db, limit=limit)

        models = comparison.get("models", [])
        if metric == "mae":
            models = sorted(models, key=lambda x: x["metrics"]["mae"])
        elif metric == "rmse":
            models = sorted(models, key=lambda x: x["metrics"]["rmse"])
        else:
            models = sorted(models, key=lambda x: x["metrics"]["r2"], reverse=True)

        for idx, m in enumerate(models):
            m["rank"] = idx + 1

        return {
            "status": "success",
            "metric": metric,
            "count": len(models),
            "limit": limit,
            "data": {
                "models": models,
                "best_mae": comparison.get("best_mae"),
                "best_rmse": comparison.get("best_rmse"),
                "best_r2": comparison.get("best_r2")
            },
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Error comparing models: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ======================================================================
# FEATURE IMPORTANCE (GLOBAL, TEMPORAL, COMPARISON, SEASONAL)
# ======================================================================

@router.get("/feature-importance")
async def get_feature_importance(
    current_user: User = Depends(get_current_user),
    room_id: Optional[int] = Query(None),
    n_features: int = Query(20, ge=1, le=100),
    days: int = Query(7, ge=1, le=365)
):
    """
    Get top N important features.
    """
    try:
        if current_user.role.value not in ["viewer", "manager", "admin"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")

        top_features = feature_importance_tracker.get_top_features(
            n=n_features,
            room_id=room_id,
            days=days
        )

        features = [
            {
                "feature_name": fname,
                "importance_score": float(score),
                "rank": rank,
                "stability": feature_importance_tracker.get_stability_score(fname, days, room_id),
                "trend": feature_importance_tracker.get_importance_trend(fname, days, room_id)
            }
            for fname, score, rank in top_features
        ]

        return {
            "status": "success",
            "room_id": room_id,
            "days": days,
            "count": len(features),
            "data": features,
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Error getting feature importance: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/feature-importance/history")
async def get_feature_importance_history(
    current_user: User = Depends(get_current_user),
    feature_name: str = Query(...),
    days: int = Query(90, ge=1, le=365),
    room_id: Optional[int] = Query(None),
    frequency: str = Query("daily", regex="^(daily|weekly)$")
):
    """
    Time-series feature importance.
    """
    try:
        if current_user.role.value not in ["viewer", "manager", "admin"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")

        history = feature_importance_tracker.get_importance_history(
            feature_name=feature_name,
            days=days,
            room_id=room_id,
            frequency=frequency
        )

        trend = feature_importance_tracker.get_importance_trend(feature_name, days, room_id)
        stability = feature_importance_tracker.get_stability_score(feature_name, days, room_id)

        return {
            "status": "success",
            "feature_name": feature_name,
            "days": days,
            "frequency": frequency,
            "room_id": room_id,
            "trend": trend,
            "stability": float(stability),
            "count": len(history),
            "data": history,
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Error getting feature importance history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/feature-importance/comparison")
async def compare_feature_importance(
    current_user: User = Depends(get_current_user),
    room_id_1: Optional[int] = Query(None),
    room_id_2: Optional[int] = Query(None),
    n_features: int = Query(20, ge=1, le=50)
):
    """
    Compare importance between two rooms (or room vs global).
    """
    try:
        if current_user.role.value not in ["viewer", "manager", "admin"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")

        comparison = feature_importance_tracker.compare_importance(
            room_id_1=room_id_1,
            room_id_2=room_id_2,
            n_features=n_features
        )

        return {
            "status": "success",
            "room_1": room_id_1 or "global",
            "room_2": room_id_2 or "global",
            "count": len(comparison),
            "data": comparison,
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Error comparing feature importance: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/feature-importance/seasonal")
async def get_seasonal_feature_importance(
    current_user: User = Depends(get_current_user),
    room_id: Optional[int] = Query(None),
    n_features: int = Query(10, ge=1, le=50)
):
    """
    Get seasonal feature importance segmented by season.
    """
    try:
        if current_user.role.value not in ["viewer", "manager", "admin"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")

        seasonal = feature_importance_tracker.get_seasonal_importance(
            room_id=room_id,
            n_features=n_features
        )

        formatted = {
            season: [
                {
                    "feature_name": fname,
                    "importance_score": float(score),
                    "rank": rank
                }
                for fname, score, rank in features
            ]
            for season, features in seasonal.items()
        }

        return {
            "status": "success",
            "room_id": room_id,
            "n_features_per_season": n_features,
            "data": formatted,
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Error getting seasonal feature importance: {e}")
        raise HTTPException(status_code=500, detail=str(e))
