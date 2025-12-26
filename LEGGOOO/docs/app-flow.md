# LEGGOOO — App Flow Document (Lucidchart-ready)

**Purpose:** Map user journeys and system flows for LEGGOOO, designed for direct translation into Lucidchart swimlanes and diagram blocks.

---

## High-level spine (top of diagram)

Landing Page → OAuth Login → Dashboard → Create/Import Workspace → Collaborative Coding Session → AI Assistance (parallel) → Push to GitHub → Session End / Share / Resume

---

## Swimlane suggestions

- **User** (actions initiated by the user)
- **Frontend System** (UI reactions, local state)
- **Realtime Layer** (Yjs / y-websocket)
- **AI Layer** (local model or hosted provider)
- **Backend / API** (Auth, GitHub push, snapshots)

---

## Node details (each map to a Lucidchart rectangle)

### 1. Landing Page

- Display mission, features, and quick "Sign in" buttons.
- Actions: Sign in with GitHub, Sign in with Google, View Public Session (via link).

**Decision:** Sign-in clicked? → OAuth flow; else stay.

### 2. OAuth Flow

- Redirect to provider
- Provider authenticates and redirects back with code
- Server exchanges code for token, saves encrypted token, creates/fetches user, and redirects to Dashboard

**Decision:** Auth success? → Dashboard; Auth fail? → Back to Landing Page

### 3. Dashboard

- Options: Create Workspace, Import GitHub Repo, Join via Link, Recent Workspaces, Settings

**Decision:** User selects action → go to corresponding flow

### 4. Create Workspace

- Input: workspace name, visibility, default language
- Backend: create workspace row, create temp branch pointer
- Redirect: open session

### 5. Import GitHub Repo

- Input: repo URL, branch select
- Backend: clone via GitHub API into server storage or snapshot files into Postgres/Supabase Storage
- Redirect: open session

### 6. Open Collaborative Session (Core)

- UI: File tree (left), Editor (center), AI pane & presence (right)
- Frontend: initialize Monaco.
- Realtime Layer: connect to y-websocket with workspaceId
- Backend: create session record

**Events:**

- User opens file → fetch file contents
- Presence update → broadcast to session participants
- Cursor movement → broadcast via Yjs

**Constraint:** Max 5 editors per file. If exceeded, set role to Viewer.

### 7. AI Assistant (Parallel)

- Trigger: user selects text or types prompt in AI pane
- Frontend: send `/ai/query` with context
- AI Layer: local inference or hosted call
- Response: suggestions, explanation, or tests
- Action: user chooses Apply/Ignore

### 8. Push to GitHub

- User clicks Push → select files & compose commit message
- Frontend sends request to backend `POST /workspaces/:id/push`
- Backend validates permissions, constructs commit, calls GitHub API with user-scoped token
- On success: update `files.is_locked_in_main` and `branches.latest_sha`

**Decision:** Was this the first push? If yes, allow `undo_push` option until another push occurs.

### 9. Invite & Share

- Generate invite link (view/edit) or invite GitHub username
- On click, new user lands on `GET /share/:token` view or is added to workspace

### 10. Theme & Audio

- Theme changes applied client-side only
- Audio toggles per-user and does not propagate to others

### 11. Session End & Resume

- User leaves → update presence; session persists
- Resuming loads latest temp branch snapshot

---

## Decision diamonds (examples to include in Lucidchart)

- Auth success? (Yes/No)
- Imported repo accessible? (Yes/No)
- Editor slots available? (Yes/No)
- AI model available locally? (Yes/No)
- Push to GitHub successful? (Yes/No)

---

## Error paths & recovery

- OAuth token failure → re-auth prompt
- Realtime disconnection → retry with exponential backoff and alert user
- AI provider fail → show friendly error and allow offline editing
- GitHub push failure → show error with suggested remediation (token scope, rate limit)

---

## Useful Lucidchart layout tips

- Use swimlanes to keep User, Frontend, Realtime, AI, Backend organized
- Keep the AI lane parallel (dashed box) since it can be invoked at any time
- Group Git flows (Import, Push, Undo) into a "Version Control" cluster for clarity

---

_End of App Flow Document (app-flow.md)_
