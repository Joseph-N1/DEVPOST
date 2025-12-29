/**
 * GitHub Import Modal
 * Allows users to import a repository into a workspace
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  private: boolean;
  defaultBranch: string;
  htmlUrl: string;
}

interface GitHubImportModalProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: { filesImported: number; branch: string }) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function GitHubImportModal({ workspaceId, isOpen, onClose, onSuccess }: GitHubImportModalProps) {
  const { getAccessToken } = useAuth();
  
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRepos = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;

    setIsLoadingRepos(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/github/repos`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch repositories');
      }

      const data = await response.json();
      setRepos(data.repos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load repositories');
    } finally {
      setIsLoadingRepos(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    if (isOpen) {
      fetchRepos();
    }
  }, [isOpen, fetchRepos]);

  const handleImport = async () => {
    if (!selectedRepo) return;

    setIsImporting(true);
    setError(null);

    const token = getAccessToken();
    if (!token) {
      setError('Not authenticated');
      setIsImporting(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/github/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          repoFullName: selectedRepo,
          workspaceId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      if (data.success) {
        onSuccess({
          filesImported: data.filesImported,
          branch: data.branch,
        });
        onClose();
      } else {
        setError(data.errors?.join(', ') || 'Import failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const filteredRepos = repos.filter(repo =>
    repo.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (repo.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)] w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Import from GitHub
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-[var(--border)]">
          <input
            type="text"
            placeholder="Search repositories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        {/* Repository list */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          {isLoadingRepos ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-[var(--accent)] border-t-transparent rounded-full"></div>
            </div>
          ) : filteredRepos.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-secondary)]">
              {searchQuery ? 'No repositories match your search' : 'No repositories found'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRepos.map((repo) => (
                <div
                  key={repo.id}
                  onClick={() => setSelectedRepo(repo.fullName)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedRepo === repo.fullName
                      ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                      : 'border-[var(--border)] hover:border-[var(--accent)]/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--text-primary)] font-medium">
                        {repo.fullName}
                      </span>
                      {repo.private && (
                        <span className="text-xs px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 rounded">
                          Private
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {repo.defaultBranch}
                    </span>
                  </div>
                  {repo.description && (
                    <p className="text-sm text-[var(--text-secondary)] mt-1 truncate">
                      {repo.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[var(--text-primary)] border border-[var(--border)] rounded-lg hover:bg-[var(--bg-primary)] transition-colors"
            disabled={isImporting}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!selectedRepo || isImporting}
            className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            {isImporting ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                Importing...
              </>
            ) : (
              'Import Repository'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
