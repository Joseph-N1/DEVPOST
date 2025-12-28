# Yjs + Monaco Collaborative Editing

> Real-time collaborative editing with Yjs CRDT and Monaco Editor.

---

## Installation

```bash
npm install yjs y-monaco y-websocket
```

## Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Client A   │     │  y-websocket│     │  Client B   │
│  Monaco     │◄───►│   Server    │◄───►│  Monaco     │
│  + y-monaco │     │             │     │  + y-monaco │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       └───────────────────┴───────────────────┘
                    Yjs CRDT Sync
```

---

## Basic Implementation

### Collaborative Editor Component

```tsx
// components/CollaborativeEditor.tsx
import { useEffect, useRef } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import Editor, { OnMount } from "@monaco-editor/react";
import { editor } from "monaco-editor";

interface CollaborativeEditorProps {
  roomId: string;
  username: string;
  userColor: string;
}

export function CollaborativeEditor({
  roomId,
  username,
  userColor,
}: CollaborativeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const docRef = useRef<Y.Doc | null>(null);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Create Yjs document
    const doc = new Y.Doc();
    docRef.current = doc;

    // Connect to WebSocket server
    const provider = new WebsocketProvider(
      "ws://localhost:1234", // Your y-websocket server
      roomId,
      doc
    );
    providerRef.current = provider;

    // Set user awareness (cursor, selection)
    provider.awareness.setLocalStateField("user", {
      name: username,
      color: userColor,
    });

    // Get shared text type
    const yText = doc.getText("monaco");

    // Create Monaco binding
    const binding = new MonacoBinding(
      yText,
      editor.getModel()!,
      new Set([editor]),
      provider.awareness
    );
    bindingRef.current = binding;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      bindingRef.current?.destroy();
      providerRef.current?.disconnect();
      docRef.current?.destroy();
    };
  }, []);

  return (
    <Editor
      height="100%"
      defaultLanguage="typescript"
      theme="vs-dark"
      onMount={handleMount}
      options={{
        automaticLayout: true,
      }}
    />
  );
}
```

---

## y-websocket Server

### Basic Server Setup

```typescript
// server/websocket.ts
import { WebSocketServer } from "ws";
import { setupWSConnection } from "y-websocket/bin/utils";

const wss = new WebSocketServer({ port: 1234 });

wss.on("connection", (ws, req) => {
  setupWSConnection(ws, req);
});

console.log("y-websocket server running on ws://localhost:1234");
```

### With Express Integration

```typescript
// server/index.ts
import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { setupWSConnection } from "y-websocket/bin/utils";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
  setupWSConnection(ws, req, {
    gc: true, // Enable garbage collection
  });
});

// REST API routes
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

server.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});
```

---

## Awareness (Cursors & Presence)

### Cursor Styles

```css
/* styles/collaborative-cursors.css */

/* Remote cursor caret */
.yRemoteSelection {
  background-color: var(--cursor-color, #ff0000);
  opacity: 0.3;
}

/* Remote cursor caret line */
.yRemoteSelectionHead {
  position: absolute;
  border-left: 2px solid var(--cursor-color, #ff0000);
  height: 100%;
}

/* Cursor label */
.yRemoteSelectionHead::after {
  content: attr(data-username);
  position: absolute;
  top: -1.2em;
  left: 0;
  background: var(--cursor-color, #ff0000);
  color: white;
  padding: 2px 6px;
  font-size: 11px;
  border-radius: 3px;
  white-space: nowrap;
}
```

### Awareness Hook

```tsx
// hooks/useAwareness.ts
import { useEffect, useState } from "react";
import { WebsocketProvider } from "y-websocket";

interface AwarenessUser {
  clientId: number;
  name: string;
  color: string;
  cursor?: { line: number; column: number };
}

export function useAwareness(provider: WebsocketProvider | null) {
  const [users, setUsers] = useState<AwarenessUser[]>([]);

  useEffect(() => {
    if (!provider) return;

    const awareness = provider.awareness;

    const updateUsers = () => {
      const states = awareness.getStates();
      const userList: AwarenessUser[] = [];

      states.forEach((state, clientId) => {
        if (state.user && clientId !== awareness.clientID) {
          userList.push({
            clientId,
            ...state.user,
          });
        }
      });

      setUsers(userList);
    };

    awareness.on("change", updateUsers);
    updateUsers();

    return () => {
      awareness.off("change", updateUsers);
    };
  }, [provider]);

  return users;
}
```

### Presence Indicator Component

```tsx
// components/PresenceIndicator.tsx
import { useAwareness } from "../hooks/useAwareness";

export function PresenceIndicator({ provider }) {
  const users = useAwareness(provider);

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-800">
      <span className="text-sm text-gray-400">{users.length + 1} online</span>
      <div className="flex -space-x-2">
        {users.map((user) => (
          <div
            key={user.clientId}
            className="w-8 h-8 rounded-full border-2 border-gray-800 flex items-center justify-center text-xs font-medium"
            style={{ backgroundColor: user.color }}
            title={user.name}
          >
            {user.name[0].toUpperCase()}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Persistence

### Save to Database

```typescript
// server/persistence.ts
import * as Y from "yjs";
import { prisma } from "./db";

export async function saveDocument(roomId: string, doc: Y.Doc) {
  const update = Y.encodeStateAsUpdate(doc);

  await prisma.document.upsert({
    where: { roomId },
    update: { content: Buffer.from(update) },
    create: { roomId, content: Buffer.from(update) },
  });
}

export async function loadDocument(roomId: string, doc: Y.Doc) {
  const record = await prisma.document.findUnique({
    where: { roomId },
  });

  if (record) {
    Y.applyUpdate(doc, new Uint8Array(record.content));
  }
}
```

### Periodic Auto-Save

```typescript
// server/autosave.ts
import * as Y from "yjs";

const docs = new Map<string, Y.Doc>();
const saveIntervals = new Map<string, NodeJS.Timeout>();

export function setupAutoSave(roomId: string, doc: Y.Doc) {
  docs.set(roomId, doc);

  // Save every 30 seconds
  const interval = setInterval(async () => {
    await saveDocument(roomId, doc);
  }, 30000);

  saveIntervals.set(roomId, interval);

  // Also save on updates (debounced)
  let saveTimeout: NodeJS.Timeout;
  doc.on("update", () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveDocument(roomId, doc);
    }, 5000);
  });
}
```

---

## Error Handling

```tsx
// components/CollaborativeEditor.tsx (enhanced)
import { useState, useEffect } from 'react';

export function CollaborativeEditor({ roomId, username, userColor }) {
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected'
  >('connecting');

  const handleMount: OnMount = (editor, monaco) => {
    // ... setup code ...

    provider.on('status', ({ status }: { status: string }) => {
      setConnectionStatus(status as any);
    });

    provider.on('connection-error', (error: Error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('disconnected');
    });
  };

  return (
    <div className="relative h-full">
      {/* Connection status indicator */}
      <div className={`absolute top-2 right-2 z-10 flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
        connectionStatus === 'connected'
          ? 'bg-green-500/20 text-green-400'
          : connectionStatus === 'connecting'
          ? 'bg-yellow-500/20 text-yellow-400'
          : 'bg-red-500/20 text-red-400'
      }`}>
        <span className={`w-2 h-2 rounded-full ${
          connectionStatus === 'connected' ? 'bg-green-400' :
          connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
          'bg-red-400'
        }`} />
        {connectionStatus}
      </div>

      <Editor ... />
    </div>
  );
}
```

---

## Complete Example

See the full working example in the LEGGOOO codebase at `frontend/src/components/Editor/CollaborativeEditor.tsx` (once implemented).
