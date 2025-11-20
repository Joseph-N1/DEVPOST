"""
Redis Cache Manager

Provides caching functionality for frequently accessed data:
- Room summaries
- Analytics calculations
- Aggregated metrics
"""

import os
import redis.asyncio as redis
import json
import logging
from typing import Optional, Any, Dict
from datetime import timedelta

logger = logging.getLogger(__name__)

# Redis connection from environment
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")

# Cache TTL settings (in seconds)
CACHE_TTL = {
    "room_summary": 300,        # 5 minutes
    "analytics": 600,            # 10 minutes
    "kpis": 300,                 # 5 minutes
    "weekly_report": 1800,       # 30 minutes
    "forecast": 3600             # 1 hour
}


class CacheManager:
    """
    Async Redis cache manager for farm data.
    """
    
    def __init__(self):
        self.client: Optional[redis.Redis] = None
    
    async def connect(self):
        """Initialize Redis connection."""
        try:
            self.client = await redis.from_url(
                REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=5
            )
            await self.client.ping()
            logger.info(f"Redis connected: {REDIS_URL}")
        except Exception as e:
            logger.error(f"Redis connection failed: {e}")
            self.client = None
    
    async def disconnect(self):
        """Close Redis connection."""
        if self.client:
            await self.client.close()
            logger.info("Redis disconnected")
    
    async def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache.
        
        Args:
            key: Cache key
            
        Returns:
            Cached value (deserialized from JSON) or None if not found
        """
        if not self.client:
            return None
        
        try:
            value = await self.client.get(key)
            if value:
                logger.debug(f"Cache HIT: {key}")
                return json.loads(value)
            else:
                logger.debug(f"Cache MISS: {key}")
                return None
        except Exception as e:
            logger.error(f"Cache GET error for key '{key}': {e}")
            return None
    
    async def set(self, key: str, value: Any, ttl: int = 300) -> bool:
        """
        Set value in cache with TTL.
        
        Args:
            key: Cache key
            value: Value to cache (will be JSON serialized)
            ttl: Time-to-live in seconds
            
        Returns:
            True if successful, False otherwise
        """
        if not self.client:
            return False
        
        try:
            serialized = json.dumps(value, default=str)  # default=str handles dates
            await self.client.setex(key, ttl, serialized)
            logger.debug(f"Cache SET: {key} (TTL: {ttl}s)")
            return True
        except Exception as e:
            logger.error(f"Cache SET error for key '{key}': {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """
        Delete key from cache.
        
        Args:
            key: Cache key to delete
            
        Returns:
            True if successful, False otherwise
        """
        if not self.client:
            return False
        
        try:
            await self.client.delete(key)
            logger.debug(f"Cache DELETE: {key}")
            return True
        except Exception as e:
            logger.error(f"Cache DELETE error for key '{key}': {e}")
            return False
    
    async def delete_pattern(self, pattern: str) -> int:
        """
        Delete all keys matching pattern.
        
        Args:
            pattern: Redis key pattern (e.g., "farm:123:*")
            
        Returns:
            Number of keys deleted
        """
        if not self.client:
            return 0
        
        try:
            keys = []
            async for key in self.client.scan_iter(match=pattern):
                keys.append(key)
            
            if keys:
                deleted = await self.client.delete(*keys)
                logger.info(f"Cache DELETE pattern '{pattern}': {deleted} keys")
                return deleted
            return 0
        except Exception as e:
            logger.error(f"Cache DELETE pattern error for '{pattern}': {e}")
            return 0
    
    async def check_health(self) -> bool:
        """
        Check if Redis is healthy.
        
        Returns:
            True if Redis responds to PING, False otherwise
        """
        if not self.client:
            return False
        
        try:
            await self.client.ping()
            return True
        except Exception as e:
            logger.error(f"Redis health check failed: {e}")
            return False


# Global cache instance
cache = CacheManager()


async def cache_room_summary(farm_id: int, room_id: int, data: Dict) -> bool:
    """
    Cache room summary data.
    
    Args:
        farm_id: Farm ID
        room_id: Room database ID
        data: Summary data to cache
        
    Returns:
        True if cached successfully
    """
    key = f"farm:{farm_id}:room:{room_id}:summary"
    return await cache.set(key, data, CACHE_TTL["room_summary"])


async def get_cached_room_summary(farm_id: int, room_id: int) -> Optional[Dict]:
    """
    Get cached room summary.
    
    Args:
        farm_id: Farm ID
        room_id: Room database ID
        
    Returns:
        Cached summary or None
    """
    key = f"farm:{farm_id}:room:{room_id}:summary"
    return await cache.get(key)


async def cache_analytics(farm_id: int, analytics_type: str, data: Dict) -> bool:
    """
    Cache analytics calculation results.
    
    Args:
        farm_id: Farm ID
        analytics_type: Type of analytics (e.g., "kpis", "forecast", "weekly")
        data: Analytics data to cache
        
    Returns:
        True if cached successfully
    """
    key = f"farm:{farm_id}:analytics:{analytics_type}"
    ttl = CACHE_TTL.get(analytics_type, CACHE_TTL["analytics"])
    return await cache.set(key, data, ttl)


async def get_cached_analytics(farm_id: int, analytics_type: str) -> Optional[Dict]:
    """
    Get cached analytics.
    
    Args:
        farm_id: Farm ID
        analytics_type: Type of analytics
        
    Returns:
        Cached analytics or None
    """
    key = f"farm:{farm_id}:analytics:{analytics_type}"
    return await cache.get(key)


async def invalidate_farm_cache(farm_id: int) -> int:
    """
    Invalidate all cache entries for a farm.
    Called after new data upload.
    
    Args:
        farm_id: Farm ID
        
    Returns:
        Number of cache entries deleted
    """
    pattern = f"farm:{farm_id}:*"
    deleted = await cache.delete_pattern(pattern)
    logger.info(f"Invalidated cache for farm {farm_id}: {deleted} entries")
    return deleted


async def init_cache():
    """Initialize cache connection. Called on app startup."""
    await cache.connect()


async def close_cache():
    """Close cache connection. Called on app shutdown."""
    await cache.disconnect()
