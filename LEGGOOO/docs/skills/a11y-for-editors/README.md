# Accessibility for Editors (a11y-for-editors)

> **Skill Name:** `a11y-for-editors` > **Description:** Ensures LEGGOOO's collaborative editor meets WCAG 2.1 AA standards with proper ARIA roles, keyboard navigation, and screen reader support.

---

## Purpose

This skill provides accessibility patterns and verification tools specifically designed for code editors and collaborative IDE interfaces. It ensures that all users—including those using assistive technologies—can fully participate in collaborative coding sessions.

## When to Use This Skill

- Setting up Monaco Editor with accessibility features
- Implementing keyboard navigation for file trees and panels
- Adding screen reader announcements for collaborative events
- Running accessibility audits on editor components
- Fixing WCAG compliance issues flagged by automated tools

## Prerequisites

- Familiarity with WCAG 2.1 guidelines (A and AA levels)
- Understanding of ARIA roles and attributes
- Knowledge of React accessibility patterns (if using React-Aria)
- Axe-core or similar testing tool installed

## Core Accessibility Requirements

### 1. Keyboard Navigation

All interactive elements must be:

- Focusable with Tab/Shift+Tab
- Activatable with Enter/Space
- Navigable with arrow keys (for lists, menus, trees)
- Escapable with Escape key (modals, dropdowns)

### 2. Screen Reader Support

- Live regions for dynamic content updates
- Proper heading hierarchy (h1-h6)
- Descriptive labels for all controls
- Status announcements for collaborative events

### 3. Visual Accessibility

- Minimum 4.5:1 contrast ratio for text
- Focus indicators visible in all themes
- No reliance on color alone for information
- Support for `prefers-reduced-motion`

### 4. Editor-Specific Requirements

- Line number announcements
- Cursor position feedback
- Code folding state communication
- Error/warning announcements
- Collaborative cursor identification

## Related Files

- [aria-checklist.md](./aria-checklist.md) — ARIA implementation checklist
- [axe-sample-command.md](./axe-sample-command.md) — Automated testing commands
- [react-aria-examples.md](./react-aria-examples.md) — React-Aria component patterns

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Monaco Editor Accessibility](https://github.com/microsoft/monaco-editor/wiki/Monaco-Editor-Accessibility-Guide)
- [React-Aria Documentation](https://react-spectrum.adobe.com/react-aria/)

## Source Archives

- `frontend-accessibility-verification.zip` — Verification scripts and test suites
- `wcag-aria-lookup.zip` — ARIA role reference and WCAG mapping tables
