# LEGGOOO — Product Requirements Document (PRD)

**Project:** LEGGOOO — Real-Time Collaborative Coding IDE with AI Assistant
**Author:** (You)
**Version:** 1.0
**Date:** (auto-generate on export)

---

## Table of Contents

1. Executive Summary
2. Goals & Success Metrics
3. Target Users & Personas
4. Scope (MVP & Planned Features)
5. Detailed Functional Requirements

   - Authentication & Roles
   - Workspace & Repo Management
   - Real-time Collaboration
   - Editor & Tooling
   - AI Assistant Capabilities
   - Persistence, Versioning, and Git Integration
   - Theming & UX Preferences
   - Integrations

6. Non-Functional Requirements

   - Performance & Latency
   - Scalability
   - Availability & Reliability
   - Security & Privacy
   - Compliance & Data Retention

7. Data Model & Schemas (Detailed)
8. API Specification (Selected Endpoints)
9. Error Handling & Reliability Patterns
10. Operational Considerations & DevOps
11. Acceptance Criteria & Test Cases
12. Milestone Roadmap
13. Risks, Assumptions & Open Questions
14. Appendix: Security Checklist (Actionable Items)

---

## 1. Executive Summary

LEGGOOO is a browser-based collaborative IDE targeted at small remote teams (2–5 members) who need a lightweight, quick-to-start environment for hackathons, pair programming, and portfolio creation. Key features include real-time collaborative editing (CRDT-based), GitHub integration (import/push), a free/open-source-first AI assistant for code completion, explanations, and fixes, and per-user theme personalization. Frontend will be deployed on Netlify; backend will prioritize free-hosting options (Supabase, Railway) and local-first AI inference where possible.

## 2. Goals & Success Metrics

**Business/User Goals**

- Enable teams to collaboratively build and push production-ready code to GitHub within a short time window (e.g., hackathon day).
- Provide accessible AI assistance with no vendor lock-in required for basic functionality.
- Make sharing and attribution transparent: who created and edited files.

**Success Metrics (KPIs)**

- Time to first collaborative edit: <2 minutes from sign-in.
- Real-time sync latency: median <250ms for same-region clients.
- AI response latency: <3s for local small models; <1s for hosted provider.
- GitHub push success rate: 95% for valid commits in test scenarios.
- User satisfaction (qualitative): 4+/5 in feedback from 10 pilot users.

## 3. Target Users & Personas

- **Hackathon Sam (Primary)** — Rapid prototyping, needs Git-ready commits and lightweight collaboration.
- **Student Group (Secondary)** — Collaborative projects, attribution and session replay for grading.
- **Small Team / Friends (Secondary)** — Quick sync sessions, cross-language support, minimal infra.

User needs: low friction onboarding (OAuth), clear presence indicators, conflict-free editing, ability to export to GitHub, and AI help that improves productivity.

## 4. Scope

**MVP (must-have for initial launch)**

- OAuth (GitHub & Google) authentication.
- Workspace creation & GitHub import (branch select).
- Monaco editor with Yjs CRDT sync, per-user cursors (max 5 editors/file).
- AI assistant: code completion, lint suggestions, explain code, propose fixes & unit test suggestions implemented via open-source/local model with option to use external provider via user-supplied API key.
- Temp branch collaboration model; push to `main` commits via GitHub API.
- Session persistence and public share link (view/edit roles).
- Basic theming (6 mood modes + Light/Dark) with per-user audio toggle.

**Post-MVP (planned / nice-to-have)**

- Video & voice chat (WebRTC), in-app messaging.
- Remote test execution sandbox.
- Full PR/merge request workflow with code review UI.
- End-to-end encrypted sessions.
- Integration: "Open in VS Code" / Code-Server embedding.

## 5. Detailed Functional Requirements

### 5.1 Authentication & Roles

- **OAuth providers:** GitHub, Google.
- **User record:** store `user_id`, `display_name`, `email`, `oauth_provider`, `avatar_initial`, `github_token_encrypted` (scoped), `preferences` (theme, audio settings).
- **Roles & permissions:** Owner (full), Editor (edit/push if permitted), Viewer (read-only). Owners can invite and change roles.
- **Session tokens:** Issue JWTs with short lifetime; refresh token stored encrypted server-side or use Supabase Auth.

### 5.2 Workspace & Repo Management

- **Create workspace:** name, description, visibility (private/public), default language.
- **Import Git repo flow:** user provides `repo_url` and branch. App uses OAuth token to clone (via GitHub API) and populate workspace files into temp branch.
- **Temporary branch:** edits in-app occur in `temp/<workspace_id>` branch. Only owners can push selected files to `main` branch.
- **Undo rules:** a push to `main` can be undone only if it is the first push and no subsequent pushes occurred (MVP constraint). Later add proper revert/PR.
- **Export options:** ZIP download, clone instructions, or push to GitHub.

### 5.3 Real-time Collaboration

- **CRDT:** Yjs with y-websocket or y-webrtc fallback. y-websocket recommended for reliable sessions; y-webrtc for P2P.
- **Per-file editing cap:** 5 editors per file. Excess users join as viewers.
- **Presence:** active users list, per-file editor indicators, cursor colors, and `last_active` timestamp.
- **Conflict resolution:** CRDT ensures merge-free sync; when pushing to GitHub, server constructs commit with latest temp snapshot.
- **History & snapshots:** store periodic snapshots (e.g., every 2 minutes) for revert/backups.

### 5.4 Editor & Tooling

- **Monaco Editor** configured with language detection based on file extension. Supports multi-tab editing.
- **Extensions integrated:** Prettier, ESLint, Pyright, flake8, pylint, EditorConfig. For in-browser, use language servers where feasible or lightweight static analyzers executed server-side or by AI.
- **Run-tests (future):** local runner or remote sandbox with resource limits.
- **File ops:** create, rename, move, delete, undo (limited), preview (Markdown/HTML), and file ownership display.

### 5.5 AI Assistant

- **Actions:** Complete, Lint, Explain, Fix, Generate Tests, Suggest Refactor.
- **Context:** include file content (or selected lines), language, recent edits, and any relevant session metadata. Protect secrets/private tokens from being sent inadvertently.
- **Model selection:** local-first (GPT4All, CodeLlama small) via llama.cpp for small models; allow user to connect their OpenAI key for higher-quality responses.
- **Rate limits & quotas:** per-session limits to avoid abuse; configurable per deployment.
- **UI behavior:** suggestions presented inline with `Apply` button. Explanations appear in the AI pane with copy/export.
- **Logging & audit:** store AI prompts & responses to AIRequests table with model metadata; users can toggle whether the session is stored (privacy preference).

### 5.6 Persistence, Versioning & Git Integration

- **Branches:** `temp/<ws>` and `main` maintained. Commits tagged with `author_user_id`, timestamp, and commit message.
- **Push flow:** pick files, compose commit message, server constructs commit via GitHub API using least-privilege token (e.g., `repo` or narrow-scope token). Confirm success and mark files as locked in `main`.
- **Overwrite logic:** pushing a file with same path overwrites main's file (new commit). Temp remains editable.

### 5.7 Theming & UX

- **Themes:** 6 mood modes + Light/Dark baseline. Themes apply CSS variables and background overlays. Pixelation effect implemented via CSS filter or overlay.
- **Audio:** ambient loops per theme; allow per-user toggles and volume control.
- **Accessibility:** keyboard navigation, ARIA labels, and color-contrast options.

### 5.8 Integrations

- **GitHub:** import, push, invite via GitHub username.
- **Open in IDE:** provide `git clone` instructions and integration points for Code-Server.
- **Optional:** Slack notifications, webhooks on push events.

## 6. Non-Functional Requirements

### 6.1 Performance & Latency

- Target median edit propagation <250ms for intra-region participants.
- AI inference: <3s for local small models; <1s for hosted models (if available).
- Cold-starts for y-websocket or model services should be minimized with warm-up strategies or lightweight containers.

### 6.2 Scalability

- Design to support N independent sessions; scale y-websocket servers horizontally via stateless approach and sticky sessions or use WebSocket gateways.
- For small-team focus, aim for 50 concurrent sessions initially.

### 6.3 Availability & Reliability

- Frontend deployed to Netlify with CDN and fast failover.
- Use managed DB (Supabase) with automated backups.
- Use monitoring and alerting (Sentry, Prometheus + Grafana or platform-provided) for production readiness.

### 6.4 Security & Privacy

- Must use HTTPS/WSS for all data in transit.
- OAuth credentials and GitHub tokens encrypted at rest with KMS or platform secrets.
- Principle of least privilege: request minimum scopes when connecting to GitHub.
- Server-side authorization enforced for every action (push, edit, invite).
- Input sanitization and scanning for secrets in code before sending to third-party models.
- Provide privacy toggle: user can opt-out of storing AI prompts/responses.

### 6.5 Compliance & Data Retention

- Default retention for workspace snapshots: 90 days.
- Implement data deletion per GDPR requirements upon user request.

## 7. Data Model & Schemas (Detailed)

Schemas below use simplified field types. Implement in PostgreSQL (Supabase) with necessary indexes.

### users

- id: uuid (PK)
- oauth_provider: varchar
- oauth_id: varchar
- display_name: varchar
- email: varchar
- avatar_initial: varchar(1)
- github_token_encrypted: text
- preferences: jsonb
- created_at: timestamptz

### workspaces

- id: uuid (PK)
- owner_id: uuid (FK users.id)
- name: varchar
- description: text
- repo_url: varchar
- imported_branch: varchar
- visibility: varchar ('private'|'public')
- created_at: timestamptz
- last_active: timestamptz

### files

- id: uuid (PK)
- workspace_id: uuid (FK)
- path: text
- filename: varchar
- contents: text (or store in object storage with pointer)
- creator_user_id: uuid
- created_at: timestamptz
- is_locked_in_main: boolean
- last_commit_sha: varchar

### sessions

- id: uuid (PK)
- workspace_id: uuid (FK)
- session_token: varchar
- started_at: timestamptz
- expires_at: timestamptz
- active_users: jsonb (list of user ids)

### branches

- id: uuid
- workspace_id: uuid
- name: varchar
- latest_sha: varchar
- commits: jsonb

### presence

- id: uuid
- session_id: uuid
- user_id: uuid
- file_id: uuid
- cursor_position: jsonb
- selection_range: jsonb
- last_active: timestamptz

### permissions

- id: uuid
- workspace_id: uuid
- user_id: uuid
- role: varchar ('owner'|'editor'|'viewer')

### ai_requests

- id: uuid
- session_id: uuid
- user_id: uuid
- prompt_hash: varchar
- prompt: text
- response: text
- model_used: varchar
- latency_ms: int
- created_at: timestamptz

Ensure appropriate foreign keys and indexes on `workspace_id`, `user_id`, and `last_active`.

## 8. API Specification (Selected Endpoints)

Use REST for MVP. Future: GraphQL optional.

**Auth**

- `GET /auth/oauth/github` - redirect to GitHub OAuth
- `POST /auth/oauth/callback` - handle callback and create user record
- `GET /user/me` - return current user

**Workspaces**

- `POST /workspaces` - create workspace (body: name, description, visibility)
- `POST /workspaces/import` - import GitHub repo (body: repo_url, branch)
- `GET /workspaces/:id` - workspace metadata
- `GET /workspaces/:id/files` - list files

**Files & Editing**

- `GET /files/:id` - fetch file contents
- `POST /files/:id` - save file snapshot (server-side snapshot/backup)
- `GET /files/:id/history` - list snapshots

**Realtime**

- `ws://<y-websocket>/` or `wss://` - Yjs websocket endpoint for CRDT sync
- `POST /sync/:workspaceId/yjs` - optional server endpoint for snapshots

**Git & Branching**

- `POST /workspaces/:id/push` - push selected files to GitHub main (body: files[], commit_message)
- `POST /workspaces/:id/undo_push` - undo first push (only if eligible)

**AI**

- `POST /ai/query` - body: { workspace_id, file_id, selection, prompt_type, user_id }

  - returns: { suggestions[], explanation, tests[] }

**Invite & Sharing**

- `POST /workspaces/:id/invite` - create invite link or invite GitHub username
- `GET /share/:token` - view-only session

## 9. Error Handling & Reliability Patterns

- **Retries:** client-side exponential backoff for transient network errors.
- **Circuit Breaker:** wrap external model providers and GitHub API calls.
- **Fallbacks:** if AI provider fails, show cached suggestions or friendly error and allow continued editing.
- **Monitoring:** track API error rates, latency, socket disconnects.

## 10. Operational Considerations & DevOps

- **CI/CD:** GitHub Actions to build frontend and deploy to Netlify and backend to chosen host.
- **Secrets management:** Netlify & backend host secrets; for local dev use `.env` files and `.env.example`.
- **Backups:** nightly DB backups (automated by Supabase) and file snapshot retention policy.
- **Observability:** use Sentry for frontend errors; Prometheus or hosted metrics for backend.

## 11. Acceptance Criteria & Test Cases (MVP)

- **Auth:** Sign-in with GitHub creates user and stores encrypted token.
- **Editor:** Two users join same workspace and edit same file; changes sync within 250ms.
- **Limit:** Attempting to have 6th editor on same file results in viewer mode.
- **AI:** `POST /ai/query` with small local model returns a completion; inline "Apply" updates file contents.
- **Git push:** Push to main creates commit visible in user's GitHub repository.
- **Undo push:** Undo allowed only for first push if no subsequent pushes.
- **Theme:** User can change theme and audio toggles apply locally without affecting others.

## 12. Milestone Roadmap

- Week 0–1: core POCs (Monaco+Yjs, OAuth integration)
- Week 2–3: collaborative editing UX & presence UI
- Week 4: GitHub import & push flow
- Week 5–6: AI assistant POC & integrated linters (Prettier/ESLint)
- Week 7: session persistence, share links, roles
- Week 8: polish, CI/CD, Netlify deploy, documentation

## 13. Risks, Assumptions & Open Questions

- **Resource constraints for AI** — free open-source models may be limited; document run-local instructions.
- **y-websocket scaling** — consider P2P fallback (y-webrtc) for small groups.
- **GitHub API rate limiting** — implement batching & handle errors gracefully.
- **Legal:** cannot integrate paid IDEs (WebStorm/Rider) directly; provide "Open in IDE" instructions.

Open questions:

- Do you want workspace & file encryption by default? (E2E increases complexity)
- Which provider for backend long-running sockets would you prefer for MVP? (Railway, Render, Supabase Edge?)

## 14. Appendix — Security Checklist (Actionable Items)

1. **Transport Security**: Enforce HTTPS/WSS; HSTS header.
2. **OAuth Scopes**: Request minimal scopes from GitHub (e.g., `repo` only when needed); offer fine-grained permissions prompt.
3. **Token Storage**: Encrypt GitHub tokens at rest using KMS or platform secrets. Do not store plaintext.
4. **CSRF**: Use CSRF tokens for state-changing endpoints and validate Origin/Referer headers.
5. **CORS**: Whitelist Netlify frontend origin(s) and block other domains.
6. **Rate Limiting**: Implement per-IP and per-user rate limits for AI endpoints and push endpoints.
7. **Secrets Detection**: Run a preflight check on code being sent to external models to detect secrets (simple regex for `AKIA|-----BEGIN PRIVATE KEY-----`).
8. **Permissions**: Validate server-side that user has `editor` role before accepting edits.
9. **Dependency Scanning**: Integrate Snyk or GitHub Dependabot alerts; run on CI.
10. **Audit Logs**: Record push events, login attempts, and AI calls for at least 90 days.
11. **Backup & Recovery**: Periodic DB backups; retention 90 days.
12. **Penetration Test**: Plan for light pentest before public demo (OWASP Top 10 check).

---

## 14. Skills & Design Assets

<!-- updated by Claude — 2024-12-28 — added skills reference section -->

LEGGOOO ships with a curated library of **skill packs** containing design patterns, templates, and reference implementations. These are stored in `docs/skills/` and indexed in [README_skills_index.md](README_skills_index.md).

### Key Skill Categories

| Category           | Skills                                                          | Purpose                                |
| ------------------ | --------------------------------------------------------------- | -------------------------------------- |
| **Accessibility**  | `a11y-for-editors`, `motion-reduction`                          | WCAG compliance, screen reader support |
| **Theming**        | `tailwind-theming`, `theme-switching`, `tailwind-design-system` | 6 theme modes, CSS variables           |
| **Editor**         | `editor-integration`, `vscode-extensions`                       | Monaco + Yjs setup, LSP patterns       |
| **Animation**      | `animations-framer-motion`, `motion-reduction`                  | Performant, accessible animations      |
| **Infrastructure** | `ci-templates`, `docker-compose-dev`, `code-server`             | CI/CD, containerization                |

### Scripts

```bash
# Index all ZIP archives (generates INDEX.txt)
./scripts/index_skills.sh

# Extract skill packs
./scripts/unpack_skills.sh
```

See [README_skills_index.md](README_skills_index.md) for full inventory.

---

_End of PRD (PRD.md)_
