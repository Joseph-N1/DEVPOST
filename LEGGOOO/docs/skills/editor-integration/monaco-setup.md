# Monaco Editor Setup

> Basic Monaco Editor integration for React + Vite projects.

---

## Installation

```bash
npm install monaco-editor @monaco-editor/react
```

## Basic Setup

### Simple Component

```tsx
// components/Editor.tsx
import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  value: string;
  language?: string;
  onChange?: (value: string | undefined) => void;
  readOnly?: boolean;
}

export function CodeEditor({
  value,
  language = "typescript",
  onChange,
  readOnly = false,
}: CodeEditorProps) {
  return (
    <Editor
      height="100%"
      language={language}
      value={value}
      onChange={onChange}
      theme="vs-dark"
      options={{
        readOnly,
        minimap: { enabled: true },
        fontSize: 14,
        lineNumbers: "on",
        wordWrap: "on",
        automaticLayout: true,
        scrollBeyondLastLine: false,
        tabSize: 2,
      }}
    />
  );
}
```

### With Editor Instance Access

```tsx
// components/EditorWithRef.tsx
import Editor, { OnMount } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { useRef } from "react";

export function EditorWithRef() {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Focus editor on mount
    editor.focus();

    // Register custom keybinding
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      console.log("Save triggered");
      // Handle save
    });
  };

  return (
    <Editor
      height="500px"
      defaultLanguage="typescript"
      defaultValue="// Start coding..."
      onMount={handleMount}
      theme="vs-dark"
    />
  );
}
```

---

## Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["monaco-editor"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "monaco-editor": ["monaco-editor"],
        },
      },
    },
  },
});
```

---

## Web Workers Setup

Monaco requires web workers for language features. Configure with Vite:

```typescript
// src/monaco-workers.ts
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === "json") return new jsonWorker();
    if (label === "css" || label === "scss" || label === "less")
      return new cssWorker();
    if (label === "html" || label === "handlebars" || label === "razor")
      return new htmlWorker();
    if (label === "typescript" || label === "javascript") return new tsWorker();
    return new editorWorker();
  },
};
```

Import in your entry file:

```tsx
// src/main.tsx
import "./monaco-workers";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## Custom Themes

```tsx
// themes/leggooo-dark.ts
import { editor } from "monaco-editor";

export const leggoooDarkTheme: editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment", foreground: "6A9955", fontStyle: "italic" },
    { token: "keyword", foreground: "C586C0" },
    { token: "string", foreground: "CE9178" },
    { token: "number", foreground: "B5CEA8" },
    { token: "type", foreground: "4EC9B0" },
    { token: "function", foreground: "DCDCAA" },
    { token: "variable", foreground: "9CDCFE" },
  ],
  colors: {
    "editor.background": "#1a1a2e",
    "editor.foreground": "#d4d4d4",
    "editor.lineHighlightBackground": "#2a2a4e",
    "editor.selectionBackground": "#264f78",
    "editorCursor.foreground": "#aeafad",
    "editorWhitespace.foreground": "#3b3b3b",
  },
};

// Register theme
monaco.editor.defineTheme("leggooo-dark", leggoooDarkTheme);
```

---

## Editor Options Reference

```tsx
const editorOptions: editor.IStandaloneEditorConstructionOptions = {
  // Display
  theme: "vs-dark",
  fontSize: 14,
  fontFamily: "JetBrains Mono, Fira Code, monospace",
  fontLigatures: true,
  lineHeight: 1.6,

  // Line numbers
  lineNumbers: "on", // 'on' | 'off' | 'relative' | 'interval'
  lineNumbersMinChars: 3,

  // Minimap
  minimap: {
    enabled: true,
    maxColumn: 80,
    renderCharacters: false,
    showSlider: "mouseover",
  },

  // Scrolling
  scrollBeyondLastLine: false,
  smoothScrolling: true,

  // Word wrap
  wordWrap: "on", // 'off' | 'on' | 'wordWrapColumn' | 'bounded'
  wordWrapColumn: 80,

  // Editing
  tabSize: 2,
  insertSpaces: true,
  autoIndent: "full",
  formatOnPaste: true,
  formatOnType: true,

  // Cursor
  cursorStyle: "line",
  cursorBlinking: "smooth",
  cursorSmoothCaretAnimation: "on",

  // Suggestions
  quickSuggestions: true,
  suggestOnTriggerCharacters: true,
  acceptSuggestionOnEnter: "on",

  // Accessibility
  accessibilitySupport: "auto",
  ariaLabel: "Code editor",

  // Performance
  automaticLayout: true,
  renderWhitespace: "selection",
};
```

---

## Language Detection

```tsx
// utils/languageDetection.ts
const extensionToLanguage: Record<string, string> = {
  ".ts": "typescript",
  ".tsx": "typescript",
  ".js": "javascript",
  ".jsx": "javascript",
  ".json": "json",
  ".html": "html",
  ".css": "css",
  ".scss": "scss",
  ".md": "markdown",
  ".py": "python",
  ".rs": "rust",
  ".go": "go",
};

export function getLanguageFromFilename(filename: string): string {
  const ext = filename.slice(filename.lastIndexOf("."));
  return extensionToLanguage[ext] || "plaintext";
}
```

---

## Multiple Editors (Tabs)

```tsx
// components/EditorTabs.tsx
import { useState } from "react";
import Editor from "@monaco-editor/react";

interface EditorFile {
  id: string;
  name: string;
  language: string;
  content: string;
}

export function EditorTabs({ files }: { files: EditorFile[] }) {
  const [activeId, setActiveId] = useState(files[0]?.id);
  const activeFile = files.find((f) => f.id === activeId);

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex bg-gray-900 border-b border-gray-700">
        {files.map((file) => (
          <button
            key={file.id}
            onClick={() => setActiveId(file.id)}
            className={`px-4 py-2 text-sm ${
              file.id === activeId
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {file.name}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div className="flex-1">
        {activeFile && (
          <Editor
            key={activeFile.id}
            path={activeFile.name} // Important for model caching
            language={activeFile.language}
            value={activeFile.content}
            theme="vs-dark"
          />
        )}
      </div>
    </div>
  );
}
```
