# Monaco Language Client (LSP Integration)

> Adding Language Server Protocol support to Monaco for intelligent code features.

---

## Installation

```bash
npm install monaco-languageclient vscode-languageclient vscode-ws-jsonrpc
```

## Architecture

```
┌──────────────────┐     WebSocket     ┌──────────────────┐
│  Monaco Editor   │◄─────────────────►│  Language Server │
│  + languageclient│                   │  (e.g. TypeScript│
└──────────────────┘                   │   tsserver, etc.)│
                                       └──────────────────┘
```

---

## Basic LSP Setup

### Client Configuration

```typescript
// lsp/client.ts
import { MonacoLanguageClient } from "monaco-languageclient";
import {
  CloseAction,
  ErrorAction,
  MessageTransports,
} from "vscode-languageclient";
import {
  toSocket,
  WebSocketMessageReader,
  WebSocketMessageWriter,
} from "vscode-ws-jsonrpc";

export function createLanguageClient(
  transports: MessageTransports
): MonacoLanguageClient {
  return new MonacoLanguageClient({
    name: "LEGGOOO Language Client",
    clientOptions: {
      documentSelector: ["typescript", "javascript"],
      errorHandler: {
        error: () => ({ action: ErrorAction.Continue }),
        closed: () => ({ action: CloseAction.Restart }),
      },
    },
    connectionProvider: {
      get: () => Promise.resolve(transports),
    },
  });
}

export function connectToLanguageServer(url: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.onopen = () => resolve(ws);
    ws.onerror = reject;
  });
}

export async function startLanguageClient(serverUrl: string) {
  const webSocket = await connectToLanguageServer(serverUrl);
  const socket = toSocket(webSocket);

  const reader = new WebSocketMessageReader(socket);
  const writer = new WebSocketMessageWriter(socket);

  const client = createLanguageClient({ reader, writer });
  client.start();

  return client;
}
```

### Integration with Editor

```tsx
// components/LSPEditor.tsx
import { useEffect, useRef } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { startLanguageClient } from "../lsp/client";
import { MonacoLanguageClient } from "monaco-languageclient";

export function LSPEditor() {
  const clientRef = useRef<MonacoLanguageClient | null>(null);

  const handleMount: OnMount = async (editor, monaco) => {
    // Start LSP client
    try {
      const client = await startLanguageClient("ws://localhost:3001/lsp");
      clientRef.current = client;
    } catch (error) {
      console.error("Failed to connect to language server:", error);
    }
  };

  useEffect(() => {
    return () => {
      clientRef.current?.stop();
    };
  }, []);

  return (
    <Editor
      height="100%"
      defaultLanguage="typescript"
      theme="vs-dark"
      onMount={handleMount}
    />
  );
}
```

---

## Language Server (Backend)

### TypeScript Server Example

````typescript
// server/lsp/typescript-server.ts
import { WebSocketServer } from "ws";
import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeResult,
  TextDocumentSyncKind,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";

export function startTypeScriptServer(wss: WebSocketServer) {
  wss.on("connection", (ws) => {
    const connection = createConnection(ProposedFeatures.all);
    const documents = new TextDocuments(TextDocument);

    connection.onInitialize((): InitializeResult => {
      return {
        capabilities: {
          textDocumentSync: TextDocumentSyncKind.Incremental,
          completionProvider: {
            resolveProvider: true,
            triggerCharacters: [".", '"', "'", "/", "@"],
          },
          hoverProvider: true,
          definitionProvider: true,
          referencesProvider: true,
          documentFormattingProvider: true,
        },
      };
    });

    // Autocomplete
    connection.onCompletion((params) => {
      // Return completion items
      return [
        { label: "console", kind: 6 },
        { label: "document", kind: 6 },
        { label: "window", kind: 6 },
      ];
    });

    // Hover information
    connection.onHover((params) => {
      return {
        contents: {
          kind: "markdown",
          value: "```typescript\nfunction example(): void\n```",
        },
      };
    });

    documents.listen(connection);
    connection.listen();
  });
}
````

---

## Features Provided by LSP

| Feature          | LSP Method                        | Description        |
| ---------------- | --------------------------------- | ------------------ |
| Autocomplete     | `textDocument/completion`         | Code suggestions   |
| Hover            | `textDocument/hover`              | Type info on hover |
| Go to Definition | `textDocument/definition`         | Jump to definition |
| Find References  | `textDocument/references`         | Find all usages    |
| Diagnostics      | `textDocument/publishDiagnostics` | Errors/warnings    |
| Formatting       | `textDocument/formatting`         | Code formatting    |
| Rename           | `textDocument/rename`             | Rename symbol      |
| Code Actions     | `textDocument/codeAction`         | Quick fixes        |

---

## Without LSP (Monaco Built-in)

For simpler setups, Monaco has built-in TypeScript/JavaScript support:

```tsx
// Simple setup without external LSP
import * as monaco from "monaco-editor";

// Configure TypeScript defaults
monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
  target: monaco.languages.typescript.ScriptTarget.ESNext,
  module: monaco.languages.typescript.ModuleKind.ESNext,
  moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
  allowNonTsExtensions: true,
  jsx: monaco.languages.typescript.JsxEmit.React,
  strict: true,
});

// Add type definitions
monaco.languages.typescript.typescriptDefaults.addExtraLib(
  `declare module 'react' { ... }`,
  "file:///node_modules/@types/react/index.d.ts"
);
```

---

## When to Use LSP vs Built-in

| Scenario                   | Recommendation          |
| -------------------------- | ----------------------- |
| TypeScript/JavaScript only | Built-in Monaco support |
| Multiple languages         | LSP                     |
| Custom language            | LSP                     |
| Simple autocomplete        | Built-in                |
| Project-wide analysis      | LSP                     |
| Minimal bundle size        | Built-in                |

For LEGGOOO's MVP, consider starting with Monaco's built-in TypeScript support and adding LSP for other languages later.
