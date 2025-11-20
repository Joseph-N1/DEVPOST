"""
Health Check Endpoint

Provides system health status including:
- PostgreSQL database connectivity
- Redis cache connectivity
- Backend service status
- Available datasets
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from database import get_db, check_db_connection
from cache import cache
from models.farm import Farm, Room, Metric
import logging
from datetime import datetime
import platform
import os

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    Comprehensive health check endpoint.
    
    Returns:
        {
            "status": "healthy" | "degraded" | "unhealthy",
            "timestamp": "ISO timestamp",
            "services": {
                "database": {"status": "up" | "down", "response_time_ms": float},
                "cache": {"status": "up" | "down", "response_time_ms": float},
                "backend": {"status": "up", "version": "1.0.0"}
            },
            "data": {
                "farms_count": int,
                "rooms_count": int,
                "metrics_count": int,
                "latest_data_date": "ISO date"
            }
        }
    """
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {},
        "data": {},
        "system": {
            "platform": platform.system(),
            "python_version": platform.python_version()
        }
    }
    
    issues = []
    
    # Check PostgreSQL
    db_start = datetime.now()
    try:
        await db.execute(text("SELECT 1"))
        db_time = (datetime.now() - db_start).total_seconds() * 1000
        health_status["services"]["database"] = {
            "status": "up",
            "response_time_ms": round(db_time, 2)
        }
    except Exception as e:
        db_time = (datetime.now() - db_start).total_seconds() * 1000
        health_status["services"]["database"] = {
            "status": "down",
            "error": str(e),
            "response_time_ms": round(db_time, 2)
        }
        issues.append("database")
        logger.error(f"Database health check failed: {e}")
    
    # Check Redis
    redis_start = datetime.now()
    try:
        redis_healthy = await cache.check_health()
        redis_time = (datetime.now() - redis_start).total_seconds() * 1000
        
        if redis_healthy:
            health_status["services"]["cache"] = {
                "status": "up",
                "response_time_ms": round(redis_time, 2)
            }
        else:
            health_status["services"]["cache"] = {
                "status": "down",
                "error": "PING failed",
                "response_time_ms": round(redis_time, 2)
            }
            issues.append("cache")
    except Exception as e:
        redis_time = (datetime.now() - redis_start).total_seconds() * 1000
        health_status["services"]["cache"] = {
            "status": "down",
            "error": str(e),
            "response_time_ms": round(redis_time, 2)
        }
        issues.append("cache")
        logger.error(f"Redis health check failed: {e}")
    
    # Backend service (always up if responding)
    health_status["services"]["backend"] = {
        "status": "up",
        "version": os.getenv("APP_VERSION", "1.0.0"),
        "environment": os.getenv("ENVIRONMENT", "production")
    }
    
    # Get data statistics
    try:
        # Count farms
        result = await db.execute(select(func.count()).select_from(Farm))
        farms_count = result.scalar()
        
        # Count rooms
        result = await db.execute(select(func.count()).select_from(Room))
        rooms_count = result.scalar()
        
        # Count metrics
        result = await db.execute(select(func.count()).select_from(Metric))
        metrics_count = result.scalar()
        
        # Get latest data date
        result = await db.execute(select(func.max(Metric.date)))
        latest_date = result.scalar()
        
        health_status["data"] = {
            "farms_count": farms_count,
            "rooms_count": rooms_count,
            "metrics_count": metrics_count,
            "latest_data_date": latest_date.isoformat() if latest_date else None
        }
    except Exception as e:
        health_status["data"] = {
            "error": "Could not retrieve data statistics",
            "detail": str(e)
        }
        logger.error(f"Data statistics retrieval failed: {e}")
    
    # Determine overall status
    if len(issues) == 0:
        health_status["status"] = "healthy"
    elif "database" in issues:
        health_status["status"] = "unhealthy"  # Database is critical
    else:
        health_status["status"] = "degraded"  # Cache issues are non-critical
    
    # Return appropriate HTTP status
    if health_status["status"] == "unhealthy":
        raise HTTPException(status_code=503, detail=health_status)
    
    return health_status


@router.get("/ping")
async def ping():
    """
    Simple ping endpoint for basic health check.
    Used by load balancers and monitoring tools.
    """
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


@router.get("/ready")
async def ready(db: AsyncSession = Depends(get_db)):
    """
    Readiness probe for Kubernetes/Docker orchestration.
    Returns 200 if service is ready to accept traffic.
    """
    try:
        # Check database connection
        await db.execute(text("SELECT 1"))
        return {"ready": True, "timestamp": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        raise HTTPException(status_code=503, detail={"ready": False, "error": str(e)})


@router.get("/live")
async def live():
    """
    Liveness probe for Kubernetes/Docker orchestration.
    Returns 200 if service is alive (can be restarted if fails).
    """
    return {"alive": True, "timestamp": datetime.utcnow().isoformat()}
