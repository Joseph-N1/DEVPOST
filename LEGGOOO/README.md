# LEGGOOO

> Real-Time Collaborative Coding IDE with AI Assistant

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

## Overview

LEGGOOO is a browser-based collaborative coding IDE designed for small teams (2–5 members). It combines real-time editing powered by Monaco Editor and Yjs CRDT with an AI assistant (local-first, open-source models) and seamless GitHub integration.

### Key Features

- **Real-time Collaboration** — Multiple cursors, live sync via Yjs CRDT
- **Monaco Editor** — VS Code-grade editing experience in the browser
- **AI Assistant** — Local-first (GPT4All, CodeLlama) with optional cloud fallback
- **GitHub Integration** — Import repos, push commits directly
- **6 Theme Modes** — Light, dark, high-contrast, and custom themes
- **Accessibility-First** — WCAG 2.1 AA compliant, reduced-motion support

## Quick Start

### Prerequisites

- Node.js >= 18
- pnpm (recommended) or npm
- Python 3.11+ (for AI microservice, optional)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/leggooo.git
cd leggooo

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Start development servers
pnpm dev
```

### Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Y-websocket server
YWS_URL=wss://your-yws-server.railway.app

# AI Service (optional)
AI_BASE_URL=http://localhost:8000
OPENAI_API_KEY=sk-...  # Optional fallback
```

## Project Structure

```
leggooo/
├── frontend/          # React + Vite + Monaco Editor
├── backend/           # Node.js API (Express/Fastify)
├── ai/                # Python FastAPI AI microservice
├── infra/             # Docker, deployment configs
├── docs/              # Documentation & design specs
│   ├── PRD.md
│   ├── plan.md
│   ├── tech_stack_overview.md
│   ├── ui_guidelines.md
│   ├── app-flow.md
│   ├── security_checklist.md
│   ├── README_skills_index.md
│   └── skills/        # Design patterns & templates
└── scripts/           # Utility scripts
```

## Documentation

| Document | Description |
|----------|-------------|
| [PRD](docs/PRD.md) | Product Requirements Document |
| [Plan](docs/plan.md) | Sprint plan & tickets |
| [Tech Stack](docs/tech_stack_overview.md) | Architecture & API specs |
| [UI Guidelines](docs/ui_guidelines.md) | Design system & components |
| [App Flow](docs/app-flow.md) | User journey diagrams |
| [Security](docs/security_checklist.md) | Security checklist |
| [Skills Index](docs/README_skills_index.md) | Design pattern library |

## Development

### Scripts

```bash
# Development
pnpm dev              # Start all services
pnpm dev:frontend     # Start frontend only
pnpm dev:backend      # Start backend only

# Testing
pnpm test             # Run all tests
pnpm test:e2e         # Run Playwright e2e tests
pnpm test:a11y        # Run accessibility tests

# Build
pnpm build            # Build all packages
pnpm build:frontend   # Build frontend for production

# Utilities
pnpm lint             # Lint all packages
pnpm format           # Format with Prettier
```

### Skills Library

The `docs/skills/` directory contains design patterns and reference implementations:

```bash
# Index all skill ZIP archives
./scripts/index_skills.sh      # Bash
.\scripts\index_skills.ps1     # PowerShell

# Extract skill packs (when ready)
./scripts/unpack_skills.sh     # Bash
.\scripts\unpack_skills.ps1    # PowerShell
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite 5, TypeScript, Tailwind CSS v4 |
| Editor | Monaco Editor, y-monaco, y-websocket |
| Backend | Node.js 18+, Express/Fastify, TypeScript |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (GitHub, Google OAuth) |
| AI | FastAPI, GPT4All/CodeLlama (local-first) |
| Hosting | Netlify (frontend), Railway/Render (backend) |

## Contributing

1. Create a feature branch: `feature/<ticket-id>-short-desc`
2. Make changes and write tests
3. Submit PR to `dev` branch
4. After CI passes, merge to `main`

See [CLAUDE_BUILD_PROMPT.txt](CLAUDE_BUILD_PROMPT.txt) for detailed build instructions.

## License

MIT © LEGGOOO Team

---

*Built with ❤️ for collaborative coding*
