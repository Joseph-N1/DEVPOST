"""
Phase 11: Performance Optimization Module
Includes lazy loading, caching, timeouts, and optimization utilities
"""

import functools
import logging
import time
from typing import Callable, Optional, Dict, Any
from pathlib import Path
import joblib
import asyncio

logger = logging.getLogger(__name__)


class ModelCache:
    """
    Lazy-loading model cache with TTL support.
    Loads models on first access and keeps them in memory.
    """
    
    def __init__(self, ttl_seconds: int = 3600):
        """
        Initialize cache.
        
        Args:
            ttl_seconds: Time-to-live for cached models (default 1 hour)
        """
        self.cache = {}
        self.ttl = ttl_seconds
        self.access_times = {}
    
    def get_model(self, model_path: str) -> Any:
        """
        Get model from cache, loading if necessary.
        
        Args:
            model_path: Path to model file
            
        Returns:
            Loaded model object
        """
        current_time = time.time()
        
        # Check if model in cache and not expired
        if model_path in self.cache:
            access_time = self.access_times.get(model_path, 0)
            if current_time - access_time < self.ttl:
                logger.debug(f"Cache hit for {model_path}")
                self.access_times[model_path] = current_time
                return self.cache[model_path]
            else:
                logger.debug(f"Cache expired for {model_path}")
                del self.cache[model_path]
                del self.access_times[model_path]
        
        # Load model from disk
        logger.info(f"Loading model from disk: {model_path}")
        try:
            model = joblib.load(model_path)
            self.cache[model_path] = model
            self.access_times[model_path] = current_time
            logger.info(f"Model loaded and cached: {model_path}")
            return model
        except Exception as e:
            logger.error(f"Failed to load model {model_path}: {e}")
            raise
    
    def clear_expired(self) -> int:
        """
        Remove expired models from cache.
        
        Returns:
            Number of models removed
        """
        current_time = time.time()
        expired = []
        
        for model_path, access_time in self.access_times.items():
            if current_time - access_time >= self.ttl:
                expired.append(model_path)
        
        for model_path in expired:
            del self.cache[model_path]
            del self.access_times[model_path]
        
        if expired:
            logger.info(f"Cleared {len(expired)} expired models from cache")
        
        return len(expired)
    
    def get_cache_stats(self) -> Dict[str, int]:
        """
        Get cache statistics.
        
        Returns:
            Dictionary with cache stats
        """
        return {
            'models_cached': len(self.cache),
            'cache_size_bytes': sum(
                joblib.dump(m, None).__sizeof__() 
                for m in self.cache.values()
            )
        }


class PredictionCache:
    """
    LRU cache for predictions to avoid redundant calculations.
    """
    
    def __init__(self, max_size: int = 1000, ttl_seconds: int = 600):
        """
        Initialize prediction cache.
        
        Args:
            max_size: Maximum number of cached predictions
            ttl_seconds: Time-to-live for predictions (default 10 minutes)
        """
        self.cache = {}
        self.max_size = max_size
        self.ttl = ttl_seconds
        self.access_times = {}
        self.access_counts = {}
    
    def get_cache_key(self, endpoint: str, **kwargs) -> str:
        """
        Generate cache key from endpoint and parameters.
        
        Args:
            endpoint: API endpoint
            **kwargs: Query parameters
            
        Returns:
            Cache key string
        """
        params_str = '_'.join(f"{k}={v}" for k, v in sorted(kwargs.items()))
        return f"{endpoint}_{params_str}"
    
    def get(self, key: str) -> Optional[Dict]:
        """
        Get cached prediction.
        
        Args:
            key: Cache key
            
        Returns:
            Cached prediction or None
        """
        if key not in self.cache:
            return None
        
        current_time = time.time()
        access_time = self.access_times.get(key, 0)
        
        # Check if expired
        if current_time - access_time >= self.ttl:
            del self.cache[key]
            return None
        
        # Update access metadata
        self.access_times[key] = current_time
        self.access_counts[key] = self.access_counts.get(key, 0) + 1
        
        logger.debug(f"Cache hit: {key}")
        return self.cache[key]
    
    def set(self, key: str, value: Dict) -> None:
        """
        Store prediction in cache.
        
        Args:
            key: Cache key
            value: Prediction result
        """
        # Evict LRU item if cache full
        if len(self.cache) >= self.max_size:
            # Remove least accessed item
            lru_key = min(
                self.access_counts.keys(),
                key=lambda k: self.access_counts.get(k, 0)
            )
            del self.cache[lru_key]
            del self.access_times[lru_key]
            del self.access_counts[lru_key]
            logger.debug(f"Evicted LRU item: {lru_key}")
        
        current_time = time.time()
        self.cache[key] = value
        self.access_times[key] = current_time
        self.access_counts[key] = 1
        
        logger.debug(f"Cached: {key}")
    
    def clear_expired(self) -> int:
        """
        Remove expired predictions.
        
        Returns:
            Number of items removed
        """
        current_time = time.time()
        expired = []
        
        for key, access_time in self.access_times.items():
            if current_time - access_time >= self.ttl:
                expired.append(key)
        
        for key in expired:
            del self.cache[key]
            del self.access_times[key]
            del self.access_counts[key]
        
        if expired:
            logger.info(f"Cleared {len(expired)} expired predictions from cache")
        
        return len(expired)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        return {
            'cached_predictions': len(self.cache),
            'cache_size_percent': (len(self.cache) / self.max_size * 100),
            'total_accesses': sum(self.access_counts.values())
        }


def timeout(seconds: float = 30) -> Callable:
    """
    Decorator to add timeout to async functions.
    
    Args:
        seconds: Timeout in seconds
        
    Returns:
        Decorated function
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await asyncio.wait_for(func(*args, **kwargs), timeout=seconds)
            except asyncio.TimeoutError:
                logger.warning(f"Function {func.__name__} timed out after {seconds}s")
                raise TimeoutError(f"Operation timed out after {seconds} seconds")
        
        return wrapper
    
    return decorator


def with_prediction_cache(cache: PredictionCache, ttl: int = 600) -> Callable:
    """
    Decorator to add caching to prediction endpoints.
    
    Args:
        cache: PredictionCache instance
        ttl: Cache TTL in seconds
        
    Returns:
        Decorated function
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            endpoint = func.__name__
            cache_key = cache.get_cache_key(endpoint, **kwargs)
            
            # Check cache
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Cache result
            cache.set(cache_key, result)
            
            return result
        
        return wrapper
    
    return decorator


class QueryOptimizer:
    """
    Utilities for optimizing database queries.
    """
    
    @staticmethod
    def batch_fetch(items: list, batch_size: int = 100) -> list:
        """
        Batch process items for efficient database operations.
        
        Args:
            items: List of items to batch
            batch_size: Batch size
            
        Returns:
            List of batches
        """
        batches = []
        for i in range(0, len(items), batch_size):
            batches.append(items[i:i + batch_size])
        return batches
    
    @staticmethod
    def paginate(query_result, page: int = 1, page_size: int = 50):
        """
        Paginate query results.
        
        Args:
            query_result: Database query result
            page: Page number (1-indexed)
            page_size: Items per page
            
        Returns:
            Paginated results with metadata
        """
        total = len(query_result)
        start = (page - 1) * page_size
        end = start + page_size
        
        items = query_result[start:end]
        
        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }


# Global caches (initialize at module level)
_model_cache = None
_prediction_cache = None


def get_model_cache() -> ModelCache:
    """Get or create global model cache."""
    global _model_cache
    if _model_cache is None:
        _model_cache = ModelCache(ttl_seconds=3600)
    return _model_cache


def get_prediction_cache() -> PredictionCache:
    """Get or create global prediction cache."""
    global _prediction_cache
    if _prediction_cache is None:
        _prediction_cache = PredictionCache(max_size=1000, ttl_seconds=600)
    return _prediction_cache
