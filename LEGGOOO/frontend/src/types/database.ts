/**
 * Database Types for Supabase
 * Generated from tech_stack_overview.md DDL schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          oauth_provider: string;
          oauth_id: string;
          display_name: string | null;
          email: string | null;
          avatar_initial: string | null;
          github_token_encrypted: string | null;
          preferences: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          oauth_provider: string;
          oauth_id: string;
          display_name?: string | null;
          email?: string | null;
          avatar_initial?: string | null;
          github_token_encrypted?: string | null;
          preferences?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          oauth_provider?: string;
          oauth_id?: string;
          display_name?: string | null;
          email?: string | null;
          avatar_initial?: string | null;
          github_token_encrypted?: string | null;
          preferences?: Json;
          created_at?: string;
        };
      };
      workspaces: {
        Row: {
          id: string;
          owner_id: string | null;
          name: string;
          description: string | null;
          repo_url: string | null;
          imported_branch: string | null;
          visibility: 'private' | 'public';
          created_at: string;
          last_active: string;
        };
        Insert: {
          id?: string;
          owner_id?: string | null;
          name: string;
          description?: string | null;
          repo_url?: string | null;
          imported_branch?: string | null;
          visibility?: 'private' | 'public';
          created_at?: string;
          last_active?: string;
        };
        Update: {
          id?: string;
          owner_id?: string | null;
          name?: string;
          description?: string | null;
          repo_url?: string | null;
          imported_branch?: string | null;
          visibility?: 'private' | 'public';
          created_at?: string;
          last_active?: string;
        };
      };
      files: {
        Row: {
          id: string;
          workspace_id: string;
          path: string;
          filename: string;
          contents: string | null;
          creator_user_id: string | null;
          created_at: string;
          is_locked_in_main: boolean;
          last_commit_sha: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          path: string;
          filename: string;
          contents?: string | null;
          creator_user_id?: string | null;
          created_at?: string;
          is_locked_in_main?: boolean;
          last_commit_sha?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          path?: string;
          filename?: string;
          contents?: string | null;
          creator_user_id?: string | null;
          created_at?: string;
          is_locked_in_main?: boolean;
          last_commit_sha?: string | null;
        };
      };
      sessions: {
        Row: {
          id: string;
          workspace_id: string;
          session_token: string | null;
          started_at: string;
          expires_at: string | null;
          active_users: Json;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          session_token?: string | null;
          started_at?: string;
          expires_at?: string | null;
          active_users?: Json;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          session_token?: string | null;
          started_at?: string;
          expires_at?: string | null;
          active_users?: Json;
        };
      };
      permissions: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: 'owner' | 'editor' | 'viewer';
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role?: 'owner' | 'editor' | 'viewer';
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          role?: 'owner' | 'editor' | 'viewer';
        };
      };
      presence: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          file_id: string | null;
          cursor_position: Json | null;
          selection_range: Json | null;
          last_active: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          file_id?: string | null;
          cursor_position?: Json | null;
          selection_range?: Json | null;
          last_active?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string;
          file_id?: string | null;
          cursor_position?: Json | null;
          selection_range?: Json | null;
          last_active?: string;
        };
      };
      ai_requests: {
        Row: {
          id: string;
          session_id: string | null;
          user_id: string | null;
          prompt_hash: string | null;
          prompt: string | null;
          response: string | null;
          model_used: string | null;
          latency_ms: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id?: string | null;
          user_id?: string | null;
          prompt_hash?: string | null;
          prompt?: string | null;
          response?: string | null;
          model_used?: string | null;
          latency_ms?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string | null;
          user_id?: string | null;
          prompt_hash?: string | null;
          prompt?: string | null;
          response?: string | null;
          model_used?: string | null;
          latency_ms?: number | null;
          created_at?: string;
        };
      };
      invite_links: {
        Row: {
          id: string;
          workspace_id: string;
          token: string;
          access_level: 'editor' | 'viewer';
          created_by: string;
          created_at: string;
          expires_at: string | null;
          uses_remaining: number | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          token: string;
          access_level?: 'editor' | 'viewer';
          created_by: string;
          created_at?: string;
          expires_at?: string | null;
          uses_remaining?: number | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          token?: string;
          access_level?: 'editor' | 'viewer';
          created_by?: string;
          created_at?: string;
          expires_at?: string | null;
          uses_remaining?: number | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      role_type: 'owner' | 'editor' | 'viewer';
      visibility_type: 'private' | 'public';
      access_level_type: 'editor' | 'viewer';
    };
  };
}

// Convenience types
export type User = Database['public']['Tables']['users']['Row'];
export type Workspace = Database['public']['Tables']['workspaces']['Row'];
export type File = Database['public']['Tables']['files']['Row'];
export type Session = Database['public']['Tables']['sessions']['Row'];
export type Permission = Database['public']['Tables']['permissions']['Row'];
export type Presence = Database['public']['Tables']['presence']['Row'];
export type AIRequest = Database['public']['Tables']['ai_requests']['Row'];
export type InviteLink = Database['public']['Tables']['invite_links']['Row'];

export type Role = 'owner' | 'editor' | 'viewer';
export type Visibility = 'private' | 'public';
export type AccessLevel = 'editor' | 'viewer';
