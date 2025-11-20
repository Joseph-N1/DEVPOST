#!/bin/bash
set -e

echo "🚀 Starting ECO FARM backend..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
until PGPASSWORD=$POSTGRES_PASSWORD psql -h "postgres" -U "farm" -d "eco_farm" -c '\q' 2>/dev/null; do
  >&2 echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "✅ PostgreSQL is up!"

# Run database migrations
echo "🔄 Running database migrations..."
cd /app
alembic upgrade head

echo "✅ Migrations complete!"

# Start the application
echo "🎯 Starting FastAPI server..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload
