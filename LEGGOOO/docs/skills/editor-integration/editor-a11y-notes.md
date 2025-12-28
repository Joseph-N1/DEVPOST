# Editor Accessibility Notes

> Accessibility considerations specific to code editors in LEGGOOO.

---

## Monaco Editor Built-in Accessibility

Monaco Editor has extensive built-in accessibility support:

### Enabling Accessibility Mode

```tsx
<Editor
  options={{
    accessibilitySupport: "on", // 'auto' | 'on' | 'off'
    ariaLabel: "Code editor for index.tsx",
  }}
/>
```

### Keyboard Shortcuts

Monaco provides screen reader-friendly shortcuts:

| Action                    | Shortcut        |
| ------------------------- | --------------- |
| Toggle screen reader mode | Ctrl+E          |
| Read current line         | Ctrl+Shift+O    |
| Toggle high contrast      | N/A (use theme) |
| Command palette           | F1              |
| Go to line                | Ctrl+G          |

---

## Screen Reader Announcements

### Custom Status Announcements

```tsx
// hooks/useEditorAnnouncements.ts
import { editor } from "monaco-editor";
import { useEffect } from "react";

export function useEditorAnnouncements(
  editorInstance: editor.IStandaloneCodeEditor | null
) {
  useEffect(() => {
    if (!editorInstance) return;

    // Announce cursor position changes
    const disposable = editorInstance.onDidChangeCursorPosition((e) => {
      announceToScreenReader(
        `Line ${e.position.lineNumber}, Column ${e.position.column}`
      );
    });

    return () => disposable.dispose();
  }, [editorInstance]);
}

function announceToScreenReader(message: string) {
  const announcement = document.createElement("div");
  announcement.setAttribute("role", "status");
  announcement.setAttribute("aria-live", "polite");
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only";
  announcement.textContent = message;

  document.body.appendChild(announcement);
  setTimeout(() => announcement.remove(), 1000);
}
```

### Collaborative Event Announcements

```tsx
// Announce when collaborators join/leave or make changes
function announceCollaboratorEvent(event: CollabEvent) {
  const messages = {
    join: `${event.username} joined the session`,
    leave: `${event.username} left the session`,
    edit: `${event.username} is editing line ${event.line}`,
  };

  announceToScreenReader(messages[event.type]);
}
```

---

## Focus Management

### Trap Focus in Editor When Active

```tsx
// components/EditorWrapper.tsx
import { useRef, useEffect } from "react";

export function EditorWrapper({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Ensure focus returns to editor after dialogs close
  const returnFocus = () => {
    const editor = containerRef.current?.querySelector(".monaco-editor");
    (editor as HTMLElement)?.focus();
  };

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label="Code editor workspace"
      onKeyDown={(e) => {
        // Escape to exit editor and move to next section
        if (e.key === "Escape" && e.shiftKey) {
          // Move focus to next landmark
        }
      }}
    >
      {children}
    </div>
  );
}
```

---

## High Contrast Themes

### Define High Contrast Theme

```tsx
// themes/high-contrast.ts
import { editor } from "monaco-editor";

export const highContrastTheme: editor.IStandaloneThemeData = {
  base: "hc-black",
  inherit: true,
  rules: [
    { token: "comment", foreground: "7CA668" },
    { token: "keyword", foreground: "D6A3FF" },
    { token: "string", foreground: "FFB86C" },
  ],
  colors: {
    "editor.background": "#000000",
    "editor.foreground": "#FFFFFF",
    "editorCursor.foreground": "#FFFF00",
    "editor.selectionBackground": "#FFFF00",
    "editor.selectionForeground": "#000000",
    "editor.lineHighlightBorder": "#FFFFFF",
    "editorLineNumber.foreground": "#FFFFFF",
    "editorLineNumber.activeForeground": "#FFFF00",
  },
};

// Register
monaco.editor.defineTheme("leggooo-hc", highContrastTheme);
```

### Theme Switcher with Preference Detection

```tsx
// hooks/useAccessibleTheme.ts
import { useEffect, useState } from "react";

export function useAccessibleTheme() {
  const [theme, setTheme] = useState("vs-dark");

  useEffect(() => {
    // Check for high contrast preference
    const highContrastQuery = window.matchMedia("(prefers-contrast: more)");

    if (highContrastQuery.matches) {
      setTheme("leggooo-hc");
    }

    const handler = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? "leggooo-hc" : "vs-dark");
    };

    highContrastQuery.addEventListener("change", handler);
    return () => highContrastQuery.removeEventListener("change", handler);
  }, []);

  return theme;
}
```

---

## Keyboard Navigation Enhancements

### Custom Commands for Accessibility

```tsx
// Register accessibility commands
editor.addAction({
  id: "announce-diagnostics",
  label: "Announce Current Line Diagnostics",
  keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.KeyD],
  run: (ed) => {
    const position = ed.getPosition();
    const model = ed.getModel();
    if (!position || !model) return;

    const markers = monaco.editor
      .getModelMarkers({
        resource: model.uri,
      })
      .filter((m) => m.startLineNumber === position.lineNumber);

    if (markers.length === 0) {
      announceToScreenReader("No issues on this line");
    } else {
      const message = markers
        .map((m) => `${m.severity === 8 ? "Error" : "Warning"}: ${m.message}`)
        .join(". ");
      announceToScreenReader(message);
    }
  },
});
```

---

## Collaborative Cursor Accessibility

### Screen Reader Friendly Cursors

```tsx
// components/CollaborativeCursor.tsx
export function CollaborativeCursor({
  username,
  color,
  position,
}: CollaborativeCursorProps) {
  return (
    <>
      {/* Visual cursor */}
      <div
        className="absolute w-0.5 pointer-events-none"
        style={{
          backgroundColor: color,
          left: position.x,
          top: position.y,
          height: "1.2em",
        }}
        aria-hidden="true"
      />

      {/* Screen reader announcement */}
      <span className="sr-only" role="status">
        {username}'s cursor at line {position.line}, column {position.column}
      </span>
    </>
  );
}
```

---

## Testing Checklist

### Manual Testing

- [ ] Navigate editor with keyboard only
- [ ] Test with NVDA/VoiceOver/JAWS
- [ ] Verify high contrast mode works
- [ ] Check focus indicators are visible
- [ ] Test collaborative features with screen reader

### Automated Testing

```tsx
// tests/editor-a11y.test.tsx
import { axe } from "jest-axe";

test("editor container is accessible", async () => {
  const { container } = render(<EditorWrapper />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## Resources

- [Monaco Accessibility Guide](https://github.com/microsoft/monaco-editor/wiki/Monaco-Editor-Accessibility-Guide)
- [WAI-ARIA Practices: Application Role](https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/)
- [WebAIM: Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
