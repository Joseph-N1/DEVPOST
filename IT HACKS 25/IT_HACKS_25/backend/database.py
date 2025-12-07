"""
Database connection manager for PostgreSQL with SQLAlchemy.
"""

import os
from sqlalchemy import create_engine, event
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
from typing import AsyncGenerator, Generator
import logging

logger = logging.getLogger(__name__)

# Database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://farm:farm123@postgres:5432/eco_farm")

# Convert sync URL to async for async operations
ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

# Sync engine for Alembic migrations and blocking operations
sync_engine = create_engine(
    DATABASE_URL,
    echo=False,  # Set to True for SQL query logging
    pool_pre_ping=True,  # Verify connections before using
    pool_size=10,
    max_overflow=20
)

# Async engine for FastAPI endpoints
async_engine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=False,
    pool_pre_ping=False,  # Disabled - was causing sync issues in async pool
    pool_size=10,
    max_overflow=20
)

# Session makers
SyncSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=sync_engine
)

AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)


def get_sync_db() -> Generator[Session, None, None]:
    """
    Dependency for synchronous database sessions.
    Use for blocking operations or when async is not available.
    """
    db = SyncSessionLocal()
    try:
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Database error: {e}")
        raise
    finally:
        db.close()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for async database sessions.
    Use this in FastAPI route handlers with Depends(get_db).
    
    Example:
        @router.get("/rooms")
        async def get_rooms(db: AsyncSession = Depends(get_db)):
            result = await db.execute(select(Room))
            return result.scalars().all()
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception as e:
            await session.rollback()
            logger.error(f"Database error: {e}")
            raise
        finally:
            await session.close()


async def check_db_connection() -> bool:
    """
    Health check function to verify database connectivity.
    Returns True if connection is successful, False otherwise.
    """
    try:
        async with AsyncSessionLocal() as session:
            await session.execute("SELECT 1")
        logger.info("Database connection successful")
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False


def init_db():
    """
    Initialize database tables.
    This is called by Alembic migrations, not directly.
    """
    from models.farm import Base
    Base.metadata.create_all(bind=sync_engine)
    logger.info("Database tables initialized")
