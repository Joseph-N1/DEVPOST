# React-Aria Component Examples

> Production-ready accessible components using Adobe's React-Aria library for LEGGOOO's editor UI.

---

## Installation

```bash
npm install react-aria-components
# or individual hooks
npm install @react-aria/button @react-aria/menu @react-aria/listbox
```

## Why React-Aria?

- Full WCAG 2.1 AA compliance out of the box
- Handles keyboard navigation automatically
- Screen reader announcements built-in
- Works with any styling solution (Tailwind, CSS-in-JS, etc.)
- Adaptive to device (touch, mouse, keyboard)

---

## Component Examples

### 1. Command Palette / Combobox

```tsx
// components/CommandPalette.tsx
import {
  ComboBox,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
} from "react-aria-components";
import { useState } from "react";

interface Command {
  id: string;
  label: string;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  commands: Command[];
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({
  commands,
  isOpen,
  onClose,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");

  const filtered = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <ComboBox
      aria-label="Command palette"
      inputValue={query}
      onInputChange={setQuery}
      onSelectionChange={(key) => {
        const cmd = commands.find((c) => c.id === key);
        cmd?.action();
        onClose();
      }}
    >
      <Label className="sr-only">Search commands</Label>
      <Input
        placeholder="Type a command..."
        className="w-full px-4 py-2 bg-gray-800 text-white rounded-t-lg border-b border-gray-700"
      />
      <Popover className="w-[500px] bg-gray-800 rounded-b-lg shadow-xl">
        <ListBox className="max-h-80 overflow-auto">
          {filtered.map((cmd) => (
            <ListBoxItem
              key={cmd.id}
              id={cmd.id}
              textValue={cmd.label}
              className="px-4 py-2 flex justify-between items-center cursor-pointer
                         hover:bg-gray-700 focus:bg-gray-700 focus:outline-none"
            >
              <span>{cmd.label}</span>
              {cmd.shortcut && (
                <kbd className="text-xs text-gray-400 bg-gray-900 px-2 py-1 rounded">
                  {cmd.shortcut}
                </kbd>
              )}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </ComboBox>
  );
}
```

### 2. File Tree with Keyboard Navigation

```tsx
// components/FileTree.tsx
import {
  Tree,
  TreeItem,
  TreeItemContent,
  Collection,
  Button,
} from "react-aria-components";
import { FolderIcon, FileIcon, ChevronRightIcon } from "lucide-react";

interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
}

interface FileTreeProps {
  files: FileNode[];
  onSelect: (id: string) => void;
  selectedId?: string;
}

export function FileTree({ files, onSelect, selectedId }: FileTreeProps) {
  return (
    <Tree
      aria-label="Project files"
      selectionMode="single"
      selectedKeys={selectedId ? new Set([selectedId]) : new Set()}
      onSelectionChange={(keys) => {
        const key = [...keys][0];
        if (key) onSelect(String(key));
      }}
      className="w-full text-sm"
    >
      {(item: FileNode) => (
        <TreeItem
          key={item.id}
          id={item.id}
          textValue={item.name}
          className="outline-none"
        >
          <TreeItemContent
            className="flex items-center gap-2 px-2 py-1 rounded
                                       hover:bg-gray-700 focus:bg-gray-700
                                       aria-selected:bg-blue-600"
          >
            {item.type === "folder" ? (
              <>
                <Button
                  slot="chevron"
                  className="w-4 h-4 flex items-center justify-center"
                >
                  <ChevronRightIcon
                    className="w-3 h-3 transition-transform
                                               group-aria-expanded:rotate-90"
                  />
                </Button>
                <FolderIcon className="w-4 h-4 text-yellow-400" />
              </>
            ) : (
              <>
                <span className="w-4" /> {/* Spacer for alignment */}
                <FileIcon className="w-4 h-4 text-gray-400" />
              </>
            )}
            <span>{item.name}</span>
          </TreeItemContent>
          {item.children && (
            <Collection items={item.children}>
              {(child) => <TreeItem key={child.id} {...child} />}
            </Collection>
          )}
        </TreeItem>
      )}
    </Tree>
  );
}
```

### 3. Editor Tabs

```tsx
// components/EditorTabs.tsx
import {
  Tabs,
  TabList,
  Tab,
  TabPanel,
  Collection,
} from "react-aria-components";
import { XIcon } from "lucide-react";

interface EditorTab {
  id: string;
  filename: string;
  isDirty: boolean;
  content: React.ReactNode;
}

interface EditorTabsProps {
  tabs: EditorTab[];
  activeTabId: string;
  onTabChange: (id: string) => void;
  onTabClose: (id: string) => void;
}

export function EditorTabs({
  tabs,
  activeTabId,
  onTabChange,
  onTabClose,
}: EditorTabsProps) {
  return (
    <Tabs
      selectedKey={activeTabId}
      onSelectionChange={(key) => onTabChange(String(key))}
      className="flex flex-col h-full"
    >
      <TabList
        aria-label="Open files"
        className="flex bg-gray-900 border-b border-gray-700"
        items={tabs}
      >
        {(tab) => (
          <Tab
            key={tab.id}
            id={tab.id}
            className="group flex items-center gap-2 px-4 py-2 text-sm
                       text-gray-400 hover:text-white cursor-pointer
                       aria-selected:text-white aria-selected:bg-gray-800
                       focus:outline-none focus:ring-2 focus:ring-blue-500
                       focus:ring-inset"
          >
            <span>
              {tab.filename}
              {tab.isDirty && <span className="text-blue-400 ml-1">●</span>}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              className="opacity-0 group-hover:opacity-100 
                         hover:bg-gray-600 rounded p-0.5"
              aria-label={`Close ${tab.filename}`}
            >
              <XIcon className="w-3 h-3" />
            </button>
          </Tab>
        )}
      </TabList>
      <Collection items={tabs}>
        {(tab) => (
          <TabPanel
            key={tab.id}
            id={tab.id}
            className="flex-1 focus:outline-none"
          >
            {tab.content}
          </TabPanel>
        )}
      </Collection>
    </Tabs>
  );
}
```

### 4. Context Menu

```tsx
// components/ContextMenu.tsx
import {
  Menu,
  MenuItem,
  MenuTrigger,
  Popover,
  Separator,
} from "react-aria-components";

interface MenuAction {
  id: string;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  destructive?: boolean;
  onAction: () => void;
}

interface ContextMenuProps {
  trigger: React.ReactNode;
  actions: (MenuAction | "separator")[];
}

export function ContextMenu({ trigger, actions }: ContextMenuProps) {
  return (
    <MenuTrigger>
      {trigger}
      <Popover className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-1 min-w-[200px]">
        <Menu
          className="outline-none"
          onAction={(key) => {
            const action = actions.find(
              (a) => a !== "separator" && a.id === key
            ) as MenuAction | undefined;
            action?.onAction();
          }}
        >
          {actions.map((action, index) =>
            action === "separator" ? (
              <Separator
                key={`sep-${index}`}
                className="my-1 h-px bg-gray-700"
              />
            ) : (
              <MenuItem
                key={action.id}
                id={action.id}
                isDisabled={action.disabled}
                className={`
                  flex items-center justify-between px-3 py-2 text-sm
                  outline-none cursor-pointer
                  ${action.destructive ? "text-red-400" : "text-gray-200"}
                  ${action.disabled ? "opacity-50 cursor-not-allowed" : ""}
                  focus:bg-gray-700 hover:bg-gray-700
                `}
              >
                <span>{action.label}</span>
                {action.shortcut && (
                  <kbd className="text-xs text-gray-500">{action.shortcut}</kbd>
                )}
              </MenuItem>
            )
          )}
        </Menu>
      </Popover>
    </MenuTrigger>
  );
}

// Usage
<ContextMenu
  trigger={<Button>File</Button>}
  actions={[
    { id: "new", label: "New File", shortcut: "⌘N", onAction: handleNew },
    { id: "open", label: "Open...", shortcut: "⌘O", onAction: handleOpen },
    "separator",
    { id: "save", label: "Save", shortcut: "⌘S", onAction: handleSave },
    "separator",
    {
      id: "delete",
      label: "Delete",
      destructive: true,
      onAction: handleDelete,
    },
  ]}
/>;
```

### 5. Modal Dialog

```tsx
// components/Dialog.tsx
import {
  Dialog,
  DialogTrigger,
  Modal,
  ModalOverlay,
  Heading,
  Button,
} from "react-aria-components";

interface ConfirmDialogProps {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <DialogTrigger>
      {trigger}
      <ModalOverlay
        className="fixed inset-0 bg-black/50 flex items-center justify-center"
        isDismissable
      >
        <Modal className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
          <Dialog className="outline-none p-6">
            {({ close }) => (
              <>
                <Heading
                  slot="title"
                  className="text-lg font-semibold text-white mb-2"
                >
                  {title}
                </Heading>
                <p className="text-gray-400 mb-6">{description}</p>
                <div className="flex justify-end gap-3">
                  <Button
                    onPress={close}
                    className="px-4 py-2 text-gray-300 hover:text-white
                               hover:bg-gray-700 rounded transition"
                  >
                    {cancelLabel}
                  </Button>
                  <Button
                    onPress={() => {
                      onConfirm();
                      close();
                    }}
                    className={`px-4 py-2 rounded transition font-medium
                      ${
                        destructive
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                  >
                    {confirmLabel}
                  </Button>
                </div>
              </>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
}
```

### 6. Toast Notifications (Live Region)

```tsx
// components/Toast.tsx
import { useEffect, useState } from "react";
import { Button } from "react-aria-components";
import { XIcon, CheckIcon, AlertIcon, InfoIcon } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckIcon className="w-5 h-5 text-green-400" />,
  error: <AlertIcon className="w-5 h-5 text-red-400" />,
  warning: <AlertIcon className="w-5 h-5 text-yellow-400" />,
  info: <InfoIcon className="w-5 h-5 text-blue-400" />,
};

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      className="fixed bottom-4 right-4 flex flex-col gap-2 z-50"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => onDismiss(toast.id)}
        />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(onDismiss, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, onDismiss]);

  return (
    <div
      role="alert"
      className="flex items-center gap-3 bg-gray-800 border border-gray-700 
                 rounded-lg px-4 py-3 shadow-lg min-w-[300px]"
    >
      {icons[toast.type]}
      <span className="flex-1 text-white">{toast.message}</span>
      <Button
        onPress={onDismiss}
        aria-label="Dismiss notification"
        className="text-gray-400 hover:text-white p-1"
      >
        <XIcon className="w-4 h-4" />
      </Button>
    </div>
  );
}
```

---

## Keyboard Navigation Reference

| Component    | Keys   | Action                 |
| ------------ | ------ | ---------------------- |
| **ComboBox** | ↓/↑    | Navigate options       |
|              | Enter  | Select option          |
|              | Escape | Close dropdown         |
| **Tree**     | ↓/↑    | Navigate items         |
|              | →/←    | Expand/collapse folder |
|              | Enter  | Select item            |
| **Tabs**     | ←/→    | Switch tabs            |
|              | Delete | Close tab (if enabled) |
| **Menu**     | ↓/↑    | Navigate items         |
|              | Enter  | Activate item          |
|              | Escape | Close menu             |
| **Dialog**   | Tab    | Cycle focus within     |
|              | Escape | Close dialog           |

---

## Resources

- [React-Aria Components](https://react-spectrum.adobe.com/react-aria/components.html)
- [React-Aria Hooks](https://react-spectrum.adobe.com/react-aria/hooks.html)
- [Starter Kit Examples](https://react-spectrum.adobe.com/react-aria/getting-started.html)
