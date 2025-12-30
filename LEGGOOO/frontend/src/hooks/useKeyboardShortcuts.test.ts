import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useKeyboardShortcuts,
  createWorkspaceShortcuts,
  formatShortcut,
  KeyboardShortcut,
} from './useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call action when shortcut is pressed', () => {
    const mockAction = vi.fn();
    const shortcuts: KeyboardShortcut[] = [
      { key: 's', ctrl: true, description: 'Save', action: mockAction },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Simulate Ctrl+S
    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('should not call action when shortcut is disabled', () => {
    const mockAction = vi.fn();
    const shortcuts: KeyboardShortcut[] = [
      { key: 's', ctrl: true, description: 'Save', action: mockAction },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts, false));

    // Simulate Ctrl+S
    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(mockAction).not.toHaveBeenCalled();
  });

  it('should handle multiple shortcuts', () => {
    const saveAction = vi.fn();
    const toggleAction = vi.fn();
    const shortcuts: KeyboardShortcut[] = [
      { key: 's', ctrl: true, description: 'Save', action: saveAction },
      { key: 'i', ctrl: true, description: 'Toggle', action: toggleAction },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Simulate Ctrl+I
    const event = new KeyboardEvent('keydown', {
      key: 'i',
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(saveAction).not.toHaveBeenCalled();
    expect(toggleAction).toHaveBeenCalledTimes(1);
  });
});

describe('createWorkspaceShortcuts', () => {
  it('should create shortcuts for provided handlers', () => {
    const onSave = vi.fn();
    const onToggleChat = vi.fn();

    const shortcuts = createWorkspaceShortcuts({
      onSave,
      onToggleChat,
    });

    expect(shortcuts).toHaveLength(2);
    expect(shortcuts.some(s => s.key === 's' && s.ctrl)).toBe(true);
    expect(shortcuts.some(s => s.key === 'i' && s.ctrl)).toBe(true);
  });

  it('should only include shortcuts for provided handlers', () => {
    const shortcuts = createWorkspaceShortcuts({});
    expect(shortcuts).toHaveLength(0);
  });
});

describe('formatShortcut', () => {
  it('should format simple shortcut', () => {
    const shortcut: KeyboardShortcut = {
      key: 's',
      ctrl: true,
      description: 'Save',
      action: vi.fn(),
    };

    const formatted = formatShortcut(shortcut);
    // Should contain Ctrl and S
    expect(formatted).toMatch(/Ctrl.*S|⌘.*S/);
  });

  it('should format shortcut with multiple modifiers', () => {
    const shortcut: KeyboardShortcut = {
      key: 's',
      ctrl: true,
      shift: true,
      description: 'Save Snapshot',
      action: vi.fn(),
    };

    const formatted = formatShortcut(shortcut);
    expect(formatted).toMatch(/Ctrl.*Shift.*S|⌘.*⇧.*S/);
  });

  it('should format special keys', () => {
    const shortcut: KeyboardShortcut = {
      key: 'Enter',
      ctrl: true,
      description: 'Submit',
      action: vi.fn(),
    };

    const formatted = formatShortcut(shortcut);
    expect(formatted).toMatch(/Enter|↵/);
  });
});
