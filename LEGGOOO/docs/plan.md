# LEGGOOO — Project Plan, Roadmap & Executable Runbook (Claude-ready)

**Purpose:** This is an improved, unambiguous, execution-focused project plan and runbook for LEGGOOO designed so an automation/coding agent (like Claude Opus 4.5) can take tasks and implement them. It translates product goals into prioritized tickets, acceptance tests, deployment steps, and operational safeguards.

**How to use:**

- Human reader: use this as the master plan and checklist.
- Coding agent (Claude Opus 4.5): follow the "Agent Task Queue" at the end to perform implementation tasks in order.

---

## Summary & North Star

**North Star:** Deliver an MVP browser IDE that enables small teams (2–5) to collaboratively edit code (CRDT), get AI-powered code assistance using free/open models, and push completed work to GitHub — all deployed with free-friendly hosting and clear security controls.

Primary goals for MVP:

1. Reliable real-time collaborative editor (Monaco + Yjs) with presence and per-file editor cap of 5.
2. GitHub import & push flow (temp branch → main) with basic undo and auditing.
3. Local/open-source AI assistant endpoint for code completion, explanation, and fix suggestions.
4. Polished UI with theme system, ownership indicators, and the basic set of developer tools (Prettier, ESLint, Pyright).

---

## Deliverables (MVP)

- Working GitHub repository with `frontend/`, `backend/`, `ai/`, and `infra/` folders.
- `PRD.md`, `app-flow.md`, `ui-guidelines.md`, `tech-stack-overview.md`, and this improved `plan.md` in repo root.
- Netlify-deployed frontend and hosted backend (Railway/Render) including a `y-websocket` relay.
- Supabase (or equivalent) project configured for Auth (GitHub/Google), Postgres, and Storage.
- Working AI inference service (local-first) behind `/ai/query` with documented `AI_BASE_URL` config.
- CI workflows (GitHub Actions) for build/test/deploy.

---

## Execution Principles (for the agent)

1. **Make each change small & testable** — produce a working commit and CI green before moving to next ticket.
2. **Document every secret & environment variable usage** — put non-sensitive placeholders in `.env.example` and detailed instructions in README.
3. **Prefer reproducible local runs** — agent should include Docker or simple scripts for running services locally.
4. **Fail-safe defaults** — if an external integration is not configured (e.g., OpenAI key), the system must still work in local AI mode.

---

## Sprint plan (8 phases, aligned with CLAUDE_BUILD_PROMPT.txt)

<!-- updated by Claude — 2025-12-28 — aligned ticket numbering with CLAUDE_BUILD_PROMPT.txt -->

Each phase contains clear tickets with acceptance criteria and estimated effort (hours). Ticket IDs match `CLAUDE_BUILD_PROMPT.txt` for consistency.

### Phase T0 — Repo Skeleton & CI (3 days)

**Tickets:**

- T0-01 Repo skeleton + monorepo structure (2h)
  - Create `frontend/`, `backend/`, `ai/`, `infra/`, `docs/` with README stub and package.json files.
  - Add GitHub Actions skeleton (build/test/deploy for frontend & backend).
  - Branch: `feature/t0-repo-skeleton`
  - Acceptance: `pnpm install` runs, GitHub Actions lint job exists.
- T0-02 Provision accounts (Supabase, Netlify, Railway) and add placeholders to `.env.example` (1h)
  - Acceptance: all three accounts created and `.env.example` updated.
- T0-03 Simple health endpoints (backend) and Netlify test deploy (3h)
  - Acceptance: `GET /health` returns 200; Netlify deploy accessible.
- T0-04 Import skills and verify documentation (1h)
  - Run `./scripts/index_skills.ps1` to generate INDEX.txt for all ZIPs.
  - Review [README_skills_index.md](README_skills_index.md) for completeness.
  - Acceptance: All 15 skill folders have README.md; all 15 ZIPs have INDEX.txt.

### Phase T1 — Monaco + Yjs POC (1 week)

**Tickets:**

- T1-01 Monaco + Yjs integration (8h)
  - Implement a minimal page using `@monaco-editor/react` and bind to Yjs via `y-monaco`.
  - Branch: `feature/t1-monaco-yjs`
  - Acceptance: two browser windows show synced typing with cursors.
- T1-02 Deploy `y-websocket` server (4h)
  - Host on Railway/Render, provide `YWS_URL` env var.
  - Acceptance: clients connect to `wss://...` and sync.
- T1-03 Presence UI & editor cap (6h)
  - Implement awareness display, per-file avatars, and cap-to-5 enforcement (extra joiners become viewers).
  - Acceptance: 5 editors allowed; 6th becomes viewer and UI shows reason.

### Phase T2 — Auth & Workspaces (1 week)

**Tickets:**

- T2-01 Supabase Auth (GitHub + Google) wiring + user table (6h)
  - Supabase Auth for GitHub/Google; user table migration.
  - Branch: `feature/t2-auth-workspaces`
  - Acceptance: sign-in creates user record; `GET /user/me` returns valid user.
- T2-02 Workspace CRUD & import flow (6h)
  - Implement `POST /workspaces/import` (async job) to read repo tree and populate `files` rows.
  - Acceptance: public repo import completes and files appear in editor.

### Phase T3 — GitHub Import & Push (1 week)

**Tickets:**

- T3-01 GitHub Push Flow (8h)
  - Implement `POST /workspaces/:id/push` using Octokit to commit blobs + update ref.
  - Encryption for stored GitHub tokens (see [security_checklist.md](security_checklist.md)).
  - Branch: `feature/t3-github-integration`
  - Acceptance: Import populates files; push creates commit on GitHub with correct author.

### Phase T4 — AI Microservice & UI (1 week)

**Tickets:**

- T4-01 AI microservice (local) (10h)
  - Local FastAPI AI service exposing `/ai/query` with GPT4All or CodeLlama small.
  - Branch: `feature/t4-ai-pane`
  - Acceptance: `POST /ai/query` returns structured suggestion for a sample Python snippet.
- T4-02 Frontend AI Pane & "Apply" (6h)
  - UI to send selection & prompt_type to `/ai/query`, show results, apply patch.
  - Acceptance: clicking "apply" updates file content and syncs to other clients.

### Phase T5 — Editor Tooling & Snapshots (1 week)

**Tickets:**

- T5-01 Yjs snapshot persistence / restore (8h)
  - Prettier/ESLint integration; Yjs snapshot persistence to Supabase Storage.
  - Save compressed Yjs updates (every 2min + session end) and restore.
  - Branch: `feature/t5-snapshots`
  - Acceptance: Snapshot restored on reload; Prettier formats file via editor command.

### Phase T6 — Theming & Accessibility (1 week)

**Tickets:**

- T6-01 Theme system & audio (6h)
  - Implement CSS token-based theming using Tailwind + CSS variables; per-user theme persistence.
  - Respect `prefers-reduced-motion` and integrate Howler for ambient audio with mute toggles.
  - Branch: `feature/t6-theming`
  - Acceptance: theme persists; reduced-motion disables animations; audio plays only for that user.

### Phase T7 — CI, Tests & Deploy (1 week)

**Tickets:**

- T7-01 CI/CD, tests & final deploy (8h)
  - Playwright e2e tests (two-browser sync test), accessibility checks (axe), gitleaks scan.
  - Netlify deploy for frontend; backend to Railway/Render.
  - Branch: `feature/t7-ci-deploy`
  - Acceptance: CI passes and staging deploy accessible; Playwright two-client test passes.

---

## Agent Task Queue (instructions for Claude Opus 4.5)

<!-- updated by Claude — 2025-12-28 — aligned with T0-T7 ticket numbering -->

Perform tasks in order by phase (T0 → T7). For each ticket:

1. Create a branch: `feature/<ticket-id>-<short-desc>` (e.g., `feature/t1-01-monaco-yjs`)
2. Implement the ticket with small commits.
3. Add unit tests where applicable and run CI locally.
4. Open a PR with description, screenshots, and manual test steps.
5. After PR merge, deploy to staging and run smoke tests.

**Execution order (critical path):**

```
T0-01 (repo skeleton) → T0-02 (accounts) → T0-03 (health endpoints)
    ↓
T1-01 (Monaco+Yjs) → T1-02 (y-websocket deploy) → T1-03 (presence UI)
    ↓
T2-01 (Supabase Auth) → T2-02 (workspace CRUD)
    ↓
T3-01 (GitHub push)
    ↓
T4-01 (AI microservice) → T4-02 (AI pane UI)
    ↓
T5-01 (snapshots + tooling)
    ↓
T6-01 (theming + a11y)
    ↓
T7-01 (CI/CD + final deploy)
```

**Top priority immediate tasks:**

- Implement T0-01 first (repo skeleton with folders and package.json)
- Then T1-01 and T1-02 (Monaco + Yjs POC). These unblock everything else.

**For each feature, include:**

- `README.md` updates with run steps and env var requirements.
- `.env.example` entries (no secrets). Example:

```
SUPABASE_URL=https://xyz.supabase.co
SUPABASE_ANON_KEY=ANON_PLACEHOLDER
GITHUB_CLIENT_ID=GITHUB_CLIENT_ID_PLACEHOLDER
GITHUB_CLIENT_SECRET=GITHUB_CLIENT_SECRET_PLACEHOLDER
AI_BASE_URL=http://localhost:5000
YWS_URL=wss://yws.example.com
```

**Testing notes for agent:**

- Use `ngrok` to expose local services for OAuth tests.
- Use a small test GitHub repo for push tests and mock tokens if needed.
- For AI, default to a tiny model or stub returning canned responses during integration tests.

---

## Acceptance criteria (detailed) — copy into commit messages

- Real-time edits: two clients show identical buffers within 250ms median latency (local network).
- Presence: avatars with initials appear on file and top bar; cursor colors match awareness states.
- Git push: commit appears in GitHub with correct author and commit message; pushed files flagged `is_locked_in_main`.
- AI: structured JSON response `{ request_id, model, latency_ms, result: { type, text, suggestions } }` and "apply" endpoint updates files atomically.
- Security: GitHub tokens encrypted; CSRF & CORS configured; AI endpoint rate-limited.

---

## Deployment & Rollback Quick Commands

**Deploy frontend (Netlify via CLI):**

```bash
netlify deploy --prod --dir=frontend/dist
```

**Start y-websocket locally for dev:**

```bash
npx y-websocket-server --port 1234
```

**Start AI FastAPI dev server:**

```bash
cd ai && uvicorn main:app --reload --port 5000
```

**Rollback frontend via Netlify UI** (Netlify maintains deploy history)
**Rollback backend** — redeploy previous tag via Railway/Render.

---

## Security checklist (practical tasks for agent)

- Add middleware to encrypt/decrypt `github_token` before DB save/after read (use libs: `node-jose` or platform KMS).
- Implement request rate-limiter for `/ai/query` (Upstash or simple in-memory for dev).
- Add secret-scan preflight on AI calls (reject strings matching common key patterns).
- Enforce server-side RBAC on `/files/*`, `/workspaces/*`, `/workspaces/:id/push`.
- Add Dependabot & GitHub Actions job to fail on critical vulnerabilities.

---

## Post-launch & next-phase backlog (brief)

- Full PR/MR flow + code review UI
- Live video/audio + in-app chat
- Optional E2E encryption for private workspaces
- Multi-region websocket relay & Redis persistence
- Paid tiers: hosted high-quality LLM inference for teams

---

## Closing notes for Claude

This plan is intentionally procedural: create the repo skeleton, implement the POC editor and y-websocket, wire auth and workspaces, then tackle GitHub push and AI. For each PR, add a short summary and acceptance steps, and include an automated smoke test script that runs Playwright to verify basic flows.

When you finish each sprint, update `plan.md` with status and link to PRs. Prioritize stability and reproducibility — include `docker-compose.yml` for local dev if possible.

_End of improved plan.md — ready for execution._
