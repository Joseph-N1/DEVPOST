# ARIA Implementation Checklist

> Comprehensive checklist for implementing ARIA attributes in LEGGOOO's editor interface.

---

## Document Structure

- [ ] `role="application"` on editor container (use sparingly)
- [ ] `role="main"` on primary content area
- [ ] `role="navigation"` on sidebar/file tree
- [ ] `role="complementary"` on auxiliary panels
- [ ] `role="banner"` on top toolbar
- [ ] `role="contentinfo"` on status bar

## Interactive Elements

### Buttons

```html
<!-- Standard button -->
<button type="button" aria-label="Save file">
  <SaveIcon aria-hidden="true" />
</button>

<!-- Toggle button -->
<button type="button" aria-pressed="false" aria-label="Toggle sidebar">
  <SidebarIcon aria-hidden="true" />
</button>

<!-- Icon-only button (requires label) -->
<button type="button" aria-label="Close panel">
  <XIcon aria-hidden="true" />
</button>
```

### Menu & Dropdown

- [ ] `role="menu"` on dropdown container
- [ ] `role="menuitem"` on each option
- [ ] `role="menuitemcheckbox"` for toggleable items
- [ ] `role="menuitemradio"` for exclusive options
- [ ] `aria-expanded` on trigger button
- [ ] `aria-haspopup="menu"` on trigger

```tsx
<button
  aria-haspopup="menu"
  aria-expanded={isOpen}
  aria-controls="file-menu"
>
  File
</button>
<ul id="file-menu" role="menu" aria-label="File options">
  <li role="menuitem" tabIndex={-1}>New File</li>
  <li role="menuitem" tabIndex={-1}>Open...</li>
  <li role="separator" />
  <li role="menuitem" tabIndex={-1}>Save</li>
</ul>
```

### File Tree

- [ ] `role="tree"` on container
- [ ] `role="treeitem"` on each file/folder
- [ ] `role="group"` on nested folder contents
- [ ] `aria-expanded` on folders
- [ ] `aria-selected` on current file
- [ ] `aria-level` indicating depth

```tsx
<ul role="tree" aria-label="Project files">
  <li role="treeitem" aria-expanded="true" aria-level={1}>
    <span>src</span>
    <ul role="group">
      <li role="treeitem" aria-level={2} aria-selected="true">
        index.tsx
      </li>
      <li role="treeitem" aria-level={2}>
        App.tsx
      </li>
    </ul>
  </li>
</ul>
```

### Tabs (Editor Tabs)

- [ ] `role="tablist"` on tab container
- [ ] `role="tab"` on each tab
- [ ] `role="tabpanel"` on content areas
- [ ] `aria-selected` on active tab
- [ ] `aria-controls` linking tab to panel
- [ ] `aria-labelledby` on panel referencing tab

```tsx
<div role="tablist" aria-label="Open files">
  <button
    role="tab"
    aria-selected="true"
    aria-controls="panel-1"
    id="tab-1"
  >
    index.tsx
  </button>
  <button
    role="tab"
    aria-selected="false"
    aria-controls="panel-2"
    id="tab-2"
  >
    App.tsx
  </button>
</div>
<div
  role="tabpanel"
  id="panel-1"
  aria-labelledby="tab-1"
  tabIndex={0}
>
  {/* Monaco Editor instance */}
</div>
```

## Live Regions

### Collaborative Events

```tsx
// Announce when collaborators join/leave
<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
  {announcement}
</div>

// Example announcements:
// "Sarah joined the session"
// "Mike is editing line 42"
// "Changes saved to cloud"
```

### Error Messages

```tsx
// Assertive for critical errors
<div role="alert" aria-live="assertive">
  Connection lost. Attempting to reconnect...
</div>
```

### Code Diagnostics

```tsx
// Polite for linting messages
<div role="log" aria-live="polite" aria-relevant="additions">
  <p>Line 15: 'useState' is defined but never used</p>
</div>
```

## Monaco Editor Specific

### Editor Container

```tsx
<div
  role="application"
  aria-label="Code editor"
  aria-describedby="editor-instructions"
>
  <div id="editor-instructions" className="sr-only">
    Press F1 for command palette. Press Ctrl+G to go to line.
  </div>
  {/* Monaco Editor mounts here */}
</div>
```

### Editor Status

- [ ] Line/column position announced
- [ ] Selection status announced
- [ ] Language mode announced
- [ ] Encoding announced
- [ ] Indentation mode announced

```tsx
<div role="status" aria-live="polite" className="status-bar">
  <span aria-label={`Line ${line}, Column ${column}`}>
    Ln {line}, Col {column}
  </span>
  <span aria-label={`Language: ${language}`}>{language}</span>
</div>
```

## Form Controls

### Search/Find

```tsx
<div role="search">
  <label htmlFor="find-input" className="sr-only">
    Find in file
  </label>
  <input
    id="find-input"
    type="search"
    aria-describedby="find-results"
    placeholder="Find..."
  />
  <span id="find-results" aria-live="polite">
    {matchCount} results
  </span>
</div>
```

### Settings Toggle

```tsx
<div role="switch" aria-checked={enabled} tabIndex={0}>
  <label id="autosave-label">Auto-save</label>
</div>
```

## Keyboard Shortcuts

Document all shortcuts in an accessible format:

| Action          | Shortcut | ARIA Announcement        |
| --------------- | -------- | ------------------------ |
| Save            | Ctrl+S   | "File saved"             |
| Find            | Ctrl+F   | "Find dialog opened"     |
| Command Palette | F1       | "Command palette opened" |
| Go to Line      | Ctrl+G   | "Go to line dialog"      |
| Toggle Sidebar  | Ctrl+B   | "Sidebar [shown/hidden]" |

## Validation Checklist

Before release, verify:

- [ ] All interactive elements are keyboard accessible
- [ ] Focus order follows visual layout
- [ ] Focus is never trapped (except modals)
- [ ] All images have alt text or aria-hidden
- [ ] Color contrast meets 4.5:1 minimum
- [ ] Focus indicators are visible
- [ ] Screen reader can navigate all content
- [ ] Live regions announce dynamic changes
- [ ] Error messages are associated with inputs
- [ ] Headings create logical outline
