import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CollaborativeEditor } from '../../components/editor';
import { useAuth } from '../../contexts/AuthContext';
import { GitHubImportModal } from '../../components/github/GitHubImportModal';
import { GitHubPushButton } from '../../components/github/GitHubPushButton';
import { ChatPane } from '../../components/chat';
import { SnapshotPanel } from '../../components/snapshots';
import { useKeyboardShortcuts, createWorkspaceShortcuts } from '../../hooks/useKeyboardShortcuts';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  path?: string;
  language?: string;
}

interface Workspace {
  id: string;
  name: string;
  description?: string;
  github_repo?: string;
  github_branch?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface WorkspaceFile {
  id: string;
  workspace_id: string;
  path: string;
  name: string;
  content?: string;
  language?: string;
  created_at: string;
  updated_at: string;
}

interface Collaborator {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  isCurrentUser?: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Simple FileTree component (inline for now)
function FileTree({ 
  files, 
  selectedFile, 
  onFileSelect,
  level = 0 
}: { 
  files: FileNode[]; 
  selectedFile: FileNode | null;
  onFileSelect: (file: FileNode) => void;
  level?: number;
}) {
  return (
    <div className={level > 0 ? 'ml-3' : ''}>
      {files.map((node) => (
        <div key={node.id}>
          <button
            onClick={() => onFileSelect(node)}
            className={`w-full flex items-center gap-2 px-2 py-1 text-sm text-left hover:bg-gray-700 rounded ${
              selectedFile?.id === node.id ? 'bg-gray-700 text-white' : 'text-gray-300'
            }`}
          >
            {node.type === 'folder' ? (
              <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            <span className="truncate">{node.name}</span>
          </button>
          {node.children && node.children.length > 0 && (
            <FileTree 
              files={node.children} 
              selectedFile={selectedFile} 
              onFileSelect={onFileSelect}
              level={level + 1}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// Simple CollaboratorPresence component (inline for now)
function CollaboratorPresence({ collaborators }: { collaborators: Collaborator[] }) {
  return (
    <div className="flex -space-x-2">
      {collaborators.slice(0, 5).map((c) => (
        <div
          key={c.id}
          className="w-7 h-7 rounded-full border-2 border-gray-800 flex items-center justify-center text-xs font-medium"
          style={{ backgroundColor: c.color }}
          title={c.name}
        >
          {c.avatar ? (
            <img src={c.avatar} alt={c.name} className="w-full h-full rounded-full" />
          ) : (
            c.name.charAt(0).toUpperCase()
          )}
        </div>
      ))}
      {collaborators.length > 5 && (
        <div className="w-7 h-7 rounded-full border-2 border-gray-800 bg-gray-600 flex items-center justify-center text-xs">
          +{collaborators.length - 5}
        </div>
      )}
    </div>
  );
}

export default function WorkspacePage() {
  const { id: workspaceId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, getAccessToken } = useAuth();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [userRole, setUserRole] = useState<'owner' | 'editor' | 'viewer'>('viewer');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSnapshotsOpen, setIsSnapshotsOpen] = useState(false);
  const [selectedCode, _setSelectedCode] = useState<string | undefined>(undefined);
  // TODO: Connect setSelectedCode to editor selection events

  // Build file tree from flat file list
  const buildFileTree = useCallback((fileList: WorkspaceFile[]): FileNode[] => {
    const tree: FileNode[] = [];

    // Sort files by path for consistent ordering
    const sortedFiles = [...fileList].sort((a, b) => a.path.localeCompare(b.path));

    for (const file of sortedFiles) {
      const pathParts = file.path.split('/').filter(Boolean);
      let currentLevel = tree;
      let currentPath = '';

      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        currentPath += (currentPath ? '/' : '') + part;
        const isFile = i === pathParts.length - 1;

        let existing = currentLevel.find(n => n.name === part);

        if (!existing) {
          const newNode: FileNode = {
            id: isFile ? file.id : `folder-${currentPath}`,
            name: part,
            type: isFile ? 'file' : 'folder',
            path: currentPath,
            language: isFile ? file.language : undefined,
            children: isFile ? undefined : [],
          };
          currentLevel.push(newNode);
          existing = newNode;

          // Sort: folders first, then alphabetically
          currentLevel.sort((a, b) => {
            if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
            return a.name.localeCompare(b.name);
          });
        }

        if (!isFile && existing.children) {
          currentLevel = existing.children;
        }
      }
    }

    return tree;
  }, []);

  // Fetch workspace data
  const fetchWorkspace = useCallback(async () => {
    const accessToken = getAccessToken();
    if (!workspaceId || !accessToken) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch workspace details
      const wsResponse = await fetch(`${API_URL}/api/workspaces/${workspaceId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!wsResponse.ok) {
        if (wsResponse.status === 404) {
          throw new Error('Workspace not found');
        }
        if (wsResponse.status === 403) {
          throw new Error('You do not have access to this workspace');
        }
        throw new Error('Failed to fetch workspace');
      }

      const wsData = await wsResponse.json();
      setWorkspace(wsData.workspace);
      setUserRole(wsData.role || 'viewer');

      // Fetch files
      const filesResponse = await fetch(`${API_URL}/api/files/${workspaceId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        setFiles(filesData.files || []);
        setFileTree(buildFileTree(filesData.files || []));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, getAccessToken, buildFileTree]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  // Fetch file content when a file is selected
  const fetchFileContent = useCallback(async (fileId: string) => {
    const accessToken = getAccessToken();
    if (!accessToken) return;

    try {
      const response = await fetch(`${API_URL}/api/files/file/${fileId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        setFileContent(data.file.content || '');
      }
    } catch (err) {
      console.error('Failed to fetch file content:', err);
    }
  }, [getAccessToken]);

  const handleFileSelect = useCallback((file: FileNode) => {
    if (file.type === 'file') {
      setSelectedFile(file);
      fetchFileContent(file.id);
    }
  }, [fetchFileContent]);

  const handleImportComplete = useCallback((_result: { filesImported: number; branch: string }) => {
    setShowImportModal(false);
    fetchWorkspace(); // Refresh files after import
  }, [fetchWorkspace]);

  const handlePushComplete = useCallback((_commitSha: string) => {
    // Could show a notification or refresh data
    console.log('Push completed successfully');
  }, []);

  // Handle snapshot restore
  const handleSnapshotRestore = useCallback((content: string) => {
    setFileContent(content);
    // The editor will update via initialContent prop
  }, []);

  // Handle save snapshot
  const handleSaveSnapshot = useCallback(async () => {
    if (!selectedFile || !fileContent) return;
    
    try {
      const accessToken = getAccessToken();
      if (!accessToken) return;

      await fetch(`${API_URL}/api/snapshots/${selectedFile.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          content: fileContent,
          message: 'Quick save snapshot',
        }),
      });
    } catch (err) {
      console.error('Failed to create snapshot:', err);
    }
  }, [selectedFile, fileContent, getAccessToken]);

  // Keyboard shortcuts
  const shortcuts = useMemo(() => createWorkspaceShortcuts({
    onSaveSnapshot: handleSaveSnapshot,
    onToggleChat: () => setIsChatOpen(prev => !prev),
    onToggleSnapshots: () => setIsSnapshotsOpen(prev => !prev),
  }), [handleSaveSnapshot]);

  useKeyboardShortcuts(shortcuts);

  // Collaborators list (mock for now, will be populated by presence system)
  const collaborators = user ? [{
    id: user.id,
    name: user.displayName || user.email,
    avatar: user.avatarUrl,
    color: '#3B82F6',
    isCurrentUser: true,
  }] : [];

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-white mb-2">Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <header className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-white"
            title="Back to Dashboard"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="font-semibold text-sm">{workspace?.name || 'Workspace'}</h1>
            {workspace?.github_repo && (
              <a
                href={`https://github.com/${workspace.github_repo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-400 hover:text-blue-400 flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                {workspace.github_repo}
              </a>
            )}
          </div>
          <span className={`text-xs px-2 py-0.5 rounded ${
            userRole === 'owner' ? 'bg-purple-600' :
            userRole === 'editor' ? 'bg-green-600' : 'bg-gray-600'
          }`}>
            {userRole}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* GitHub Actions */}
          {workspace && !workspace.github_repo && userRole !== 'viewer' && (
            <button
              onClick={() => setShowImportModal(true)}
              className="px-3 py-1.5 text-xs bg-gray-700 text-white rounded hover:bg-gray-600 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Import from GitHub
            </button>
          )}

          {workspace?.github_repo && userRole !== 'viewer' && (
            <GitHubPushButton
              workspaceId={workspaceId!}
              githubRepo={workspace.github_repo}
              onPushSuccess={handlePushComplete}
            />
          )}

          {/* File count */}
          <span className="text-xs text-gray-400">
            {files.length} file{files.length !== 1 ? 's' : ''}
          </span>

          {/* Collaborator presence */}
          <CollaboratorPresence collaborators={collaborators} />

          {/* Chat toggle */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`p-2 rounded transition-colors ${isChatOpen ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            title="Toggle AI Chat (Ctrl+I)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>

          {/* Snapshots toggle */}
          <button
            onClick={() => setIsSnapshotsOpen(!isSnapshotsOpen)}
            className={`p-2 rounded transition-colors ${isSnapshotsOpen ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            title="Toggle Snapshots (Ctrl+Shift+H)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Tree Sidebar */}
        <aside className="w-64 bg-gray-800 border-r border-gray-700 flex-shrink-0 overflow-y-auto">
          <div className="p-3 border-b border-gray-700 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Files</span>
            {userRole !== 'viewer' && (
              <button
                className="text-gray-400 hover:text-white"
                title="New File"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
          </div>
          {fileTree.length > 0 ? (
            <FileTree
              files={fileTree}
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
            />
          ) : (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm mb-3">No files yet</p>
              {userRole !== 'viewer' && (
                <button
                  onClick={() => setShowImportModal(true)}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Import from GitHub
                </button>
              )}
            </div>
          )}
        </aside>

        {/* Editor Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {selectedFile ? (
            <>
              {/* Editor Tabs */}
              <div className="h-9 bg-gray-800 border-b border-gray-700 flex items-center px-2">
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-900 rounded-t text-sm">
                  <span>{selectedFile.name}</span>
                  <button className="text-gray-500 hover:text-white">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              {/* Monaco Editor */}
              <div className="flex-1">
                <CollaborativeEditor
                  workspaceId={workspaceId!}
                  fileId={selectedFile.id}
                  fileName={selectedFile.name}
                  userId={user?.id || 'anonymous'}
                  userName={user?.displayName || 'Anonymous'}
                  initialContent={fileContent}
                  readOnly={userRole === 'viewer'}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg mb-2">No file selected</p>
                <p className="text-sm">Select a file from the sidebar to start editing</p>
              </div>
            </div>
          )}
        </main>

        {/* Chat Pane */}
        {isChatOpen && (
          <aside className="w-80 bg-gray-800 border-l border-gray-700 flex-shrink-0 flex flex-col">
            <ChatPane
              workspaceId={workspaceId!}
              fileId={selectedFile?.id}
              fileName={selectedFile?.name}
              selectedCode={selectedCode}
              onClose={() => setIsChatOpen(false)}
            />
          </aside>
        )}

        {/* Snapshots Panel */}
        {isSnapshotsOpen && (
          <SnapshotPanel
            fileId={selectedFile?.id || null}
            fileName={selectedFile?.name || ''}
            currentContent={fileContent}
            onRestore={handleSnapshotRestore}
            onClose={() => setIsSnapshotsOpen(false)}
          />
        )}
      </div>

      {/* GitHub Import Modal */}
      <GitHubImportModal
        workspaceId={workspaceId!}
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={handleImportComplete}
      />
    </div>
  );
}
