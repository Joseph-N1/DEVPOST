# LEGGOOO — Tech Stack Overview & Backend Structure (DETAILED)

**Purpose:** Definitive engineering blueprint for LEGGOOO. Split into two parts:

- **Part A — Tech Stack:** specific tools, libraries, runtime versions, dev workflows and rationale (free-first, Netlify-friendly).
- **Part B — Backend Structure:** database schema (DDL), infra & deployment guidance, realtime protocol details, exhaustive API contracts with example requests/responses, security and operational practices.

This document is intentionally actionable — copy/pasteable configs, SQL, and API examples appear below.

---

## PART A — TECH STACK (Free-first, Production-capable)

### Frontend

- **Framework & Build:** React 18 + Vite 5
  - `node >=18`, `npm` or `yarn` / `pnpm`
  - Recommended starter: Vite React + TypeScript template
- **Editor UI:** Monaco Editor via `@monaco-editor/react` (v5+)
- **CRDT + Collab:** `yjs` + `y-monaco` (client) for binding Monaco to CRDT
- **Transport layer:** `y-websocket` client library (connects to central relay) or `y-webrtc` for P2P fallback
- **Styling & Design System:** Tailwind CSS (v4) + CSS variables for theme tokens
- **State & Data Fetching:** React Query for server state + Zustand for ephemeral UI state
- **Routing & Meta:** React Router v6; use React Helmet or Vite plugin for SEO/meta
- **i18n (optional):** react-intl or i18next

**Local dev commands (examples)**

- `pnpm install`
- `pnpm dev` → starts Vite at `http://localhost:5173`
- `pnpm build` → `pnpm preview`

---

### Realtime / Collaboration

- **CRDT:** Yjs for conflict-free edits
- **Server relay:** y-websocket (Node.js) — recommended for reliability in small-team apps
  - Lightweight server: `y-websocket` repo provides a single-file server; deploy on Railway/Render
- **Fallback P2P:** y-webrtc (requires simple signaling server)
- **Awareness:** use Yjs Awareness API for presence metadata (cursor, user color, display name)

**Notes:** Persist Yjs state snapshots periodically (see Part B). For MVP prefer central `y-websocket`; later add P2P to reduce hosting cost.

---

### Backend / Orchestration

- **Primary runtime:** Node.js 18+ (Express / Fastify) for REST endpoints and WebSocket relay host
- **AI microservice:** Python (FastAPI) if using local HuggingFace/llama.cpp models; or Node.js proxy if using hosted providers
- **Auth/Data layer:** Supabase (Postgres + Auth + Storage) recommended for MVP (free tier) — simplifies OAuth + DB + storage
- **GitHub integration:** use `@octokit/rest` (Octokit) in Node backend to construct commits and update refs

---

### Database & Storage

- **Primary DB:** PostgreSQL (Supabase-managed or self-hosted Postgres)
- **Object storage:** Supabase Storage (S3-compatible) for snapshots, large blobs
- **Caching / Rate-limit store:** Upstash (Redis on free tier) for rate limiting, presence cache

---

### AI / LLM Options (free-first)

- **Local (recommended for free demo):** GPT4All, CodeLlama (small) via `llama.cpp` or `ggml` builds
- **Local stack:** `text-generation-webui` or `gpt4all` server; orchestrate via FastAPI
- **Hosted (optional):** OpenAI — allow user to supply their API key to avoid billing
- **Inference orchestration:** Python FastAPI → exposes `/infer` endpoints; Node proxies requests when necessary

---

### DevOps / CI / CD

- **Repo:** GitHub
- **CI:** GitHub Actions — build/test & deploy workflows
- **Frontend deploy:** Netlify (Auto from GitHub or via Actions)
- **Backend deploy:** Railway / Render / Supabase Edge Functions (choose based on WebSocket support)
- **Secrets:** Netlify env vars + Railway/Render secret store + GitHub Actions secrets

---

### Observability & Security Tools

- **Errors & tracing:** Sentry (frontend & backend)
- **Dependency scanning:** GitHub Dependabot + optional Snyk
- **Static analysis:** ESLint, Prettier, Pyright

---

## PART B — BACKEND STRUCTURE (Implementation-ready)

### 1. Database Schema (Postgres) — Full DDL + Indexing

Use Postgres with `pgcrypto`/`pg_generate_uuid` support. Below DDL includes indexes and constraints.

```sql
-- Enable extensions (run once)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oauth_provider VARCHAR(32) NOT NULL,
  oauth_id VARCHAR(128) NOT NULL,
  display_name VARCHAR(128),
  email VARCHAR(256),
  avatar_initial CHAR(1),
  github_token_encrypted TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX ux_users_oauth ON users (oauth_provider, oauth_id);

-- workspaces
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(256) NOT NULL,
  description TEXT,
  repo_url TEXT,
  imported_branch VARCHAR(128),
  visibility VARCHAR(16) DEFAULT 'private',
  created_at TIMESTAMPTZ DEFAULT now(),
  last_active TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_workspaces_owner ON workspaces (owner_id);

-- files
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  filename VARCHAR(256) NOT NULL,
  contents TEXT,
  creator_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  is_locked_in_main BOOLEAN DEFAULT false,
  last_commit_sha VARCHAR(256)
);
CREATE UNIQUE INDEX ux_files_workspace_path ON files (workspace_id, path);
CREATE INDEX idx_files_workspace ON files (workspace_id);

-- sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  session_token VARCHAR(256) UNIQUE,
  started_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  active_users JSONB DEFAULT '[]'::jsonb
);

-- branches
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(128) NOT NULL,
  latest_sha VARCHAR(256),
  commits JSONB DEFAULT '[]'::jsonb
);

-- presence
CREATE TABLE presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  file_id UUID REFERENCES files(id),
  cursor_position JSONB,
  selection_range JSONB,
  last_active TIMESTAMPTZ DEFAULT now()
);

-- permissions
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  role VARCHAR(16) CHECK (role IN ('owner','editor','viewer')) DEFAULT 'viewer'
);
CREATE UNIQUE INDEX ux_permissions ON permissions (workspace_id, user_id);

-- ai_requests
CREATE TABLE ai_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  user_id UUID REFERENCES users(id),
  prompt_hash VARCHAR(128),
  prompt TEXT,
  response TEXT,
  model_used VARCHAR(128),
  latency_ms INT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Storage guidance:** Keep `files.contents` for small text files. For large binary artifacts or workspace zips, store in Supabase Storage and reference via `snapshots` table (not shown above).

---

### 2. Snapshot persistence strategy (Yjs)

- Persist encoded Yjs state (`Y.encodeStateAsUpdate(doc)`) as compressed binary into Supabase Storage (or DB bytea).
- Snapshot metadata table example:

```sql
CREATE TABLE snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  snapshot_path TEXT, -- storage path in Supabase
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  yjs_state_hash VARCHAR(128)
);
```

- Schedule: store snapshot on session end and periodic interval (e.g., every 2 minutes or after X edits).

---

### 3. Realtime / WebSocket integration (y-websocket)

**Client connect:** `wss://api.legg000.app/yjs/{workspaceId}`
**Protocol:** y-websocket default: clients exchange sync messages, then use Awareness API for cursors.

**Server responsibilities:**

- accept connections, relay updates, optionally persist updates
- store awareness states in Redis if horizontally scaling
- enforce per-file editor cap by checking awareness users and denying edit permission if >5 (server instructs client to become viewer)

**Scaling notes:** for >1 instance use Redis pub/sub and ensure sticky sessions or implement central persistence layer for Yjs updates.

---

### 4. API Contracts (detailed, REST — MVP)

**Auth**

- `GET /auth/oauth/github` — Redirect to GitHub OAuth (server handles state)

- `POST /auth/oauth/callback`
  - **Body:** `{'code':'<oauth_code>'}` (or via query params)
  - **Response:** `200 OK`
  ```json
  {
    "token": "<jwt>",
    "user": { "id": "uuid", "display_name": "Sam", "email": "sam@example.com" }
  }
  ```

**GET /user/me**

- Headers: `Authorization: Bearer <jwt>`
- Response: `200 OK`

```json
{
  "id": "uuid",
  "display_name": "Sam",
  "email": "sam@example.com",
  "avatar_initial": "S",
  "preferences": { "theme": "neon" }
}
```

**Workspaces**

- `POST /workspaces` — create

  - Body: `{ "name":"My Hack", "visibility":"private" }`
  - Response: `201 Created` `{ "workspace": { ... } }`

- `POST /workspaces/import` — import GitHub repo (async)

  - Body: `{ "repo_url":"https://github.com/owner/repo","branch":"main" }`
  - Response: `202 Accepted` `{ "workspace_id":"...","status_url":"/workspaces/:id/import-status" }`

- `GET /workspaces/:id` — return metadata + collaborators

**Files**

- `GET /workspaces/:id/files` — list files (metadata)
- `GET /files/:fileId` — return contents + language meta
- `POST /files/:fileId/patch` — apply a patch (server validates permissions)
  - Body: `{ "patch": { "ops": [...] } }` or full `contents`

**Git Push**

- `POST /workspaces/:id/push`
  - Body example
  ```json
  {
    "files": [{ "path": "src/index.js", "contents": "..." }],
    "commit_message": "feat: add login",
    "author": { "name": "Sam", "email": "sam@example.com" }
  }
  ```
  - Server: validate permissions → create blobs, tree, commit → update ref via GitHub API
  - Response: `200 OK` `{ "commit_sha":"abc123","pushed_files":[...]} `

**AI**

- `POST /ai/query`
  - Body
  ```json
  {
    "workspace_id": "...",
    "file_id": "...",
    "selection": { "start": 120, "end": 320 },
    "prompt_type": "explain",
    "max_tokens": 500
  }
  ```
  - Response
  ```json
  {
    "request_id": "uuid",
    "model": "gpt4all-v1",
    "latency_ms": 1200,
    "result": {
      "type": "explanation",
      "text": "Line 1: ...\nLine 2: ...",
      "suggestions": [
        { "patch": "...", "applyEndpoint": "/files/:fileId/patch" }
      ]
    }
  }
  ```

**Errors**

- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 429 Too Many Requests
- 500 Internal Server Error

---

### 5. GitHub integration specifics

- Use Octokit to create blobs/trees/commits:
  1. Create blob(s) for file contents
  2. Create tree
  3. Create commit
  4. Update ref `refs/heads/main`
- **Least-privilege token:** prefer storing a user-scoped token with repo access. For public-only, request reduced scopes.
- **Batching:** group multiple file updates into single commit to reduce API calls and rate-limit exposure.

---

### 6. Security & Operational checklist (actionable)

- TLS everywhere (HTTPS + WSS)
- Encrypt GitHub tokens at rest (platform KMS or encrypted DB column)
- Use JWTs with short expiry; store refresh tokens securely
- Sanitize inputs & perform secret scanning before sending code to external models
- Rate limit AI and push endpoints; use Redis or API Gateway
- Enforce server-side RBAC for every request
- Setup Dependabot and run CI checks for vulnerabilities
- Backups: daily DB backups, weekly snapshot retention policy (90 days default)
- Logging: centralize logs, preserve audit trail for push & AI events for 90 days

---

### 7. Deployment recipe (MVP) — step-by-step

1. Provision Supabase project (Postgres + Auth + Storage). Note ENV: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (keep secret).
2. Configure GitHub OAuth App → set callback to `https://<api-host>/auth/oauth/callback` and save `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` in secrets.
3. Deploy y-websocket server to Railway/Render. Set env `YWS_PORT` and enable TLS via host.
4. Deploy backend Node service (Express/Fastify) to Railway/Render. Set env for DB, GitHub secrets, JWT secret.
5. Set Netlify site to connect to GitHub repo and deploy frontend. Configure Netlify envs: `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
6. (Optional) Deploy Python FastAPI inference service to separate host or run locally for demos. Set `AI_BASE_URL` in envs.
7. Configure monitoring (Sentry DSN) and logging.

---

### 8. Local dev & debug tips

- Use `ngrok` for testing OAuth callbacks when running locally
- Use Supabase CLI/local Postgres Docker for local DB
- For y-websocket local testing set `YWS_HOST=localhost` and use `wss://localhost` with self-signed certs or run over plain ws in dev

---

### 9. Scaling notes & future upgrades

- Move y-websocket to clustered mode with Redis persistence for large scale
- Add autoscaling inference cluster or rely on user-provided API keys
- Introduce PR/MR workflow, CI integration for pushed commits, and code-review UI
- Implement optional E2E encryption for private workspaces (client-side encryption of Yjs updates)

---

## Appendix: Helpful commands & snippets

**Create a commit via Octokit (Node.js simplified)**

```js
// pseudocode
const { Octokit } = require("@octokit/rest");
const octokit = new Octokit({ auth: userToken });
// create blobs, tree, commit, update ref (see GitHub REST API docs)
```

**Example y-websocket start (node)**

```bash
npx y-websocket-server --port 1234
```

**Example local GPT4All start (python)**

```bash
gpt4all --model gpt4all-lora-unfiltered-quantized.bin --server
# then set AI_BASE_URL=http://localhost:5000
```

---

## Part C — Local Skills & Scripts

<!-- updated by Claude — 2024-12-28 — added local skills section -->

### Skills Library

LEGGOOO includes a curated library of skill packs in `docs/skills/`. These contain design patterns, code templates, and reference implementations.

| Category       | Skills                                   | Contents                            |
| -------------- | ---------------------------------------- | ----------------------------------- |
| Editor         | `editor-integration/`                    | Monaco + Yjs setup, LSP integration |
| Theming        | `tailwind-theming/`, `theme-switching/`  | CSS variables, theme toggle         |
| Accessibility  | `a11y-for-editors/`, `motion-reduction/` | ARIA, reduced motion                |
| Infrastructure | `ci-templates/`, `docker-compose-dev/`   | GitHub Actions, Docker              |
| Design         | `figma-to-code/`, `front-end-design/`    | Figma workflow, UI patterns         |

### Scripts

```bash
# Generate INDEX.txt for all skill ZIPs
./scripts/index_skills.sh      # Bash
.\scripts\index_skills.ps1     # PowerShell

# Extract all skill ZIP archives
./scripts/unpack_skills.sh     # Bash
.\scripts\unpack_skills.ps1    # PowerShell
```

### Integration Points

| Script            | Integrates With                 |
| ----------------- | ------------------------------- |
| `index_skills.*`  | Skills inventory, CI validation |
| `unpack_skills.*` | Local development setup         |

See [README_skills_index.md](../README_skills_index.md) for complete skill inventory.

---

_End of detailed tech-stack-overview.md_
