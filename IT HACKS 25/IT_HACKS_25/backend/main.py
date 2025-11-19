from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

app = FastAPI()
logger = logging.getLogger("uvicorn.error")

# Enable CORS (allow all origins for local development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Backend is running"}

# Include routers with logging and error visibility
try:
    from routers import upload, analysis, ai_intelligence
    app.include_router(upload.router, prefix="/upload")
    logger.info("Upload router included at /upload")
    app.include_router(analysis.router, prefix="/analysis")
    logger.info("Analysis router included at /analysis")
    app.include_router(ai_intelligence.router)
    logger.info("AI Intelligence router included at /ai")
except Exception as e:
    logger.exception("Failed to include routers: %s", e)
    raise
