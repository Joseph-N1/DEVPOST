# VS Code Extensions

> Skill pack for VS Code extension development patterns and debugging tools.

## Contents

| File                          | Description                                  |
| ----------------------------- | -------------------------------------------- |
| `vscode-extension.zip`        | Extension development templates and patterns |
| `vscode-bug-hunter.zip`       | Debugging and issue detection utilities      |
| `vscode-extension.INDEX.txt`  | Auto-generated listing of ZIP contents       |
| `vscode-bug-hunter.INDEX.txt` | Auto-generated listing of ZIP contents       |

## Overview

This skill pack provides patterns for:

- VS Code extension architecture
- Language Server Protocol (LSP) implementation
- Custom editor providers
- Debugging extension development
- Extension testing strategies

## LEGGOOO Relevance

While LEGGOOO is a standalone web IDE (not a VS Code extension), these patterns inform:

- **Monaco Editor customization** — Monaco shares APIs with VS Code
- **Language features** — LSP patterns apply to Monaco's language client
- **Custom views** — Panel and sidebar architecture patterns
- **Keybinding systems** — Command palette and shortcuts

## Key Concepts

### Extension Activation

```typescript
// Lazy activation based on file types
"activationEvents": [
  "onLanguage:typescript",
  "onLanguage:javascript",
  "workspaceContains:**/*.ts"
]
```

### Command Registration

```typescript
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "extension.helloWorld",
    () => {
      vscode.window.showInformationMessage("Hello World!");
    }
  );
  context.subscriptions.push(disposable);
}
```

### Language Server Integration

```typescript
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
} from "vscode-languageclient/node";

const serverOptions: ServerOptions = {
  run: { module: serverModule, transport: TransportKind.ipc },
  debug: { module: serverModule, transport: TransportKind.ipc },
};

const clientOptions: LanguageClientOptions = {
  documentSelector: [{ scheme: "file", language: "typescript" }],
};

const client = new LanguageClient(
  "languageServer",
  "Language Server",
  serverOptions,
  clientOptions
);

client.start();
```

## Monaco Editor Parallels

| VS Code API                                       | Monaco Equivalent                                 |
| ------------------------------------------------- | ------------------------------------------------- |
| `vscode.languages.registerCompletionItemProvider` | `monaco.languages.registerCompletionItemProvider` |
| `vscode.languages.registerHoverProvider`          | `monaco.languages.registerHoverProvider`          |
| `vscode.commands.registerCommand`                 | `monaco.editor.addCommand`                        |
| `vscode.workspace.onDidChangeTextDocument`        | `editor.onDidChangeModelContent`                  |

## Related Skills

- [editor-integration](../editor-integration/) — Monaco Editor setup
- [code-server](../code-server/) — Browser-based VS Code

---

_Skill pack for LEGGOOO collaborative IDE_
