/**
 * TopBar Component
 * Header with logo, workspace name, user menu, and push button
 */

import { useState } from 'react';
import { PresenceBar, type CollaboratorPresence } from './PresenceBar';

interface TopBarProps {
  workspaceName: string;
  userName: string;
  userAvatar?: string;
  collaborators: CollaboratorPresence[];
  onPush?: () => void;
  onSettings?: () => void;
  onLogout?: () => void;
  isPushing?: boolean;
  hasChanges?: boolean;
}

export function TopBar({
  workspaceName,
  userName,
  userAvatar,
  collaborators,
  onPush,
  onSettings,
  onLogout,
  isPushing = false,
  hasChanges = false,
}: TopBarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="top-bar h-14 flex items-center justify-between px-4 bg-[var(--bg-secondary)] border-b border-[var(--border-default)]">
      {/* Left: Logo + Workspace name */}
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚀</span>
          <span className="font-bold text-lg text-[var(--text-primary)]">LEGGOOO</span>
        </div>

        {/* Workspace badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-tertiary)] rounded-lg">
          <span className="text-sm text-[var(--text-muted)]">📁</span>
          <span className="text-sm font-medium text-[var(--text-primary)]">{workspaceName}</span>
        </div>
      </div>

      {/* Center: Presence bar */}
      <div className="flex items-center">
        <PresenceBar collaborators={collaborators} />
      </div>

      {/* Right: Push button + User menu */}
      <div className="flex items-center gap-3">
        {/* Push button */}
        <button
          onClick={onPush}
          disabled={isPushing || !hasChanges}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
            transition-all
            ${hasChanges 
              ? 'bg-[var(--accent)] text-white hover:opacity-90' 
              : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] cursor-not-allowed'
            }
            ${isPushing ? 'opacity-70 cursor-wait' : ''}
          `}
        >
          {isPushing ? (
            <>
              <span className="animate-spin">⏳</span>
              Pushing...
            </>
          ) : (
            <>
              <span>⬆️</span>
              Push to GitHub
            </>
          )}
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-medium">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm text-[var(--text-primary)]">{userName}</span>
            <span className="text-xs text-[var(--text-muted)]">▼</span>
          </button>

          {/* Dropdown menu */}
          {showUserMenu && (
            <div className="absolute top-full right-0 mt-2 py-2 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg shadow-xl z-50 min-w-[180px]">
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onSettings?.();
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] text-left"
              >
                ⚙️ Settings
              </button>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onLogout?.();
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-[var(--bg-tertiary)] text-left"
              >
                🚪 Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default TopBar;
