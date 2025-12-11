"""
Real-time Model Monitoring Service

Collects and aggregates training metrics, prediction statistics, and system health data.
Provides interfaces for dashboard monitoring and model performance tracking.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_
import logging
try:
    import psutil
except ImportError:
    psutil = None
import numpy as np
from models.farm import MLModel, Metric, Room, Farm
from cache import cache

logger = logging.getLogger(__name__)


class TrainingMetricsCollector:
    """Collect and aggregate training metrics over time"""
    
    @staticmethod
    async def record_training(
        db: AsyncSession,
        model_id: int,
        metrics_dict: Dict,
    ) -> Dict:
        """
        Record training metrics for a model.
        
        Args:
            db: Database session
            model_id: ID of the trained model
            metrics_dict: Dictionary containing metrics (mae, rmse, r2, train_time, etc.)
        
        Returns:
            Confirmation dict
        """
        try:
            stmt = select(MLModel).where(MLModel.id == model_id)
            model = await db.scalar(stmt)
            
            if not model:
                return {"status": "error", "message": "Model not found"}
            
            # Update model with metrics
            model.test_mae = metrics_dict.get('test_mae')
            model.test_rmse = metrics_dict.get('test_rmse')
            model.test_r2 = metrics_dict.get('test_r2')
            model.performance_score = metrics_dict.get('performance_score')
            model.status = "trained"
            
            await db.commit()
            await db.refresh(model)
            
            return {
                "status": "success",
                "model_id": model_id,
                "recorded_at": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Error recording training metrics: {e}")
            return {"status": "error", "message": str(e)}
    
    @staticmethod
    async def get_training_history(
        db: AsyncSession,
        limit: int = 20,
        offset: int = 0,
    ) -> List[Dict]:
        """
        Get training history for dashboard.
        
        Args:
            db: Database session
            limit: Number of records to return
            offset: Pagination offset
        
        Returns:
            List of training records
        """
        try:
            stmt = (
                select(MLModel)
                .where(MLModel.status.in_(["trained", "deployed", "archived"]))
                .order_by(desc(MLModel.created_at))
                .limit(limit)
                .offset(offset)
            )
            models = await db.scalars(stmt)
            
            history = []
            for model in models:
                history.append({
                    "id": model.id,
                    "version": model.version,
                    "model_type": model.model_type,
                    "trained_at": model.created_at.isoformat() if model.created_at else None,
                    "metrics": {
                        "mae": model.test_mae or 0,
                        "rmse": model.test_rmse or 0,
                        "r2": model.test_r2 or 0,
                        "performance_score": model.performance_score or 0
                    },
                    "n_samples": model.n_samples,
                    "n_features": model.n_features,
                    "status": model.status,
                    "is_active": model.is_active
                })
            
            return history
        except Exception as e:
            logger.error(f"Error fetching training history: {e}")
            return []
    
    @staticmethod
    async def get_model_trend(
        db: AsyncSession,
        model_id: Optional[int] = None,
        days: int = 90,
    ) -> Dict:
        """
        Get performance trend for a model or all models.
        
        Args:
            db: Database session
            model_id: Specific model ID (optional)
            days: Number of days to look back
        
        Returns:
            Trend data with dates and metrics
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            query = select(MLModel).where(
                and_(
                    MLModel.created_at >= cutoff_date,
                    MLModel.status.in_(["trained", "deployed"])
                )
            )
            
            if model_id:
                query = query.where(MLModel.id == model_id)
            
            query = query.order_by(MLModel.created_at)
            models = await db.scalars(query)
            
            trend = {
                "data": [],
                "period_days": days,
                "start_date": cutoff_date.isoformat(),
                "end_date": datetime.utcnow().isoformat()
            }
            
            for model in models:
                trend["data"].append({
                    "date": model.created_at.isoformat() if model.created_at else None,
                    "mae": model.test_mae or 0,
                    "rmse": model.test_rmse or 0,
                    "r2": model.test_r2 or 0,
                    "version": model.version
                })
            
            return trend
        except Exception as e:
            logger.error(f"Error fetching model trend: {e}")
            return {"data": [], "error": str(e)}
    
    @staticmethod
    async def compare_models(
        db: AsyncSession,
        model_ids: Optional[List[int]] = None,
        limit: int = 5,
    ) -> Dict:
        """
        Compare multiple models side-by-side.
        
        Args:
            db: Database session
            model_ids: List of model IDs to compare (if None, get top performers)
            limit: Number of top models if model_ids not provided
        
        Returns:
            Comparison data
        """
        try:
            if model_ids:
                stmt = select(MLModel).where(MLModel.id.in_(model_ids))
            else:
                stmt = (
                    select(MLModel)
                    .where(MLModel.status.in_(["trained", "deployed"]))
                    .order_by(desc(MLModel.performance_score))
                    .limit(limit)
                )
            
            models = await db.scalars(stmt)
            
            comparison = {
                "models": [],
                "best_mae": None,
                "best_rmse": None,
                "best_r2": None,
            }
            
            for idx, model in enumerate(models):
                model_data = {
                    "rank": idx + 1,
                    "id": model.id,
                    "version": model.version,
                    "type": model.model_type,
                    "trained_at": model.created_at.isoformat() if model.created_at else None,
                    "metrics": {
                        "mae": model.test_mae or 0,
                        "rmse": model.test_rmse or 0,
                        "r2": model.test_r2 or 0,
                        "performance_score": model.performance_score or 0
                    },
                    "status": model.status,
                    "is_active": model.is_active
                }
                comparison["models"].append(model_data)
                
                if comparison["best_mae"] is None or (model.test_mae and model.test_mae < comparison["best_mae"]):
                    comparison["best_mae"] = model.test_mae
                if comparison["best_rmse"] is None or (model.test_rmse and model.test_rmse < comparison["best_rmse"]):
                    comparison["best_rmse"] = model.test_rmse
                if comparison["best_r2"] is None or (model.test_r2 and model.test_r2 > comparison["best_r2"]):
                    comparison["best_r2"] = model.test_r2
            
            return comparison
        except Exception as e:
            logger.error(f"Error comparing models: {e}")
            return {"models": [], "error": str(e)}
    
    @staticmethod
    async def calculate_average_metrics(
        db: AsyncSession,
        start_date: datetime,
        end_date: datetime,
    ) -> Dict:
        """
        Calculate average metrics across all models in a date range.
        
        Args:
            db: Database session
            start_date: Start date
            end_date: End date
        
        Returns:
            Average metrics
        """
        try:
            stmt = select(MLModel).where(
                and_(
                    MLModel.created_at >= start_date,
                    MLModel.created_at <= end_date,
                    MLModel.status.in_(["trained", "deployed"])
                )
            )
            models = await db.scalars(stmt)
            models = list(models)
            
            if not models:
                return {
                    "count": 0,
                    "avg_mae": 0,
                    "avg_rmse": 0,
                    "avg_r2": 0,
                    "avg_performance_score": 0
                }
            
            valid_maes = [m.test_mae for m in models if m.test_mae is not None]
            valid_rmses = [m.test_rmse for m in models if m.test_rmse is not None]
            valid_r2s = [m.test_r2 for m in models if m.test_r2 is not None]
            valid_scores = [m.performance_score for m in models if m.performance_score is not None]
            
            return {
                "count": len(models),
                "date_range": f"{start_date.date()} to {end_date.date()}",
                "avg_mae": round(np.mean(valid_maes), 4) if valid_maes else 0,
                "avg_rmse": round(np.mean(valid_rmses), 4) if valid_rmses else 0,
                "avg_r2": round(np.mean(valid_r2s), 4) if valid_r2s else 0,
                "avg_performance_score": round(np.mean(valid_scores), 2) if valid_scores else 0
            }
        except Exception as e:
            logger.error(f"Error calculating average metrics: {e}")
            return {"error": str(e)}


class PredictionStatsCollector:
    """Collect prediction statistics and latency data"""
    
    @staticmethod
    async def record_prediction(
        endpoint: str,
        latency_ms: float,
        success: bool = True,
    ) -> None:
        """
        Record a prediction event with latency.
        
        Args:
            endpoint: API endpoint called
            latency_ms: Response time in milliseconds
            success: Whether prediction was successful
        """
        try:
            stats_key = f"prediction_stats:{endpoint}"
            
            stats = await cache.get(stats_key)
            if stats is None:
                stats = {
                    "count": 0,
                    "success_count": 0,
                    "latencies": [],
                    "created_at": datetime.utcnow().isoformat()
                }
            else:
                stats = dict(stats)  # Convert to mutable dict
                stats["latencies"] = list(stats.get("latencies", []))
            
            stats["count"] += 1
            if success:
                stats["success_count"] += 1
            
            stats["latencies"].append(latency_ms)
            # Keep only last 1000 measurements
            if len(stats["latencies"]) > 1000:
                stats["latencies"] = stats["latencies"][-1000:]
            
            # Cache for 24 hours
            await cache.set(stats_key, stats, ex=86400)
        except Exception as e:
            logger.error(f"Error recording prediction: {e}")
    
    @staticmethod
    async def get_prediction_stats(
        hours: int = 24,
    ) -> Dict:
        """
        Get prediction statistics.
        
        Args:
            hours: Number of hours to look back
        
        Returns:
            Prediction statistics
        """
        try:
            # Get all prediction stats
            all_endpoints = ["eggs", "weight", "mortality", "feed", "actions"]
            total_stats = {
                "total_predictions": 0,
                "success_count": 0,
                "error_count": 0,
                "success_rate": 0.0,
                "avg_latency_ms": 0.0,
                "p95_latency_ms": 0.0,
                "p99_latency_ms": 0.0,
                "by_endpoint": {}
            }
            
            all_latencies = []
            
            for endpoint in all_endpoints:
                stats_key = f"prediction_stats:{endpoint}"
                stats = await cache.get(stats_key)
                
                if stats:
                    count = stats.get("count", 0)
                    success_count = stats.get("success_count", 0)
                    latencies = stats.get("latencies", [])
                    
                    total_stats["total_predictions"] += count
                    total_stats["success_count"] += success_count
                    total_stats["error_count"] += count - success_count
                    all_latencies.extend(latencies)
                    
                    total_stats["by_endpoint"][endpoint] = {
                        "count": count,
                        "success_rate": round((success_count / count * 100) if count > 0 else 0, 2),
                        "avg_latency": round(np.mean(latencies), 2) if latencies else 0,
                        "p95_latency": round(np.percentile(latencies, 95), 2) if latencies else 0
                    }
            
            if total_stats["total_predictions"] > 0:
                total_stats["success_rate"] = round(
                    total_stats["success_count"] / total_stats["total_predictions"] * 100,
                    2
                )
            
            if all_latencies:
                total_stats["avg_latency_ms"] = round(np.mean(all_latencies), 2)
                total_stats["p95_latency_ms"] = round(np.percentile(all_latencies, 95), 2)
                total_stats["p99_latency_ms"] = round(np.percentile(all_latencies, 99), 2)
            
            return total_stats
        except Exception as e:
            logger.error(f"Error fetching prediction stats: {e}")
            return {"error": str(e)}
    
    @staticmethod
    async def get_latency_histogram(
        endpoint: str,
        hours: int = 24,
    ) -> Dict:
        """
        Get latency distribution histogram.
        
        Args:
            endpoint: Endpoint to analyze
            hours: Hours to look back
        
        Returns:
            Histogram data
        """
        try:
            stats_key = f"prediction_stats:{endpoint}"
            stats = await cache.get(stats_key)
            
            if not stats or not stats.get("latencies"):
                return {"endpoint": endpoint, "data": [], "bins": []}
            
            latencies = stats.get("latencies", [])
            
            # Create histogram with 10 bins
            hist, bins = np.histogram(latencies, bins=10)
            
            return {
                "endpoint": endpoint,
                "bins": [round(float(b), 2) for b in bins],
                "frequencies": [int(h) for h in hist],
                "total_samples": len(latencies),
                "min": round(float(np.min(latencies)), 2),
                "max": round(float(np.max(latencies)), 2),
                "mean": round(float(np.mean(latencies)), 2)
            }
        except Exception as e:
            logger.error(f"Error getting latency histogram: {e}")
            return {"error": str(e)}
    
    @staticmethod
    async def calculate_p95_latency(endpoint: str) -> float:
        """
        Get 95th percentile latency for endpoint.
        
        Args:
            endpoint: Endpoint to analyze
        
        Returns:
            P95 latency in milliseconds
        """
        try:
            stats_key = f"prediction_stats:{endpoint}"
            stats = await cache.get(stats_key)
            
            if not stats or not stats.get("latencies"):
                return 0.0
            
            latencies = stats.get("latencies", [])
            return round(float(np.percentile(latencies, 95)), 2)
        except Exception as e:
            logger.error(f"Error calculating P95 latency: {e}")
            return 0.0
    
    @staticmethod
    async def get_predictions_per_hour(
        hours: int = 24,
    ) -> Dict:
        """
        Get predictions grouped by hour.
        
        Args:
            hours: Number of hours to look back
        
        Returns:
            Hourly prediction counts
        """
        try:
            # This would require timestamp data in cache
            # For now, return aggregate data
            all_endpoints = ["eggs", "weight", "mortality", "feed", "actions"]
            hourly_data = {}
            
            for endpoint in all_endpoints:
                stats_key = f"prediction_stats:{endpoint}"
                stats = await cache.get(stats_key)
                
                if stats:
                    count = stats.get("count", 0)
                    hourly_data[endpoint] = count
            
            return {
                "period_hours": hours,
                "by_endpoint": hourly_data,
                "total": sum(hourly_data.values())
            }
        except Exception as e:
            logger.error(f"Error getting predictions per hour: {e}")
            return {"error": str(e)}


class SystemHealthMonitor:
    """Monitor system resource usage and health"""
    
    @staticmethod
    def get_memory_usage() -> Dict:
        """
        Get memory usage.
        
        Returns:
            Memory statistics
        """
        try:
            vm = psutil.virtual_memory()
            return {
                "used_gb": round(vm.used / (1024 ** 3), 2),
                "total_gb": round(vm.total / (1024 ** 3), 2),
                "available_gb": round(vm.available / (1024 ** 3), 2),
                "percent": round(vm.percent, 2)
            }
        except Exception as e:
            logger.error(f"Error getting memory usage: {e}")
            return {"error": str(e)}
    
    @staticmethod
    def get_cpu_usage() -> Dict:
        """
        Get CPU usage.
        
        Returns:
            CPU statistics
        """
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count(logical=True)
            load_avg = os.getloadavg() if hasattr(os, 'getloadavg') else (0, 0, 0)
            
            return {
                "percent": round(cpu_percent, 2),
                "count_logical": cpu_count,
                "load_average_1": round(load_avg[0], 2),
                "load_average_5": round(load_avg[1], 2),
                "load_average_15": round(load_avg[2], 2)
            }
        except Exception as e:
            logger.error(f"Error getting CPU usage: {e}")
            return {"error": str(e)}
    
    @staticmethod
    def get_disk_usage() -> Dict:
        """
        Get disk usage.
        
        Returns:
            Disk statistics
        """
        try:
            du = psutil.disk_usage('/')
            return {
                "used_gb": round(du.used / (1024 ** 3), 2),
                "total_gb": round(du.total / (1024 ** 3), 2),
                "free_gb": round(du.free / (1024 ** 3), 2),
                "percent": round(du.percent, 2)
            }
        except Exception as e:
            logger.error(f"Error getting disk usage: {e}")
            return {"error": str(e)}
    
    @staticmethod
    async def get_model_cache_stats() -> Dict:
        """
        Get model cache statistics.
        
        Returns:
            Cache statistics
        """
        try:
            cache_info_key = "cache:info"
            info = await cache.get(cache_info_key)
            
            if info:
                return dict(info)
            
            return {
                "items": 0,
                "size_mb": 0,
                "hit_rate": 0.0
            }
        except Exception as e:
            logger.error(f"Error getting cache stats: {e}")
            return {"error": str(e)}
    
    @staticmethod
    async def get_database_stats(db: AsyncSession) -> Dict:
        """
        Get database statistics.
        
        Args:
            db: Database session
        
        Returns:
            Database statistics
        """
        try:
            # Count records
            farms_stmt = select(func.count(Farm.id))
            rooms_stmt = select(func.count(Room.id))
            metrics_stmt = select(func.count(Metric.id))
            
            farms_count = await db.scalar(farms_stmt)
            rooms_count = await db.scalar(rooms_stmt)
            metrics_count = await db.scalar(metrics_stmt)
            
            # Get latest metric date
            latest_metric = await db.scalar(
                select(Metric.recorded_date).order_by(desc(Metric.recorded_date)).limit(1)
            )
            
            return {
                "farms": farms_count or 0,
                "rooms": rooms_count or 0,
                "metrics": metrics_count or 0,
                "latest_data_date": latest_metric.isoformat() if latest_metric else None
            }
        except Exception as e:
            logger.error(f"Error getting database stats: {e}")
            return {"error": str(e)}
    
    @staticmethod
    async def get_system_status(db: AsyncSession) -> Dict:
        """
        Get complete system status.
        
        Args:
            db: Database session
        
        Returns:
            Full system status
        """
        try:
            memory = SystemHealthMonitor.get_memory_usage()
            cpu = SystemHealthMonitor.get_cpu_usage()
            disk = SystemHealthMonitor.get_disk_usage()
            db_stats = await SystemHealthMonitor.get_database_stats(db)
            cache_stats = await SystemHealthMonitor.get_model_cache_stats()
            
            # Determine overall status
            status = "healthy"
            if memory.get("percent", 0) > 85 or cpu.get("percent", 0) > 80:
                status = "degraded"
            if memory.get("percent", 0) > 95 or cpu.get("percent", 0) > 95:
                status = "critical"
            
            return {
                "status": status,
                "timestamp": datetime.utcnow().isoformat(),
                "uptime_seconds": int(psutil.Process().create_time()),
                "memory": memory,
                "cpu": cpu,
                "disk": disk,
                "database": db_stats,
                "cache": cache_stats
            }
        except Exception as e:
            logger.error(f"Error getting system status: {e}")
            return {"status": "error", "error": str(e)}


import os
