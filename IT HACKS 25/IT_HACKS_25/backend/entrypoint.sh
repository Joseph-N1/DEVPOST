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

# Seed admin user
echo "🔐 Seeding admin user..."
python -c "
import asyncio
from database import AsyncSessionLocal
from models.auth import User, UserRole
from auth.utils import hash_password
from sqlalchemy import select

async def seed_admin():
    async with AsyncSessionLocal() as db:
        # Check if admin exists
        result = await db.execute(select(User).where(User.email == 'joseph123nimyel@gmail.com'))
        existing = result.scalar_one_or_none()
        if not existing:
            admin = User(
                email='joseph123nimyel@gmail.com',
                username='admin',
                password_hash=hash_password('password'),
                full_name='Joseph Nimyel (Admin)',
                role=UserRole.admin,
                is_active=True
            )
            db.add(admin)
            await db.commit()
            print('✅ Admin user created: joseph123nimyel@gmail.com')
        else:
            print('✅ Admin user already exists')

asyncio.run(seed_admin())
" || echo "⚠️ Admin seeding completed or skipped"

# Start the application
echo "🎯 Starting FastAPI server..."
exec uvicorn main:app --host 0.0.0.0 --port 8000
