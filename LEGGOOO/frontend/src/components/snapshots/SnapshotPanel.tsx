import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface Snapshot {
  id: string;
  file_id: string;
  content: string;
  message: string | null;
  created_at: string;
  created_by: string;
  creator?: {
    username: string;
    avatar_url: string | null;
  };
}

interface SnapshotPanelProps {
  fileId: string | null;
  fileName: string;
  currentContent: string;
  onRestore: (content: string) => void;
  onClose: () => void;
}

export function SnapshotPanel({
  fileId,
  fileName,
  currentContent,
  onRestore,
  onClose,
}: SnapshotPanelProps) {
  const { getAccessToken } = useAuth();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [snapshotMessage, setSnapshotMessage] = useState('');
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchSnapshots = useCallback(async () => {
    if (!fileId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = await getAccessToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/snapshots/${fileId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch snapshots');
      }
      
      const data = await response.json();
      setSnapshots(data.snapshots || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [fileId, getAccessToken]);

  useEffect(() => {
    fetchSnapshots();
  }, [fetchSnapshots]);

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileId) return;
    
    setCreating(true);
    setError(null);
    
    try {
      const token = await getAccessToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/snapshots/${fileId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: currentContent,
            message: snapshotMessage || undefined,
          }),
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to create snapshot');
      }
      
      setSnapshotMessage('');
      setShowCreateForm(false);
      await fetchSnapshots();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setCreating(false);
    }
  };

  const handleRestoreSnapshot = async (snapshot: Snapshot) => {
    if (!snapshot.id) return;
    
    setRestoring(snapshot.id);
    setError(null);
    
    try {
      const token = await getAccessToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/snapshots/restore/${snapshot.id}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to restore snapshot');
      }
      
      onRestore(snapshot.content);
      setSelectedSnapshot(null);
      await fetchSnapshots();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setRestoring(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Less than 1 minute
    if (diff < 60 * 1000) {
      return 'Just now';
    }
    
    // Less than 1 hour
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes}m ago`;
    }
    
    // Less than 24 hours
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours}h ago`;
    }
    
    // Less than 7 days
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `${days}d ago`;
    }
    
    // Format as date
    return date.toLocaleDateString();
  };

  const getPreviewLines = (content: string, maxLines = 5) => {
    const lines = content.split('\n').slice(0, maxLines);
    return lines.join('\n') + (content.split('\n').length > maxLines ? '\n...' : '');
  };

  if (!fileId) {
    return (
      <div className="flex flex-col h-full bg-[var(--bg-secondary)] border-l border-[var(--border)]">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Snapshots</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--bg-tertiary)] rounded transition-colors"
            aria-label="Close snapshots panel"
          >
            <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-[var(--text-secondary)] text-center">
            Select a file to view its snapshots
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--bg-secondary)] border-l border-[var(--border)] w-80">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] truncate">
            Snapshots
          </h2>
          <p className="text-xs text-[var(--text-secondary)] truncate" title={fileName}>
            {fileName}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-[var(--bg-tertiary)] rounded transition-colors ml-2"
          aria-label="Close snapshots panel"
        >
          <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Create Snapshot Button/Form */}
      <div className="p-3 border-b border-[var(--border)]">
        {showCreateForm ? (
          <form onSubmit={handleCreateSnapshot} className="space-y-2">
            <input
              type="text"
              value={snapshotMessage}
              onChange={(e) => setSnapshotMessage(e.target.value)}
              placeholder="Snapshot message (optional)"
              className="w-full px-3 py-2 text-sm bg-[var(--bg-primary)] border border-[var(--border)] rounded-md text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="flex-1 px-3 py-1.5 text-sm font-medium bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setSnapshotMessage('');
                }}
                className="px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent-hover)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Snapshot
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-3 mt-3 p-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md">
          {error}
        </div>
      )}

      {/* Snapshots List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-[var(--accent)] border-t-transparent"></div>
          </div>
        ) : snapshots.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <svg className="w-12 h-12 text-[var(--text-tertiary)] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-[var(--text-secondary)]">No snapshots yet</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              Create a snapshot to save the current state
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {snapshots.map((snapshot) => (
              <div
                key={snapshot.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedSnapshot?.id === snapshot.id
                    ? 'bg-[var(--accent)]/10 border-[var(--accent)]'
                    : 'bg-[var(--bg-primary)] border-[var(--border)] hover:border-[var(--accent)]/50'
                }`}
                onClick={() => setSelectedSnapshot(
                  selectedSnapshot?.id === snapshot.id ? null : snapshot
                )}
              >
                {/* Snapshot Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {snapshot.message || 'Manual snapshot'}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {formatDate(snapshot.created_at)}
                    </p>
                  </div>
                  {snapshot.creator && (
                    <div className="flex items-center ml-2" title={snapshot.creator.username}>
                      {snapshot.creator.avatar_url ? (
                        <img
                          src={snapshot.creator.avatar_url}
                          alt={snapshot.creator.username}
                          className="w-5 h-5 rounded-full"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-[var(--accent)] flex items-center justify-center">
                          <span className="text-xs text-white font-medium">
                            {snapshot.creator.username[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Expanded Content */}
                {selectedSnapshot?.id === snapshot.id && (
                  <div className="mt-3 space-y-3">
                    {/* Preview */}
                    <div className="bg-[var(--bg-tertiary)] rounded-md p-2 overflow-hidden">
                      <pre className="text-xs text-[var(--text-secondary)] font-mono whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
                        {getPreviewLines(snapshot.content)}
                      </pre>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestoreSnapshot(snapshot);
                        }}
                        disabled={restoring === snapshot.id}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {restoring === snapshot.id ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                            Restoring...
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Restore
                          </>
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(snapshot.content);
                        }}
                        className="px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-md transition-colors"
                        title="Copy content"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Keyboard Shortcut Hint */}
      <div className="p-3 border-t border-[var(--border)]">
        <p className="text-xs text-[var(--text-tertiary)] text-center">
          <kbd className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded text-[var(--text-secondary)]">Ctrl</kbd>
          {' + '}
          <kbd className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded text-[var(--text-secondary)]">Shift</kbd>
          {' + '}
          <kbd className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded text-[var(--text-secondary)]">S</kbd>
          {' to quick save'}
        </p>
      </div>
    </div>
  );
}
