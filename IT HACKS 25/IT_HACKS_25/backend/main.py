from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

app = FastAPI()
logger = logging.getLogger("uvicorn.error")

# Add CORS so frontend (http://localhost:3000) can call the API during dev
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://backend:8000",  # when frontend runs inside docker, backend hostname
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        # use ["*"] temporarily for testing if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers (ensure import path matches your project structure)
try:
    # routers.upload should exist at backend/routers/upload.py
    from routers.upload import router as upload_router
    app.include_router(upload_router)
    logger.info("Upload router included")
except Exception as e:
    # Log the import error so it is visible in container logs
    logger.exception("Failed to include upload router: %s", e)
    raise
