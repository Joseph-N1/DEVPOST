/**
 * GitHub Push Button
 * Push workspace changes to GitHub
 */

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface GitHubPushButtonProps {
  workspaceId: string;
  githubRepo: string | null;
  onPushSuccess?: (commitSha: string) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function GitHubPushButton({ workspaceId, githubRepo, onPushSuccess }: GitHubPushButtonProps) {
  const { getAccessToken } = useAuth();
  
  const [isPushing, setIsPushing] = useState(false);
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handlePush = async () => {
    if (!commitMessage.trim()) return;

    setIsPushing(true);
    setError(null);
    setSuccess(null);

    const token = getAccessToken();
    if (!token) {
      setError('Not authenticated');
      setIsPushing(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/github/push/${workspaceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: commitMessage }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Push failed');
      }

      if (data.success) {
        setSuccess(`Pushed to ${githubRepo} (${data.commitSha?.slice(0, 7)})`);
        setShowCommitModal(false);
        setCommitMessage('');
        onPushSuccess?.(data.commitSha);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Push failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Push failed');
    } finally {
      setIsPushing(false);
    }
  };

  if (!githubRepo) {
    return null;
  }

  return (
    <>
      {/* Push button */}
      <button
        onClick={() => setShowCommitModal(true)}
        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
        title={`Push to ${githubRepo}`}
      >
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
        Push
      </button>

      {/* Success toast */}
      {success && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          ✓ {success}
        </div>
      )}

      {/* Commit message modal */}
      {showCommitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)] w-full max-w-md">
            <div className="p-4 border-b border-[var(--border)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                Push to GitHub
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Pushing to {githubRepo}
              </p>
            </div>

            <div className="p-4">
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
                  {error}
                </div>
              )}

              <label className="block text-sm text-[var(--text-secondary)] mb-2">
                Commit message
              </label>
              <textarea
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Describe your changes..."
                className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] resize-none"
                rows={3}
                autoFocus
              />
            </div>

            <div className="p-4 border-t border-[var(--border)] flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCommitModal(false);
                  setCommitMessage('');
                  setError(null);
                }}
                className="px-4 py-2 text-[var(--text-primary)] border border-[var(--border)] rounded-lg hover:bg-[var(--bg-primary)] transition-colors"
                disabled={isPushing}
              >
                Cancel
              </button>
              <button
                onClick={handlePush}
                disabled={!commitMessage.trim() || isPushing}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isPushing ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    Pushing...
                  </>
                ) : (
                  'Push Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
