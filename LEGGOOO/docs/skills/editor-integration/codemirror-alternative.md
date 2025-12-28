# CodeMirror 6 Alternative

> Evaluating CodeMirror 6 as an alternative to Monaco Editor for LEGGOOO.

---

## Overview

CodeMirror 6 is a complete rewrite of CodeMirror, designed for modern web development with excellent performance, accessibility, and extensibility.

## Installation

```bash
npm install codemirror @codemirror/lang-javascript @codemirror/lang-html @codemirror/lang-css
npm install @codemirror/theme-one-dark
```

## Basic Setup

```tsx
// components/CodeMirrorEditor.tsx
import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, basicSetup } from "codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";

interface CodeMirrorEditorProps {
  value: string;
  onChange?: (value: string) => void;
}

export function CodeMirrorEditor({ value, onChange }: CodeMirrorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        javascript({ typescript: true, jsx: true }),
        oneDark,
        EditorView.updateListener.of((update) => {
          if (update.docChanged && onChange) {
            onChange(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });
    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, []);

  return <div ref={containerRef} className="h-full w-full" />;
}
```

---

## Yjs Integration (y-codemirror.next)

```bash
npm install y-codemirror.next
```

```tsx
// components/CollaborativeCodeMirror.tsx
import { useEffect, useRef } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { yCollab } from "y-codemirror.next";
import { EditorState } from "@codemirror/state";
import { EditorView, basicSetup } from "codemirror";
import { javascript } from "@codemirror/lang-javascript";

interface CollaborativeCodeMirrorProps {
  roomId: string;
  username: string;
  userColor: string;
}

export function CollaborativeCodeMirror({
  roomId,
  username,
  userColor,
}: CollaborativeCodeMirrorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const doc = new Y.Doc();
    const provider = new WebsocketProvider("ws://localhost:1234", roomId, doc);

    provider.awareness.setLocalStateField("user", {
      name: username,
      color: userColor,
      colorLight: userColor + "40",
    });

    const yText = doc.getText("codemirror");

    const state = EditorState.create({
      doc: yText.toString(),
      extensions: [
        basicSetup,
        javascript({ typescript: true }),
        yCollab(yText, provider.awareness),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    return () => {
      view.destroy();
      provider.disconnect();
      doc.destroy();
    };
  }, [roomId, username, userColor]);

  return <div ref={containerRef} className="h-full" />;
}
```

---

## Monaco vs CodeMirror Comparison

| Feature                | Monaco               | CodeMirror 6      |
| ---------------------- | -------------------- | ----------------- |
| **Bundle Size**        | ~2MB                 | ~200KB            |
| **TypeScript Support** | Excellent (built-in) | Good (extension)  |
| **Accessibility**      | Good                 | Excellent         |
| **Mobile Support**     | Limited              | Good              |
| **Customization**      | Moderate             | Excellent         |
| **VS Code Parity**     | 1:1                  | Different         |
| **Yjs Binding**        | y-monaco             | y-codemirror.next |
| **Learning Curve**     | Low                  | Moderate          |
| **Ecosystem**          | Large                | Growing           |

---

## When to Choose CodeMirror

✅ **Choose CodeMirror if:**

- Bundle size is critical
- Mobile support is important
- Maximum accessibility needed
- Highly custom UI required
- You want finer control over extensions

✅ **Choose Monaco if:**

- VS Code-like experience is priority
- TypeScript is primary language
- Team familiar with VS Code
- Need minimap, peek definition, etc.
- Time-to-implement is limited

---

## Recommendation for LEGGOOO

**Stick with Monaco Editor** for the MVP because:

1. Better TypeScript/JavaScript support out of the box
2. Familiar VS Code experience for developers
3. More comprehensive documentation
4. y-monaco is well-tested
5. Minimap and advanced features included

Consider CodeMirror for:

- Mobile companion app (if built later)
- Embedded preview components
- Lightweight viewers
