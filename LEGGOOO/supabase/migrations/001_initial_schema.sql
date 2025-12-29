-- LEGGOOO Database Schema
-- Run this in Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  github_token TEXT, -- Encrypted GitHub access token
  theme VARCHAR(20) DEFAULT 'dark',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  github_repo VARCHAR(255), -- Format: owner/repo
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Files table
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  path VARCHAR(500) NOT NULL,
  content TEXT DEFAULT '',
  language VARCHAR(50) DEFAULT 'plaintext',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, path)
);

-- Permissions table (workspace access control)
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- Sessions table (active editing sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_id UUID REFERENCES files(id) ON DELETE SET NULL,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Presence table (real-time presence tracking)
CREATE TABLE IF NOT EXISTS presence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  cursor_position JSONB, -- {line: number, column: number}
  selection JSONB, -- {start: {line, column}, end: {line, column}}
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Requests table (audit log for AI interactions)
CREATE TABLE IF NOT EXISTS ai_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  prompt_hash VARCHAR(64) NOT NULL, -- SHA-256 of prompt (for rate limiting)
  action VARCHAR(50) NOT NULL, -- 'explain', 'improve', 'debug', 'generate'
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invite Links table
CREATE TABLE IF NOT EXISTS invite_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  token VARCHAR(64) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('editor', 'viewer')),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Snapshots table (for code history/versioning)
CREATE TABLE IF NOT EXISTS snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  message VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_files_workspace ON files(workspace_id);
CREATE INDEX IF NOT EXISTS idx_permissions_workspace ON permissions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_permissions_user ON permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_workspace ON sessions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_requests_user ON ai_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_requests_created ON ai_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_invite_links_token ON invite_links(token);
CREATE INDEX IF NOT EXISTS idx_snapshots_file ON snapshots(file_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid()::text = id::text);

-- Workspaces policies
CREATE POLICY "Users can view workspaces they have access to"
  ON workspaces FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM permissions
      WHERE permissions.workspace_id = workspaces.id
      AND permissions.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can create workspaces"
  ON workspaces FOR INSERT
  WITH CHECK (owner_id::text = auth.uid()::text);

CREATE POLICY "Owners can update their workspaces"
  ON workspaces FOR UPDATE
  USING (owner_id::text = auth.uid()::text);

CREATE POLICY "Owners can delete their workspaces"
  ON workspaces FOR DELETE
  USING (owner_id::text = auth.uid()::text);

-- Files policies
CREATE POLICY "Users can view files in accessible workspaces"
  ON files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM permissions
      WHERE permissions.workspace_id = files.workspace_id
      AND permissions.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Editors can create files"
  ON files FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM permissions
      WHERE permissions.workspace_id = files.workspace_id
      AND permissions.user_id::text = auth.uid()::text
      AND permissions.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Editors can update files"
  ON files FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM permissions
      WHERE permissions.workspace_id = files.workspace_id
      AND permissions.user_id::text = auth.uid()::text
      AND permissions.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Editors can delete files"
  ON files FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM permissions
      WHERE permissions.workspace_id = files.workspace_id
      AND permissions.user_id::text = auth.uid()::text
      AND permissions.role IN ('owner', 'editor')
    )
  );

-- Permissions policies
CREATE POLICY "Users can view their own permissions"
  ON permissions FOR SELECT
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Workspace members can view workspace permissions"
  ON permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM permissions p
      WHERE p.workspace_id = permissions.workspace_id
      AND p.user_id::text = auth.uid()::text
    )
  );

-- AI requests policies
CREATE POLICY "Users can view their own AI requests"
  ON ai_requests FOR SELECT
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can create AI requests"
  ON ai_requests FOR INSERT
  WITH CHECK (user_id::text = auth.uid()::text);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_files_updated_at
  BEFORE UPDATE ON files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_presence_updated_at
  BEFORE UPDATE ON presence
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Grant service role full access (for backend API)
-- Note: Service role bypasses RLS by default
