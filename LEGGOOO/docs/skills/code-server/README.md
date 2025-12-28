# Code Server

> Skill pack for deploying browser-based VS Code instances and agent-native architecture patterns.

## Contents

| File                                  | Description                                                      |
| ------------------------------------- | ---------------------------------------------------------------- |
| `agent-native-architecture.zip`       | Architecture patterns for AI-integrated development environments |
| `agent-native-architecture.INDEX.txt` | Auto-generated listing of ZIP contents                           |

## Overview

This skill pack covers:

- code-server deployment and configuration
- Agent-native IDE architecture patterns
- Browser-based development environment setup
- Remote development workflows

## LEGGOOO Relevance

While LEGGOOO uses Monaco Editor directly (not code-server), these patterns inform:

- **Extension-like plugin architecture** — How to structure AI assistant integration
- **Remote workspace management** — Patterns for cloud-based file systems
- **Terminal emulation** — xterm.js integration patterns
- **Language server protocol** — LSP client implementation

## Agent-Native Architecture Concepts

### Core Principles

1. **AI-First UX** — Design interactions assuming AI assistance is primary
2. **Context Awareness** — Maintain rich context for AI suggestions
3. **Interruptible Workflows** — Allow AI to suggest changes at any point
4. **Transparent Actions** — Show what AI is doing/planning

### Architecture Layers

```
┌─────────────────────────────────────────┐
│           UI Layer (React)              │
├─────────────────────────────────────────┤
│      Agent Orchestration Layer          │
│   (tool routing, context management)    │
├─────────────────────────────────────────┤
│         Tool Execution Layer            │
│  (file ops, terminal, LSP, search)      │
├─────────────────────────────────────────┤
│        Workspace Abstraction            │
│    (local FS, remote FS, virtual FS)    │
└─────────────────────────────────────────┘
```

## Deployment Options

| Option       | Use Case               |
| ------------ | ---------------------- |
| Local Docker | Development/testing    |
| Fly.io       | Single-user remote dev |
| Railway      | Team deployment        |
| Self-hosted  | Enterprise/air-gapped  |

## Related Skills

- [docker-compose-dev](../docker-compose-dev/) — Container setup
- [vscode-extensions](../vscode-extensions/) — Extension development patterns

---

_Skill pack for LEGGOOO collaborative IDE_
