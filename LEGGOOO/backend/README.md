# LEGGOOO Backend

> Node.js API server with Express, Supabase, and y-websocket

## Tech Stack

- **Node.js 18+** — Runtime
- **Express** — HTTP framework (or Fastify)
- **TypeScript** — Type safety
- **Supabase** — Auth verification & database client
- **y-websocket** — Yjs WebSocket server for CRDT sync
- **Octokit** — GitHub API client
- **Zod** — Request validation

## Development

```bash
# From project root
pnpm dev:backend

# Or from this directory
pnpm dev
```

## Project Structure

```
backend/
├── src/
│   ├── routes/           # API route handlers
│   │   ├── auth.ts       # Auth endpoints
│   │   ├── workspaces.ts # Workspace CRUD
│   │   ├── files.ts      # File operations
│   │   ├── git.ts        # GitHub import/push
│   │   └── ai.ts         # AI proxy endpoints
│   ├── middleware/       # Express middleware
│   │   ├── auth.ts       # JWT verification
│   │   ├── rateLimit.ts  # Rate limiting
│   │   └── validate.ts   # Zod validation
│   ├── services/         # Business logic
│   │   ├── github.ts     # Octokit wrapper
│   │   ├── encryption.ts # Token encryption
│   │   └── yjs.ts        # Yjs document management
│   ├── lib/              # Utilities
│   │   ├── supabase.ts   # Supabase client
│   │   └── logger.ts     # Logging
│   ├── types/            # TypeScript types
│   └── index.ts          # Entry point
├── tests/                # Unit tests
├── tsconfig.json
└── package.json
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/user/me` | Get current user |
| `GET` | `/workspaces` | List user workspaces |
| `POST` | `/workspaces` | Create workspace |
| `POST` | `/workspaces/import` | Import from GitHub |
| `POST` | `/workspaces/:id/push` | Push to GitHub |
| `GET` | `/workspaces/:id/files` | List files |
| `POST` | `/ai/query` | AI assistant query |

## Environment Variables

Uses root `.env` or create `.env` here:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
API_PORT=3000
ENCRYPTION_KEY=your-32-byte-hex-key
JWT_ACCESS_SECRET=your-access-secret
```

## y-websocket Server

The backend can run a y-websocket server for real-time collaboration:

```bash
# Standalone y-websocket (production)
PORT=1234 npx y-websocket

# Or integrated with Express (dev)
# See src/services/yjs.ts
```

## Testing

```bash
pnpm test
```

## Build & Deploy

```bash
pnpm build
# Output: dist/

# Run production
NODE_ENV=production pnpm start
```

Deploy to Railway, Render, or any Node.js host.
