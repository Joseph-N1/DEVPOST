/**
 * Yjs collaboration utilities
 * Handles document sync, awareness (cursors), and 5-editor cap enforcement
 */

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

// Types for awareness state
export interface AwarenessUser {
  id: string;
  name: string;
  color: string;
  cursor: { line: number; column: number } | null;
  selection: { start: { line: number; column: number }; end: { line: number; column: number } } | null;
  isEditor: boolean; // true = can edit, false = viewer (5-cap exceeded)
}

export interface CollaborationState {
  doc: Y.Doc;
  provider: WebsocketProvider;
  awareness: WebsocketProvider['awareness'];
  text: Y.Text;
  fileId: string;
}

// Presence colors for up to 5 editors (from ui_guidelines.md)
export const PRESENCE_COLORS = [
  '#FF6B6B', // --presence-1 (coral)
  '#4ECDC4', // --presence-2 (teal)
  '#45B7D1', // --presence-3 (sky blue)
  '#96CEB4', // --presence-4 (sage)
  '#FFEAA7', // --presence-5 (yellow)
];

// Max editors per file (from PRD.md)
export const MAX_EDITORS_PER_FILE = 5;

/**
 * Get WebSocket URL for y-websocket server
 */
export function getYjsWebSocketUrl(): string {
  const wsUrl = import.meta.env.VITE_YJS_WEBSOCKET_URL;
  if (wsUrl) return wsUrl;
  
  // Default to localhost in development
  if (import.meta.env.DEV) {
    return 'ws://localhost:1234';
  }
  
  // Production fallback
  return 'wss://yjs.leggooo.app';
}

/**
 * Create a collaboration session for a file
 */
export function createCollaborationSession(
  workspaceId: string,
  fileId: string,
  userId: string,
  userName: string
): CollaborationState {
  // Create Yjs document
  const doc = new Y.Doc();
  
  // Room name format: workspace-file to isolate documents
  const roomName = `${workspaceId}-${fileId}`;
  
  // Connect to y-websocket server
  const provider = new WebsocketProvider(
    getYjsWebSocketUrl(),
    roomName,
    doc,
    { connect: true }
  );
  
  // Get shared text type for Monaco binding
  const text = doc.getText('monaco');
  
  // Assign a color based on user order (will be reassigned by server if needed)
  const colorIndex = Math.abs(hashString(userId)) % PRESENCE_COLORS.length;
  
  // Set initial awareness state
  provider.awareness.setLocalStateField('user', {
    id: userId,
    name: userName,
    color: PRESENCE_COLORS[colorIndex],
    cursor: null,
    selection: null,
    isEditor: true, // Assume editor until server says otherwise
  } satisfies AwarenessUser);
  
  return {
    doc,
    provider,
    awareness: provider.awareness,
    text,
    fileId,
  };
}

/**
 * Destroy collaboration session and cleanup
 */
export function destroyCollaborationSession(state: CollaborationState): void {
  state.provider.disconnect();
  state.provider.destroy();
  state.doc.destroy();
}

/**
 * Get all users in the awareness state
 */
export function getAwarenessUsers(awareness: WebsocketProvider['awareness']): AwarenessUser[] {
  const users: AwarenessUser[] = [];
  
  awareness.getStates().forEach((state) => {
    if (state.user) {
      users.push(state.user as AwarenessUser);
    }
  });
  
  return users;
}

/**
 * Check if current user can edit (5-editor cap)
 */
export function canUserEdit(awareness: WebsocketProvider['awareness'], userId: string): boolean {
  const users = getAwarenessUsers(awareness);
  const editors = users.filter((u) => u.isEditor);
  
  // If user is already an editor, they can continue editing
  const currentUser = users.find((u) => u.id === userId);
  if (currentUser?.isEditor) {
    return true;
  }
  
  // If less than 5 editors, user can become an editor
  return editors.length < MAX_EDITORS_PER_FILE;
}

/**
 * Update cursor position in awareness
 */
export function updateCursor(
  awareness: WebsocketProvider['awareness'],
  cursor: { line: number; column: number } | null
): void {
  const currentState = awareness.getLocalState();
  if (currentState?.user) {
    awareness.setLocalStateField('user', {
      ...currentState.user,
      cursor,
    });
  }
}

/**
 * Update selection in awareness
 */
export function updateSelection(
  awareness: WebsocketProvider['awareness'],
  selection: { start: { line: number; column: number }; end: { line: number; column: number } } | null
): void {
  const currentState = awareness.getLocalState();
  if (currentState?.user) {
    awareness.setLocalStateField('user', {
      ...currentState.user,
      selection,
    });
  }
}

/**
 * Simple string hash for consistent color assignment
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}
