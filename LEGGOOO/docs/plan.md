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

## Sprint plan (4 sprints, 2 weeks total cadence — compressed for hackathon)
Each sprint contains clear tickets with acceptance criteria and estimated effort (hours). Adjust depending on team size.

### Sprint 0 — Foundations (3 days)
**Tickets:**
- T0-01 Repo skeleton + monorepo structure (2h)
  - Create `frontend/`, `backend/`, `ai/`, `infra/`, `docs/` with README stub and package.json files.
  - Acceptance: `pnpm install` in each folder succeeds.
- T0-02 Provision accounts (Supabase, Netlify, Railway) and add placeholders to `infra/.env.example` (1h)
  - Acceptance: all three accounts created and `.env.example` updated.
- T0-03 Simple health endpoints (backend) and Netlify test deploy (3h)
  - Acceptance: `GET /health` returns 200; Netlify deploy accessible.

### Sprint 1 — Real-time Editor & Presence (1 week)
**Tickets:**
- T1-01 Monaco + Yjs POC (8h)
  - Integrate `@monaco-editor/react` in `frontend/` and connect Yjs doc via `y-websocket` client.
  - Acceptance: two browser windows show synced typing with cursors.
- T1-02 Deploy `y-websocket` server (4h)
  - Host on Railway/Render, provide `YWS_URL` env var.
  - Acceptance: clients connect to `wss://...` and sync.
- T1-03 Presence UI & editor cap (6h)
  - Implement awareness display, per-file avatars, and cap-to-5 enforcement (extra joiners become viewers).
  - Acceptance: 5 editors allowed; 6th becomes viewer and UI shows reason.

### Sprint 2 — Auth, Workspaces & Git Integration (1 week)
**Tickets:**
- T2-01 Supabase Auth (GitHub + Google) wiring + user table (6h)
  - Acceptance: sign-in creates user record and stores encrypted token placeholder.
- T2-02 Workspace CRUD & import flow (6h)
  - Implement `POST /workspaces/import` (async job) to read repo tree and populate `files` rows.
  - Acceptance: public repo import completes and files appear in editor.
- T2-03 GitHub Push Flow (8h)
  - Implement `POST /workspaces/:id/push` using Octokit to commit blobs + update ref.
  - Acceptance: pushing selected files creates a commit accessible on GitHub and locks files in `main`.

### Sprint 3 — AI Assistant & Tooling (1 week)
**Tickets:**
- T3-01 AI microservice (local) (10h)
  - FastAPI server that exposes `/ai/query` and uses GPT4All or CodeLlama small via llama.cpp.
  - Acceptance: `POST /ai/query` returns structured suggestion for a sample Python snippet.
- T3-02 Frontend AI Pane & "Apply" (6h)
  - UI to send selection & prompt_type to `/ai/query`, show results, apply patch.
  - Acceptance: clicking "apply" updates file content and syncs to other clients.
- T3-03 Lint & formatter integration (4h)
  - Provide Prettier and ESLint run support; basic client-side format action.
  - Acceptance: Prettier formats file via editor command.

### Sprint 4 — Persistence, Theming & Launch (1 week)
**Tickets:**
- T4-01 Yjs snapshot persistence / restore (8h)
  - Save compressed Yjs updates to Supabase Storage (every 2min + session end) and restore.
  - Acceptance: reload restores workspace to last snapshot.
- T4-02 Theme system & audio (6h)
  - Implement 6 modes with CSS tokens; audio toggle per user.
  - Acceptance: theme selection persists and audio plays only for that user.
- T4-03 CI/CD, tests & deploy (8h)
  - GitHub Actions for frontend build/test/deploy and backend deploy; Playwright e2e smoke test.
  - Acceptance: CI green and deployed app passes smoke tests.

---

## Agent Task Queue (instructions for Claude Opus 4.5)
Perform tasks in order. For each ticket:
1. Create a branch: `feature/<ticket-id>-<short-desc>`
2. Implement the ticket with small commits.
3. Add unit tests where applicable and run CI locally.
4. Open a PR with description, screenshots, and manual test steps.
5. After PR merge, deploy to staging and run smoke tests.

**Top priority immediate tasks:**
- Implement T0-01, T1-01, and T1-02 (editor POC and y-websocket deploy). These unblock everything else.

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

*End of improved plan.md — ready for execution.*

