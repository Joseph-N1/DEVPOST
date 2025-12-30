/**
 * Dashboard Page
 * Shows user's workspaces and allows creating new ones
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeToggle } from '../../components/ui/ThemeToggle';

interface Owner {
  id: string;
  display_name: string;
  avatar_url?: string;
}

interface Workspace {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  owner: Owner;
  userRole: 'owner' | 'editor' | 'viewer';
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function DashboardPage() {
  const { user, signOut, getAccessToken } = useAuth();
  const navigate = useNavigate();
  
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const fetchWorkspaces = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    
    try {
      const response = await fetch(`${API_URL}/api/workspaces`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch workspaces');
      }
      
      const data = await response.json();
      setWorkspaces(data.workspaces);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workspaces');
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken]);
  
  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);
  
  const createWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    
    setIsCreating(true);
    const token = getAccessToken();
    
    try {
      const response = await fetch(`${API_URL}/api/workspaces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newWorkspaceName.trim(),
          description: newWorkspaceDescription.trim() || undefined,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create workspace');
      }
      
      const data = await response.json();
      
      // Navigate to the new workspace
      navigate(`/workspace/${data.workspace.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workspace');
      setIsCreating(false);
    }
  };
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-[var(--accent)] text-white';
      case 'editor':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };
  
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-[var(--accent)]">LEGGOOO</h1>
          
          <div className="flex items-center gap-4">
            <ThemeToggle size="sm" />
            <div className="flex items-center gap-2">
              {user?.avatarUrl && (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="text-[var(--text-primary)] text-sm">
                {user?.displayName}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Your Workspaces</h2>
            <p className="text-[var(--text-secondary)] mt-1">
              Create and manage your collaborative coding projects
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <span className="text-lg">+</span>
            <span>New Workspace</span>
          </button>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        )}
        
        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-[var(--accent)] border-t-transparent rounded-full"></div>
          </div>
        )}
        
        {/* Empty state */}
        {!isLoading && workspaces.length === 0 && (
          <div className="text-center py-12 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)]">
            <div className="text-5xl mb-4">📁</div>
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
              No workspaces yet
            </h3>
            <p className="text-[var(--text-secondary)] mb-4">
              Create your first workspace to start coding collaboratively
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Create Workspace
            </button>
          </div>
        )}
        
        {/* Workspaces grid */}
        {!isLoading && workspaces.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.map((workspace) => (
              <div
                key={workspace.id}
                onClick={() => navigate(`/workspace/${workspace.id}`)}
                className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)] p-4 hover:border-[var(--accent)] transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-medium text-[var(--text-primary)] truncate">
                    {workspace.name}
                  </h3>
                  <span className={`text-xs px-2 py-0.5 rounded ${getRoleBadgeColor(workspace.userRole)}`}>
                    {workspace.userRole}
                  </span>
                </div>
                {workspace.description && (
                  <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">
                    {workspace.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                  <div className="flex items-center gap-2">
                    {workspace.owner.avatar_url && (
                      <img
                        src={workspace.owner.avatar_url}
                        alt=""
                        className="w-4 h-4 rounded-full"
                      />
                    )}
                    <span>{workspace.owner.display_name}</span>
                  </div>
                  <span>Updated {formatDate(workspace.updated_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      
      {/* Create workspace modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)] p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Create New Workspace
            </h3>
            
            <form onSubmit={createWorkspace}>
              <div className="mb-4">
                <label className="block text-sm text-[var(--text-secondary)] mb-1">
                  Workspace Name *
                </label>
                <input
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="My Awesome Project"
                  className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)]"
                  maxLength={100}
                  required
                  autoFocus
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm text-[var(--text-secondary)] mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newWorkspaceDescription}
                  onChange={(e) => setNewWorkspaceDescription(e.target.value)}
                  placeholder="What are you building?"
                  className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] resize-none"
                  rows={3}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewWorkspaceName('');
                    setNewWorkspaceDescription('');
                  }}
                  className="flex-1 px-4 py-2 border border-[var(--border)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-primary)] transition-colors"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newWorkspaceName.trim()}
                  className="flex-1 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
