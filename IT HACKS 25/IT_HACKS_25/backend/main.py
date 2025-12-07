from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import os
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse

logger = logging.getLogger("uvicorn.error")

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 Starting ECO FARM Backend...")
    
    # Initialize cache
    try:
        from cache import init_cache
        await init_cache()
        logger.info("✅ Redis cache initialized")
    except Exception as e:
        logger.error(f"⚠️ Cache initialization failed: {e}")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down ECO FARM Backend...")
    try:
        from cache import close_cache
        await close_cache()
        logger.info("✅ Redis cache closed")
    except Exception as e:
        logger.error(f"⚠️ Cache shutdown error: {e}")

app = FastAPI(lifespan=lifespan, title="ECO FARM API", version="2.0.0")
app.state.limiter = limiter

# Configure CORS with restricted origins (SECURITY FIX)
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000"
).split(",")

logger.info(f"CORS Origins configured: {CORS_ORIGINS}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

# Rate limiting error handler
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request, exc):
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded", "error": "too_many_requests"}
    )

@app.get("/")
@limiter.limit("200/minute")
async def root(request):
    return {"message": "ECO FARM Backend v2.0 - Database Powered", "status": "operational", "security": "hardened"}

# Include routers with logging and error visibility
try:
    from routers import upload, analysis, ai_intelligence, export, health, ml_predictions, auth, audit
    app.include_router(health.router)
    logger.info("Health router included at /health")
    app.include_router(auth.router)
    logger.info("Auth router included at /auth")
    app.include_router(audit.router)
    logger.info("Audit router included at /audit")
    app.include_router(upload.router, prefix="/upload")
    logger.info("Upload router included at /upload")
    app.include_router(analysis.router, prefix="/analysis")
    logger.info("Analysis router included at /analysis")
    app.include_router(ai_intelligence.router)
    logger.info("AI Intelligence router included at /ai")
    app.include_router(export.router)
    logger.info("Export router included at /export")
    app.include_router(ml_predictions.router)
    logger.info("ML Predictions router included at /ml")
except Exception as e:
    logger.exception("Failed to include routers: %s", e)
    raise
