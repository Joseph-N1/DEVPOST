/**
 * CollaborativeEditor - Monaco editor with Yjs real-time collaboration
 * 
 * Features:
 * - Real-time sync via y-websocket
 * - Cursor presence (shows other users' cursors)
 * - 5-editor cap enforcement (6th+ becomes viewer)
 * - Language detection based on file extension
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { MonacoBinding } from 'y-monaco';
import type * as monacoEditor from 'monaco-editor';
import {
  createCollaborationSession,
  destroyCollaborationSession,
  getAwarenessUsers,
  updateCursor,
  updateSelection,
  canUserEdit,
  type CollaborationState,
  type AwarenessUser,
} from '../../lib/yjs';

interface CollaborativeEditorProps {
  workspaceId: string;
  fileId: string;
  fileName: string;
  userId: string;
  userName: string;
  initialContent?: string;
  onContentChange?: (content: string) => void;
  readOnly?: boolean;
}

// Map file extensions to Monaco languages
const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.py': 'python',
  '.json': 'json',
  '.html': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.md': 'markdown',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.sql': 'sql',
  '.sh': 'shell',
  '.bash': 'shell',
  '.ps1': 'powershell',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
  '.c': 'c',
  '.cpp': 'cpp',
  '.h': 'c',
  '.hpp': 'cpp',
};

function getLanguageFromFileName(fileName: string): string {
  const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
  return EXTENSION_TO_LANGUAGE[ext] || 'plaintext';
}

export function CollaborativeEditor({
  workspaceId,
  fileId,
  fileName,
  userId,
  userName,
  initialContent = '',
  onContentChange,
  readOnly = false,
}: CollaborativeEditorProps) {
  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const collabRef = useRef<CollaborationState | null>(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [isViewerMode, setIsViewerMode] = useState(readOnly);
  const [collaborators, setCollaborators] = useState<AwarenessUser[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const language = getLanguageFromFileName(fileName);

  // Handle editor mount
  const handleEditorMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;

    // Initialize collaboration after editor is ready
    initializeCollaboration(editor);
  }, [workspaceId, fileId, userId, userName, initialContent]);

  // Initialize Yjs collaboration
  const initializeCollaboration = useCallback((
    editor: monacoEditor.editor.IStandaloneCodeEditor
  ) => {
    try {
      // Create collaboration session
      const collab = createCollaborationSession(workspaceId, fileId, userId, userName);
      collabRef.current = collab;

      // Set initial content if document is empty
      if (collab.text.length === 0 && initialContent) {
        collab.text.insert(0, initialContent);
      }

      // Create Monaco binding
      const binding = new MonacoBinding(
        collab.text,
        editor.getModel()!,
        new Set([editor]),
        collab.awareness
      );
      bindingRef.current = binding;

      // Handle connection status
      collab.provider.on('status', ({ status }: { status: string }) => {
        setIsConnected(status === 'connected');
        if (status === 'connected') {
          setConnectionError(null);
        }
      });

      // Handle connection errors
      collab.provider.on('connection-error', (event: Event) => {
        console.error('WebSocket connection error:', event);
        setConnectionError('Failed to connect to collaboration server');
      });

      // Handle awareness changes (other users joining/leaving)
      collab.awareness.on('change', () => {
        const users = getAwarenessUsers(collab.awareness);
        setCollaborators(users.filter((u) => u.id !== userId));

        // Check if user should be in viewer mode (5-editor cap)
        const canEdit = canUserEdit(collab.awareness, userId);
        setIsViewerMode(readOnly || !canEdit);
        
        // Update editor read-only state
        editor.updateOptions({ readOnly: readOnly || !canEdit });
      });

      // Track cursor position
      editor.onDidChangeCursorPosition((e: monacoEditor.editor.ICursorPositionChangedEvent) => {
        updateCursor(collab.awareness, {
          line: e.position.lineNumber,
          column: e.position.column,
        });
      });

      // Track selection
      editor.onDidChangeCursorSelection((e: monacoEditor.editor.ICursorSelectionChangedEvent) => {
        const sel = e.selection;
        if (sel.isEmpty()) {
          updateSelection(collab.awareness, null);
        } else {
          updateSelection(collab.awareness, {
            start: { line: sel.startLineNumber, column: sel.startColumn },
            end: { line: sel.endLineNumber, column: sel.endColumn },
          });
        }
      });

      // Notify parent of content changes
      if (onContentChange) {
        collab.text.observe(() => {
          onContentChange(collab.text.toString());
        });
      }

    } catch (error) {
      console.error('Failed to initialize collaboration:', error);
      setConnectionError('Failed to initialize collaboration');
    }
  }, [workspaceId, fileId, userId, userName, initialContent, readOnly, onContentChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
      }
      if (collabRef.current) {
        destroyCollaborationSession(collabRef.current);
      }
    };
  }, []);

  return (
    <div className="collaborative-editor h-full flex flex-col">
      {/* Status bar */}
      <div className="editor-status-bar flex items-center justify-between px-3 py-1.5 bg-[var(--bg-secondary)] border-b border-[var(--border-default)] text-sm">
        <div className="flex items-center gap-3">
          {/* Connection status */}
          <div className="flex items-center gap-1.5">
            <span 
              className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
              title={isConnected ? 'Connected' : 'Disconnected'}
            />
            <span className="text-[var(--text-muted)]">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>

          {/* Viewer mode indicator */}
          {isViewerMode && !readOnly && (
            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-600 rounded text-xs">
              Viewer (max editors reached)
            </span>
          )}

          {/* Language */}
          <span className="text-[var(--text-muted)]">{language}</span>
        </div>

        {/* Collaborators */}
        <div className="flex items-center gap-1">
          {collaborators.slice(0, 5).map((user) => (
            <div
              key={user.id}
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
              style={{ backgroundColor: user.color }}
              title={`${user.name}${user.isEditor ? '' : ' (viewer)'}`}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          ))}
          {collaborators.length > 5 && (
            <div className="w-6 h-6 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-xs text-[var(--text-muted)]">
              +{collaborators.length - 5}
            </div>
          )}
        </div>
      </div>

      {/* Connection error */}
      {connectionError && (
        <div className="px-3 py-2 bg-red-500/10 text-red-500 text-sm">
          {connectionError}
        </div>
      )}

      {/* Monaco Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          onMount={handleEditorMount}
          options={{
            readOnly: isViewerMode,
            minimap: { enabled: true },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            lineNumbers: 'on',
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            padding: { top: 8, bottom: 8 },
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            bracketPairColorization: { enabled: true },
          }}
        />
      </div>
    </div>
  );
}

export default CollaborativeEditor;
