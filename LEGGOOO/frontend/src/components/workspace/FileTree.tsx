/**
 * FileTree Component
 * Left panel showing workspace file structure
 */

import { useState, useMemo } from 'react';

interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

interface FileTreeProps {
  files: FileNode[];
  selectedFileId: string | null;
  onFileSelect: (file: FileNode) => void;
  onCreateFile?: (parentPath: string, name: string) => void;
  onCreateFolder?: (parentPath: string, name: string) => void;
  onDeleteFile?: (fileId: string) => void;
  onRenameFile?: (fileId: string, newName: string) => void;
}

// File icons based on extension
const FILE_ICONS: Record<string, string> = {
  '.ts': '📘',
  '.tsx': '⚛️',
  '.js': '📒',
  '.jsx': '⚛️',
  '.json': '📋',
  '.md': '📝',
  '.css': '🎨',
  '.scss': '🎨',
  '.html': '🌐',
  '.py': '🐍',
  '.sql': '🗃️',
  '.yml': '⚙️',
  '.yaml': '⚙️',
  '.env': '🔒',
  '.gitignore': '🚫',
  default: '📄',
};

function getFileIcon(fileName: string): string {
  const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
  return FILE_ICONS[ext] || FILE_ICONS.default;
}

function FileTreeItem({
  node,
  depth,
  selectedFileId,
  onFileSelect,
  expandedFolders,
  toggleFolder,
}: {
  node: FileNode;
  depth: number;
  selectedFileId: string | null;
  onFileSelect: (file: FileNode) => void;
  expandedFolders: Set<string>;
  toggleFolder: (folderId: string) => void;
}) {
  const isFolder = node.type === 'folder';
  const isExpanded = expandedFolders.has(node.id);
  const isSelected = node.id === selectedFileId;

  return (
    <div>
      <button
        className={`
          w-full flex items-center gap-2 px-2 py-1 text-sm text-left
          hover:bg-[var(--bg-tertiary)] transition-colors
          ${isSelected ? 'bg-[var(--bg-tertiary)] text-[var(--accent)]' : 'text-[var(--text-primary)]'}
        `}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => {
          if (isFolder) {
            toggleFolder(node.id);
          } else {
            onFileSelect(node);
          }
        }}
      >
        {isFolder ? (
          <>
            <span className="text-xs opacity-60">{isExpanded ? '▼' : '▶'}</span>
            <span>📁</span>
          </>
        ) : (
          <>
            <span className="text-xs opacity-0">▶</span>
            <span>{getFileIcon(node.name)}</span>
          </>
        )}
        <span className="truncate">{node.name}</span>
      </button>

      {isFolder && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedFileId={selectedFileId}
              onFileSelect={onFileSelect}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({
  files,
  selectedFileId,
  onFileSelect,
}: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Filter files based on search
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;

    const filterNodes = (nodes: FileNode[]): FileNode[] => {
      return nodes
        .map((node) => {
          if (node.type === 'folder' && node.children) {
            const filteredChildren = filterNodes(node.children);
            if (filteredChildren.length > 0) {
              return { ...node, children: filteredChildren };
            }
          }
          if (node.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            return node;
          }
          return null;
        })
        .filter((node): node is FileNode => node !== null);
    };

    return filterNodes(files);
  }, [files, searchQuery]);

  return (
    <div className="file-tree h-full flex flex-col bg-[var(--bg-secondary)]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-default)]">
        <span className="text-sm font-medium text-[var(--text-primary)]">Files</span>
        <div className="flex gap-1">
          <button
            className="p-1 hover:bg-[var(--bg-tertiary)] rounded"
            title="New File"
          >
            📄
          </button>
          <button
            className="p-1 hover:bg-[var(--bg-tertiary)] rounded"
            title="New Folder"
          >
            📁
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-2 py-2">
        <input
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-2 py-1 text-sm bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
        />
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto">
        {filteredFiles.length === 0 ? (
          <div className="px-3 py-4 text-sm text-[var(--text-muted)] text-center">
            {searchQuery ? 'No files found' : 'No files yet'}
          </div>
        ) : (
          filteredFiles.map((node) => (
            <FileTreeItem
              key={node.id}
              node={node}
              depth={0}
              selectedFileId={selectedFileId}
              onFileSelect={onFileSelect}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default FileTree;
