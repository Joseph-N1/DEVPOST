/**
 * Database Types for Supabase - Backend
 * Simplified types that match the actual database schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Role = 'owner' | 'editor' | 'viewer';
export type Theme = 'light' | 'dark' | 'anime' | 'neon-city' | 'space-explorer' | 'nature-forest' | 'mechanical' | 'aviation';

// Database interface compatible with Supabase generic
export interface Database {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: UserInsert;
        Update: UserUpdate;
      };
      workspaces: {
        Row: WorkspaceRow;
        Insert: WorkspaceInsert;
        Update: WorkspaceUpdate;
      };
      files: {
        Row: FileRow;
        Insert: FileInsert;
        Update: FileUpdate;
      };
      sessions: {
        Row: SessionRow;
        Insert: SessionInsert;
        Update: SessionUpdate;
      };
      permissions: {
        Row: PermissionRow;
        Insert: PermissionInsert;
        Update: PermissionUpdate;
      };
      presence: {
        Row: PresenceRow;
        Insert: PresenceInsert;
        Update: PresenceUpdate;
      };
      ai_requests: {
        Row: AIRequestRow;
        Insert: AIRequestInsert;
        Update: AIRequestUpdate;
      };
      invite_links: {
        Row: InviteLinkRow;
        Insert: InviteLinkInsert;
        Update: InviteLinkUpdate;
      };
      snapshots: {
        Row: SnapshotRow;
        Insert: SnapshotInsert;
        Update: SnapshotUpdate;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      role: Role;
    };
  };
}

// User types
export interface UserRow {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  github_token: string | null;
  theme: string;
  created_at: string;
}

export interface UserInsert {
  id?: string;
  email: string;
  display_name: string;
  avatar_url?: string | null;
  github_token?: string | null;
  theme?: string;
  created_at?: string;
}

export interface UserUpdate {
  email?: string;
  display_name?: string;
  avatar_url?: string | null;
  github_token?: string | null;
  theme?: string;
}

// Workspace types
export interface WorkspaceRow {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  github_repo: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceInsert {
  id?: string;
  name: string;
  description?: string | null;
  owner_id: string;
  github_repo?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface WorkspaceUpdate {
  name?: string;
  description?: string | null;
  github_repo?: string | null;
  updated_at?: string;
}

// File types
export interface FileRow {
  id: string;
  workspace_id: string;
  path: string;
  content: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface FileInsert {
  id?: string;
  workspace_id: string;
  path: string;
  content?: string;
  language?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FileUpdate {
  path?: string;
  content?: string;
  language?: string;
  updated_at?: string;
}

// Session types
export interface SessionRow {
  id: string;
  workspace_id: string;
  user_id: string;
  file_id: string | null;
  last_seen: string;
  created_at: string;
}

export interface SessionInsert {
  id?: string;
  workspace_id: string;
  user_id: string;
  file_id?: string | null;
  last_seen?: string;
  created_at?: string;
}

export interface SessionUpdate {
  file_id?: string | null;
  last_seen?: string;
}

// Permission types
export interface PermissionRow {
  id: string;
  workspace_id: string;
  user_id: string;
  role: Role;
  created_at: string;
}

export interface PermissionInsert {
  id?: string;
  workspace_id: string;
  user_id: string;
  role: Role;
  created_at?: string;
}

export interface PermissionUpdate {
  role?: Role;
}

// Presence types
export interface PresenceRow {
  id: string;
  session_id: string;
  cursor_position: Json | null;
  selection: Json | null;
  updated_at: string;
}

export interface PresenceInsert {
  id?: string;
  session_id: string;
  cursor_position?: Json | null;
  selection?: Json | null;
  updated_at?: string;
}

export interface PresenceUpdate {
  cursor_position?: Json | null;
  selection?: Json | null;
  updated_at?: string;
}

// AI Request types
export interface AIRequestRow {
  id: string;
  user_id: string;
  workspace_id: string | null;
  prompt_hash: string;
  action: string;
  tokens_used: number;
  created_at: string;
}

export interface AIRequestInsert {
  id?: string;
  user_id: string;
  workspace_id?: string | null;
  prompt_hash: string;
  action: string;
  tokens_used?: number;
  created_at?: string;
}

export interface AIRequestUpdate {
  tokens_used?: number;
}

// Invite Link types
export interface InviteLinkRow {
  id: string;
  workspace_id: string;
  token: string;
  role: Role;
  created_by: string;
  used: boolean;
  expires_at: string;
  created_at: string;
}

export interface InviteLinkInsert {
  id?: string;
  workspace_id: string;
  token: string;
  role: Role;
  created_by: string;
  used?: boolean;
  expires_at: string;
  created_at?: string;
}

export interface InviteLinkUpdate {
  used?: boolean;
}

// Snapshot types
export interface SnapshotRow {
  id: string;
  file_id: string;
  content: string;
  created_by: string | null;
  message: string | null;
  created_at: string;
}

export interface SnapshotInsert {
  id?: string;
  file_id: string;
  content: string;
  created_by?: string | null;
  message?: string | null;
  created_at?: string;
}

export interface SnapshotUpdate {
  message?: string | null;
}

// Convenience type aliases
export type User = UserRow;
export type Workspace = WorkspaceRow;
export type File = FileRow;
export type Session = SessionRow;
export type Permission = PermissionRow;
export type Presence = PresenceRow;
export type AIRequest = AIRequestRow;
export type InviteLink = InviteLinkRow;
export type Snapshot = SnapshotRow;
