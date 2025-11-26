FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1

WORKDIR /app

# install build deps, postgresql-client for entrypoint script, and clean up
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    build-essential \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# copy only requirements first to leverage build cache
COPY requirements.txt ./requirements.txt

# Install dependencies with increased timeout and retries for large packages (PyTorch, Prophet)
# Split into critical and optional packages to speed up builds
RUN pip install --no-cache-dir --default-timeout=300 --retries=5 \
    fastapi uvicorn pandas sqlalchemy python-multipart pydantic \
    scikit-learn joblib numpy scipy requests psycopg2-binary \
    alembic redis sqlmodel asyncpg passlib bcrypt python-jose \
    slowapi email-validator xgboost shap statsmodels lightgbm

# Install heavy packages separately (can be commented out for faster builds during development)
RUN pip install --no-cache-dir --default-timeout=300 torch || echo "Torch install failed, continuing..."
RUN pip install --no-cache-dir --default-timeout=300 prophet || echo "Prophet install failed, continuing..."

# copy source
COPY . /app

# Make entrypoint script executable
RUN chmod +x /app/entrypoint.sh

EXPOSE 8000

# Use entrypoint script to run migrations and start server
CMD ["/app/entrypoint.sh"]
