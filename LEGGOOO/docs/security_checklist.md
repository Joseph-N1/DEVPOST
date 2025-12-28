<!-- created by Claude — 2025-12-28 -->

# LEGGOOO — Security Checklist

**Purpose:** Prioritized, actionable security checklist for LEGGOOO. Use this as a pre-launch and operational checklist. Where possible, the checklist gives copy/paste-ready commands or config snippets (free-first).

---

## Overview

This checklist is split into Priority A (must do before public demo), Priority B (before open beta), and Priority C (post-beta). Each item includes: rationale, suggested free-first tools, and concrete implementation snippets or commands.

---

## Priority A — Must do before public demo

These items must be implemented before showing LEGGOOO to external users.

### 1. TLS for all endpoints (HTTPS / WSS)

**Rationale:** Protects data-in-transit and prevents man-in-the-middle attacks.
**Tools:** Netlify (frontend TLS managed), Railway/Render HTTPS, Cloudflare (free tier) for additional protection.

**Example:** Netlify handles TLS automatically for the frontend. For a custom backend behind a reverse proxy (nginx) use:

```nginx
server {
  listen 80;
  server_name api.example.com;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl;
  server_name api.example.com;
  ssl_certificate /etc/letsencrypt/live/api.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;
  # strong TLS options omitted for brevity
  location / { proxy_pass http://127.0.0.1:3000; }
}
```

**How to test:** `curl -I https://api.example.com` → expect `HTTP/2 200` and certificate details in a browser.

---

### 2. Encrypt GitHub tokens at rest (and minimize scope)

**Rationale:** Tokens give repo access; if leaked they can be abused.
**Tools:** Platform secret stores (Railway secrets, Netlify environment variables), or database-level encryption.

**Node.js example (AES-GCM):**

```js
// encrypt
const crypto = require("crypto");
const ALGO = "aes-256-gcm";
function encrypt(text, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}
// decrypt similar
```

**Implementation note:** Prefer storing the GitHub token in the host's secret store and encrypt at application level where platform secrets aren't available.

**How to test:** Attempt to read stored token from DB without KMS key — should be encrypted unreadable string.

---

### 3. JWT best practices & rotation

**Rationale:** Protect sessions and limit blast radius for stolen tokens.
**Implementation:** Short-lived access tokens (e.g., 15 min) + refresh tokens with revocation list.

**Snippet (jsonwebtoken):**

```js
const jwt = require("jsonwebtoken");
const ACCESS_TTL = "15m";
const REFRESH_TTL = "30d";
const access = jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_TTL });
```

**Rotate:** Keep a server-side refresh token blacklist (Redis) to revoke tokens.

---

### 4. Rate-limiting (AI & Git push endpoints)

**Rationale:** Prevent abuse and runaway costs when calling LLMs.
**Tools:** `express-rate-limit`, Upstash (Redis) for distributed limits.

**Example (express-rate-limit):**

```js
const rateLimit = require("express-rate-limit");
const aiLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  message: "Too many AI requests",
});
app.use("/ai/query", aiLimiter);
```

**How to test:** Send >10 requests in a minute and expect `429`.

---

### 5. Secret-scanning before sending code to external LLMs

**Rationale:** Avoid leaking API keys or secrets to third-party LLMs.
**Tools:** Simple regex preflight; gitleaks for repo scans.

**Example preflight (node):**

```js
const secretPatterns = [/AKIA[A-Z0-9]{16}/, /-----BEGIN PRIVATE KEY-----/];
function containsSecret(text) {
  return secretPatterns.some((r) => r.test(text));
}
```

**CI (gitleaks) quick run:**

```bash
# install gitleaks then
gitleaks detect --source=. --report=gitleaks-report.json
```

**How to test:** Create a test snippet containing `AKIA...` and ensure it triggers blocking behavior before `/ai/query` forwards content.

---

### 6. Server-side RBAC & permission checks (push/edit endpoints)

**Rationale:** Enforce least privilege—do not trust client roles.

**Express middleware snippet:**

```js
function requireRole(role) {
  return (req, res, next) => {
    const userRole = req.user.role;
    if (userRole === role || userRole === "owner") return next();
    return res.status(403).json({ error: "forbidden" });
  };
}
app.post("/workspaces/:id/push", requireRole("editor"), pushHandler);
```

**How to test:** Attempt push with a viewer token and expect `403`.

---

### 7. CSRF & CORS

**Rationale:** Prevent cross-site request forgery and control origins.
**CORS example (express):**

```js
const cors = require("cors");
app.use(cors({ origin: ["https://your-netlify-site.netlify.app"] }));
```

**CSRF example:** When using cookie-based auth, enable CSRF tokens (csrf package).

---

### 8. Automated accessibility checks in CI (axe + Playwright)

**Rationale:** Maintain accessibility standards across changes.

**Playwright + axe example:**

```js
// run in Playwright test
import AxeBuilder from "@axe-core/playwright";
const results = await new AxeBuilder({ page }).analyze();
expect(results.violations).toEqual([]);
```

**How to test:** CI should fail if critical violations found.

---

### 9. Backups & snapshot retention

**Rationale:** Recover from data loss; snapshots of Yjs docs are essential.
**Tools:** Supabase managed backups + store Yjs snapshots in Supabase Storage.

**Retention suggestion:** daily snapshot, retention 90 days for workspace snapshots.

**How to test:** Restore snapshot into staging and verify editor state recovery.

---

## Priority B — Before open beta

These are important but can follow after priority A is in place.

- Dependency scanning (Dependabot, Snyk) — enable auto PRs.
- WAF (Cloudflare free rules) — block common bots.
- Audit logging and long-term retention for push events (store in DB table `audit_logs`).
- Enforce least privileged OAuth scopes for GitHub (request only `repo` when needed).

**CI snippet (Dependabot):** enable via GitHub settings or `.github/dependabot.yml`.

---

## Priority C — Post-beta / long-term

- End-to-end encryption option for private workspaces (client-side encryption of Yjs updates).
- Periodic pentests and formal security audit.
- Advanced secret detection in CI (custom heuristics + machine learning).

---

## Implementation Steps (top 5 actions)

1. **TLS:** Ensure Netlify TLS and backend TLS. Test with `curl -I https://<host>`.
2. **Secrets:** Move GitHub tokens to host secret store; add encryption at rest for DB fields.
3. **Rate limits:** Add `express-rate-limit` to `/ai/query` and `/workspaces/:id/push`.
4. **Secret preflight:** Implement `containsSecret()` check before `/ai/query` forwards content. Block & log.
5. **CI checks:** Add Playwright + axe check and gitleaks step in GitHub Actions.

---

## Quick Commands & CI snippets

**Run gitleaks on repo:**

```bash
curl -sSfL https://raw.githubusercontent.com/zricethezav/gitleaks/master/install.sh | bash
./gitleaks detect --source=. --report=gitleaks-report.json
```

**Add Playwright + axe step (GitHub Actions snippet):**

```yaml
- name: Run accessibility tests
  run: npx playwright test tests/a11y.spec.ts
```

**Express Rate Limit (add to app startup):**

```js
app.use("/ai/query", aiLimiter);
app.use("/workspaces/:id/push", pushLimiter);
```

---

## How to test (6 quick tests)

1. **TLS check:** `curl -I https://<api-host>` → verify TLS cert and no redirect loops.
2. **Token encryption:** read token from DB via psql; confirm it's encrypted (not plain text).
3. **Role enforcement:** use a viewer account to POST `/workspaces/:id/push` and expect `403`.
4. **Rate limit:** call `/ai/query` 15 times within a minute and expect `429` after configured threshold.
5. **Secret preflight:** send code with `-----BEGIN PRIVATE KEY-----` to `/ai/query` and ensure the request is blocked.
6. **Accessibility CI:** run Playwright & axe locally: `npx playwright test tests/a11y.spec.ts` and ensure violations are zero or accepted.

---

## Notes & Next Steps

- Add documentation for token encryption key rotation (use KMS or rotate at host secrets level).
- Before enabling hosted LLMs with user-provided keys, create clear UI and logging for LLM request consent.
- Consider adding an incident response playbook (for credential compromise) as a separate doc.

---

_End of `docs/security_checklist.md`_
