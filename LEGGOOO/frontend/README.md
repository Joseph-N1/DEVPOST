# LEGGOOO Frontend

> React + Vite + Monaco Editor + Yjs collaborative editor

## Tech Stack

- **React 18** — UI framework
- **Vite 5** — Build tool & dev server
- **TypeScript** — Type safety
- **Monaco Editor** — Code editor (VS Code engine)
- **Yjs + y-monaco** — CRDT for real-time collaboration
- **Tailwind CSS v4** — Styling
- **Framer Motion** — Animations
- **Zustand** — State management
- **Supabase** — Auth & backend client

## Development

```bash
# From project root
pnpm dev:frontend

# Or from this directory
pnpm dev
```

## Project Structure

```
frontend/
├── src/
│   ├── components/       # React components
│   │   ├── editor/       # Monaco editor components
│   │   ├── layout/       # Shell, sidebar, panels
│   │   ├── ai/           # AI assistant pane
│   │   └── ui/           # Shared UI components
│   ├── hooks/            # Custom React hooks
│   ├── stores/           # Zustand stores
│   ├── lib/              # Utilities, API clients
│   ├── styles/           # Global styles, theme CSS
│   ├── types/            # TypeScript types
│   ├── App.tsx
│   └── main.tsx
├── public/               # Static assets
├── tests/                # Playwright e2e tests
│   ├── e2e/
│   └── a11y/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## Key Components

| Component | Purpose |
|-----------|---------|
| `EditorPane` | Monaco editor with Yjs binding |
| `FileTree` | Workspace file explorer |
| `AIPane` | AI assistant chat interface |
| `PresenceBar` | Collaborator avatars & cursors |
| `ThemeToggle` | Theme switcher (6 modes) |

## Environment Variables

Create `.env` in frontend root (or use root `.env`):

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:3000
VITE_YWS_URL=wss://your-yws-server.railway.app
```

## Testing

```bash
# Unit tests
pnpm test

# E2E tests (requires dev server running)
pnpm test:e2e

# Accessibility tests
pnpm test:a11y
```

## Build

```bash
pnpm build
# Output: dist/
```

Deploy `dist/` to Netlify or any static host.
