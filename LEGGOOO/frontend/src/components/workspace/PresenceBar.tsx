/**
 * PresenceBar Component
 * Shows connected collaborators with cursor colors
 */

import { useState } from 'react';

export interface CollaboratorPresence {
  id: string;
  name: string;
  color: string;
  isEditor: boolean;
  isTyping?: boolean;
}

interface PresenceBarProps {
  collaborators: CollaboratorPresence[];
  maxVisible?: number;
}

export function PresenceBar({ collaborators, maxVisible = 5 }: PresenceBarProps) {
  const [showAll, setShowAll] = useState(false);
  
  const visible = collaborators.slice(0, maxVisible);
  const overflow = collaborators.length - maxVisible;

  return (
    <div className="presence-bar flex items-center gap-1 relative">
      {/* Visible avatars */}
      {visible.map((user, index) => (
        <div
          key={user.id}
          className="relative group"
          style={{ zIndex: visible.length - index }}
        >
          <div
            className={`
              w-8 h-8 rounded-full flex items-center justify-center 
              text-sm font-medium text-white border-2 border-[var(--bg-primary)]
              transition-transform hover:scale-110 hover:z-50
              ${user.isTyping ? 'animate-pulse' : ''}
            `}
            style={{ backgroundColor: user.color }}
            title={`${user.name}${user.isEditor ? '' : ' (viewer)'}`}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
          
          {/* Tooltip */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-xs rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
            {user.name}
            {!user.isEditor && <span className="text-[var(--text-muted)]"> (viewer)</span>}
            {user.isTyping && <span className="text-[var(--accent)]"> typing...</span>}
          </div>
        </div>
      ))}

      {/* Overflow indicator */}
      {overflow > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-xs text-[var(--text-muted)] border-2 border-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
          >
            +{overflow}
          </button>

          {/* Overflow dropdown */}
          {showAll && (
            <div className="absolute top-full right-0 mt-2 py-2 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg shadow-xl z-50 min-w-[160px]">
              {collaborators.slice(maxVisible).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--bg-tertiary)]"
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white"
                    style={{ backgroundColor: user.color }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-[var(--text-primary)]">{user.name}</span>
                  {!user.isEditor && (
                    <span className="text-xs text-[var(--text-muted)]">(viewer)</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PresenceBar;
