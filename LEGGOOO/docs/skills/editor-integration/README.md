# Editor Integration (editor-integration)

> **Skill Name:** `editor-integration` > **Description:** Patterns for integrating Monaco Editor with Yjs CRDT for real-time collaboration, plus CodeMirror alternatives and Language Server Protocol support.

---

## Purpose

This skill provides implementation patterns for LEGGOOO's core editor functionality—embedding Monaco Editor, enabling real-time collaborative editing via Yjs, and optionally supporting Language Server Protocol (LSP) for intelligent code features.

## When to Use This Skill

- Setting up Monaco Editor in a React application
- Implementing real-time collaborative editing with Yjs
- Adding language server features (autocomplete, diagnostics)
- Evaluating CodeMirror as an alternative
- Ensuring editor accessibility compliance

## Prerequisites

- React 18+ with Vite
- Understanding of CRDTs (Conflict-free Replicated Data Types)
- Familiarity with WebSocket connections
- Node.js backend for y-websocket server

## Tech Stack Alignment

Per LEGGOOO's [tech_stack_overview.md](../../tech_stack_overview.md):

- **Editor:** Monaco Editor (VS Code's editor)
- **CRDT:** Yjs with y-monaco binding
- **Sync:** y-websocket for real-time updates
- **Optional:** monaco-languageclient for LSP features

## Related Files

- [monaco-setup.md](./monaco-setup.md) — Basic Monaco integration
- [y-monaco-example.md](./y-monaco-example.md) — Yjs collaborative binding
- [monaco-languageclient.md](./monaco-languageclient.md) — LSP integration
- [codemirror-alternative.md](./codemirror-alternative.md) — CodeMirror 6 option
- [editor-a11y-notes.md](./editor-a11y-notes.md) — Accessibility considerations

## Resources

- [Monaco Editor Docs](https://microsoft.github.io/monaco-editor/)
- [Yjs Documentation](https://docs.yjs.dev/)
- [y-monaco GitHub](https://github.com/yjs/y-monaco)
- [y-websocket](https://github.com/yjs/y-websocket)
