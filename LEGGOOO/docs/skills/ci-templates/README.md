# CI Templates

> Skill pack for GitHub Actions workflows and CI/CD pipeline templates.

## Contents

| File                                 | Description                                                      |
| ------------------------------------ | ---------------------------------------------------------------- |
| `github-actions-templates.zip`       | Reusable workflow templates for testing, building, and deploying |
| `github-actions-templates.INDEX.txt` | Auto-generated listing of ZIP contents                           |

## Overview

This skill pack provides CI/CD templates optimized for:

- React + Vite frontend builds
- Node.js backend testing
- Python FastAPI service testing
- Docker image building
- Netlify deployment automation

## LEGGOOO CI Pipeline

### Recommended Workflow Structure

```
.github/
└── workflows/
    ├── ci.yml           # Main CI (lint, test, build)
    ├── deploy-preview.yml   # PR preview deployments
    ├── deploy-prod.yml      # Production deployment
    └── security.yml         # Dependency scanning
```

### Example: Main CI Workflow

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check

  test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
```

## Secrets Required

| Secret               | Purpose                     |
| -------------------- | --------------------------- |
| `NETLIFY_AUTH_TOKEN` | Deploy to Netlify           |
| `NETLIFY_SITE_ID`    | Target site identifier      |
| `SUPABASE_URL`       | Database connection (tests) |
| `SUPABASE_ANON_KEY`  | Anonymous API key           |

## Related Skills

- [docker-compose-dev](../docker-compose-dev/) — Container orchestration
- [code-server](../code-server/) — Cloud IDE deployment

---

_Skill pack for LEGGOOO collaborative IDE_
