import { useEffect, useCallback, useRef } from 'react';

export type KeyboardShortcut = {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
  preventDefault?: boolean;
};

type ShortcutsMap = Map<string, KeyboardShortcut>;

function getShortcutKey(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push('ctrl');
  if (e.shiftKey) parts.push('shift');
  if (e.altKey) parts.push('alt');
  parts.push(e.key.toLowerCase());
  return parts.join('+');
}

function buildShortcutKey(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  if (shortcut.ctrl || shortcut.meta) parts.push('ctrl');
  if (shortcut.shift) parts.push('shift');
  if (shortcut.alt) parts.push('alt');
  parts.push(shortcut.key.toLowerCase());
  return parts.join('+');
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true) {
  const shortcutsRef = useRef<ShortcutsMap>(new Map());

  // Build the shortcuts map
  useEffect(() => {
    const map = new Map<string, KeyboardShortcut>();
    shortcuts.forEach((shortcut) => {
      const key = buildShortcutKey(shortcut);
      map.set(key, shortcut);
    });
    shortcutsRef.current = map;
  }, [shortcuts]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs/textareas (unless it's a global shortcut)
      const target = e.target as HTMLElement;
      const isEditable =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      const shortcutKey = getShortcutKey(e);
      const shortcut = shortcutsRef.current.get(shortcutKey);

      if (shortcut) {
        // For editable elements, only trigger if ctrl/cmd is pressed
        if (isEditable && !(e.ctrlKey || e.metaKey)) {
          return;
        }

        if (shortcut.preventDefault !== false) {
          e.preventDefault();
        }
        shortcut.action();
      }
    },
    [enabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Format a shortcut for display
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');
  const parts: string[] = [];

  if (shortcut.ctrl || shortcut.meta) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shortcut.shift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }
  if (shortcut.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }

  // Format special keys
  let keyDisplay = shortcut.key;
  switch (shortcut.key.toLowerCase()) {
    case 'enter':
      keyDisplay = isMac ? '↵' : 'Enter';
      break;
    case 'escape':
      keyDisplay = 'Esc';
      break;
    case 'backspace':
      keyDisplay = isMac ? '⌫' : 'Backspace';
      break;
    case 'delete':
      keyDisplay = isMac ? '⌦' : 'Delete';
      break;
    case 'arrowup':
      keyDisplay = '↑';
      break;
    case 'arrowdown':
      keyDisplay = '↓';
      break;
    case 'arrowleft':
      keyDisplay = '←';
      break;
    case 'arrowright':
      keyDisplay = '→';
      break;
    case ' ':
      keyDisplay = 'Space';
      break;
    default:
      keyDisplay = shortcut.key.toUpperCase();
  }

  parts.push(keyDisplay);
  return parts.join(isMac ? '' : ' + ');
}

// Common workspace shortcuts configuration
export function createWorkspaceShortcuts(handlers: {
  onSave?: () => void;
  onSaveSnapshot?: () => void;
  onToggleChat?: () => void;
  onToggleSnapshots?: () => void;
  onToggleFileTree?: () => void;
  onSearch?: () => void;
  onGoToFile?: () => void;
  onFormatDocument?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onCloseTab?: () => void;
  onNewFile?: () => void;
}): KeyboardShortcut[] {
  const shortcuts: KeyboardShortcut[] = [];

  if (handlers.onSave) {
    shortcuts.push({
      key: 's',
      ctrl: true,
      description: 'Save file',
      action: handlers.onSave,
    });
  }

  if (handlers.onSaveSnapshot) {
    shortcuts.push({
      key: 's',
      ctrl: true,
      shift: true,
      description: 'Create snapshot',
      action: handlers.onSaveSnapshot,
    });
  }

  if (handlers.onToggleChat) {
    shortcuts.push({
      key: 'i',
      ctrl: true,
      description: 'Toggle AI chat',
      action: handlers.onToggleChat,
    });
  }

  if (handlers.onToggleSnapshots) {
    shortcuts.push({
      key: 'h',
      ctrl: true,
      shift: true,
      description: 'Toggle snapshot history',
      action: handlers.onToggleSnapshots,
    });
  }

  if (handlers.onToggleFileTree) {
    shortcuts.push({
      key: 'b',
      ctrl: true,
      description: 'Toggle file tree',
      action: handlers.onToggleFileTree,
    });
  }

  if (handlers.onSearch) {
    shortcuts.push({
      key: 'f',
      ctrl: true,
      shift: true,
      description: 'Search in files',
      action: handlers.onSearch,
    });
  }

  if (handlers.onGoToFile) {
    shortcuts.push({
      key: 'p',
      ctrl: true,
      description: 'Go to file',
      action: handlers.onGoToFile,
    });
  }

  if (handlers.onFormatDocument) {
    shortcuts.push({
      key: 'f',
      ctrl: true,
      alt: true,
      description: 'Format document',
      action: handlers.onFormatDocument,
    });
  }

  if (handlers.onCloseTab) {
    shortcuts.push({
      key: 'w',
      ctrl: true,
      description: 'Close current tab',
      action: handlers.onCloseTab,
    });
  }

  if (handlers.onNewFile) {
    shortcuts.push({
      key: 'n',
      ctrl: true,
      description: 'New file',
      action: handlers.onNewFile,
    });
  }

  return shortcuts;
}

// Hook for Monaco editor specific shortcuts
export function useMonacoShortcuts(
  editorRef: React.RefObject<{ editor: unknown } | null>,
  handlers: {
    onSave?: () => void;
    onFormat?: () => void;
    onComment?: () => void;
  }
) {
  useEffect(() => {
    // Monaco handles most shortcuts internally
    // This hook can be used to add custom actions to the editor
    const editor = editorRef.current?.editor;
    if (!editor) return;

    // Add custom keybindings to Monaco would go here
    // For now, we rely on the global keyboard shortcuts
  }, [editorRef, handlers]);
}
