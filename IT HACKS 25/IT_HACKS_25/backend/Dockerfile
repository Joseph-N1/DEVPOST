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
RUN pip install --no-cache-dir --default-timeout=180 -r requirements.txt || pip install --no-cache-dir --default-timeout=180 -r requirements.txt

# Install asyncpg for async PostgreSQL operations
RUN pip install --no-cache-dir asyncpg

# copy source
COPY . /app

# Make entrypoint script executable
RUN chmod +x /app/entrypoint.sh

EXPOSE 8000

# Use entrypoint script to run migrations and start server
CMD ["/app/entrypoint.sh"]
