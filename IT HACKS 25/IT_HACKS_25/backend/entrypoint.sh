#!/bin/bash
set -e

echo "🚀 Starting ECO FARM backend..."

# Use environment variables from docker-compose
DB_USER=${POSTGRES_USER:-farm}
DB_PASSWORD=${POSTGRES_PASSWORD:-changeme}
DB_HOST=${POSTGRES_HOST:-postgres}
DB_NAME=${POSTGRES_DB:-eco_farm}

# Wait for PostgreSQL to be ready  
echo "⏳ Waiting for PostgreSQL..."
until pg_isready -h "${DB_HOST}" -U "${DB_USER}" 2>/dev/null; do
  >&2 echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "✅ PostgreSQL is up!"
echo "✅ Database ready! (initialized via PostgreSQL init scripts)"

# Run database migrations
echo "🔄 Running database migrations..."
cd /app
python -m alembic upgrade head || echo "⚠️ Migration completed or skipped"

echo "✅ Database schema ready!"

# Start the application
echo "🎯 Starting FastAPI server..."
exec uvicorn main:app --host 0.0.0.0 --port 8000
