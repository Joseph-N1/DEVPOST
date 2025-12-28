# Docker Compose Development

> Skill pack for containerized development environments and Docker orchestration.

## Contents

| File                                | Description                                        |
| ----------------------------------- | -------------------------------------------------- |
| `docker-containerization.zip`       | Docker and docker-compose patterns for development |
| `docker-containerization.INDEX.txt` | Auto-generated listing of ZIP contents             |

## Overview

This skill pack provides Docker patterns for:

- Local development environment setup
- Multi-service orchestration
- Database containerization
- Hot-reload development workflows

## LEGGOOO Docker Stack

### Recommended `docker-compose.yml`

```yaml
version: "3.8"

services:
  # Frontend (Vite dev server)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - VITE_API_URL=http://localhost:3000
      - VITE_WS_URL=ws://localhost:1234

  # Yjs WebSocket server
  yjs-server:
    build:
      context: ./backend/yjs-server
    ports:
      - "1234:1234"
    environment:
      - PORT=1234

  # API server (optional, if using custom backend)
  api:
    build:
      context: ./backend/api
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/leggooo
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
    depends_on:
      - db

  # Local PostgreSQL (dev only, production uses Supabase)
  db:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=leggooo
    volumes:
      - pgdata:/var/lib/postgresql/data

  # AI service (Python FastAPI)
  ai-service:
    build:
      context: ./backend/ai-service
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - MODEL_PATH=/models
    volumes:
      - ./models:/models

volumes:
  pgdata:
```

### Development Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f frontend

# Rebuild after dependency changes
docker-compose build --no-cache frontend

# Clean up
docker-compose down -v
```

## Volume Mounting Best Practices

| Pattern                       | Use Case                      |
| ----------------------------- | ----------------------------- |
| Bind mount source             | Hot reload during development |
| Named volume for node_modules | Avoid permission issues       |
| Named volume for DB data      | Persist across restarts       |

## Related Skills

- [ci-templates](../ci-templates/) — CI/CD with Docker builds
- [code-server](../code-server/) — Browser-based development

---

_Skill pack for LEGGOOO collaborative IDE_
