# LEGGOOO Infrastructure

> Deployment configs, Docker files, and infrastructure templates

## Contents

| File | Purpose |
|------|---------|
| `.env.example` | Infrastructure-specific env vars |
| `docker-compose.yml` | Local multi-service development |
| `docker-compose.prod.yml` | Production deployment |
| `Dockerfile.frontend` | Frontend container |
| `Dockerfile.backend` | Backend container |
| `Dockerfile.ai` | AI service container |
| `netlify.toml` | Netlify deployment config |

## Local Development with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Deployment Targets

| Service | Platform | Notes |
|---------|----------|-------|
| Frontend | Netlify | Auto-deploy from `main` |
| Backend | Railway / Render | Node.js container |
| y-websocket | Railway / Render | Separate service |
| AI | Railway / Render | Python container (optional) |
| Database | Supabase | Managed PostgreSQL |

## Environment Variables (Infra-specific)

See `.env.example` in this directory for deployment-specific variables.

## Netlify Config

```toml
[build]
  base = "frontend"
  command = "pnpm build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Railway Config

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "pnpm start",
    "healthcheckPath": "/health"
  }
}
```
