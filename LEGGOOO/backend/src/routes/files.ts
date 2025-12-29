/**
 * File Routes
 * CRUD operations for workspace files
 */

import { Router, Request, Response, IRouter } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router: IRouter = Router();

// All file routes require authentication
router.use(requireAuth);

// Language detection by extension
const LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.py': 'python',
  '.java': 'java',
  '.go': 'go',
  '.rs': 'rust',
  '.rb': 'ruby',
  '.php': 'php',
  '.cs': 'csharp',
  '.cpp': 'cpp',
  '.c': 'c',
  '.h': 'c',
  '.hpp': 'cpp',
  '.html': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.md': 'markdown',
  '.sql': 'sql',
  '.sh': 'shell',
  '.bash': 'shell',
  '.zsh': 'shell',
  '.vue': 'vue',
  '.svelte': 'svelte',
};

function detectLanguage(path: string): string {
  const ext = path.substring(path.lastIndexOf('.')).toLowerCase();
  return LANGUAGE_MAP[ext] || 'plaintext';
}

/**
 * GET /workspaces/:workspaceId/files
 * List all files in workspace
 */
router.get('/workspaces/:workspaceId/files', requireRole('viewer', 'editor', 'owner'), async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  
  try {
    const { data: files, error } = await supabaseAdmin
      .from('files')
      .select('id, path, language, created_at, updated_at')
      .eq('workspace_id', workspaceId)
      .order('path');
    
    if (error) {
      throw error;
    }
    
    res.json({ files: files || [] });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

/**
 * POST /workspaces/:workspaceId/files
 * Create a new file
 */
router.post('/workspaces/:workspaceId/files', requireRole('editor', 'owner'), async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const { path, content = '' } = req.body;
  
  if (!path || typeof path !== 'string') {
    return res.status(400).json({ error: 'File path is required' });
  }
  
  // Normalize path
  const normalizedPath = path.replace(/\\/g, '/').replace(/^\/+/, '');
  
  try {
    // Check for duplicate path
    const { data: existing } = await supabaseAdmin
      .from('files')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('path', normalizedPath)
      .single();
    
    if (existing) {
      return res.status(409).json({ error: 'File already exists' });
    }
    
    const language = detectLanguage(normalizedPath);
    
    const { data: file, error } = await supabaseAdmin
      .from('files')
      .insert({
        workspace_id: workspaceId,
        path: normalizedPath,
        content,
        language,
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    res.status(201).json({ file });
  } catch (error) {
    console.error('Create file error:', error);
    res.status(500).json({ error: 'Failed to create file' });
  }
});

/**
 * GET /files/:fileId
 * Get file with content
 */
router.get('/files/:fileId', async (req: Request, res: Response) => {
  const { fileId } = req.params;
  
  try {
    const { data: file, error } = await supabaseAdmin
      .from('files')
      .select('id, workspace_id, path, content, language, created_at, updated_at')
      .eq('id', fileId)
      .single();
    
    if (error || !file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Verify user has access to workspace
    const { data: permission } = await supabaseAdmin
      .from('permissions')
      .select('role')
      .eq('workspace_id', file.workspace_id)
      .eq('user_id', req.user!.userId)
      .single();
    
    if (!permission) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json({ file });
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ error: 'Failed to get file' });
  }
});

/**
 * PUT /files/:fileId
 * Update file content
 */
router.put('/files/:fileId', async (req: Request, res: Response) => {
  const { fileId } = req.params;
  const { content } = req.body;
  
  if (content === undefined) {
    return res.status(400).json({ error: 'Content is required' });
  }
  
  try {
    // Get file to check workspace
    const { data: file } = await supabaseAdmin
      .from('files')
      .select('workspace_id')
      .eq('id', fileId)
      .single();
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Check editor permission
    const { data: permission } = await supabaseAdmin
      .from('permissions')
      .select('role')
      .eq('workspace_id', file.workspace_id)
      .eq('user_id', req.user!.userId)
      .single();
    
    if (!permission || permission.role === 'viewer') {
      return res.status(403).json({ error: 'Edit access required' });
    }
    
    const { data: updated, error } = await supabaseAdmin
      .from('files')
      .update({
        content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', fileId)
      .select('id, path, language, updated_at')
      .single();
    
    if (error) {
      throw error;
    }
    
    res.json({ file: updated });
  } catch (error) {
    console.error('Update file error:', error);
    res.status(500).json({ error: 'Failed to update file' });
  }
});

/**
 * PATCH /files/:fileId/rename
 * Rename/move file
 */
router.patch('/files/:fileId/rename', async (req: Request, res: Response) => {
  const { fileId } = req.params;
  const { path } = req.body;
  
  if (!path || typeof path !== 'string') {
    return res.status(400).json({ error: 'New path is required' });
  }
  
  const normalizedPath = path.replace(/\\/g, '/').replace(/^\/+/, '');
  
  try {
    // Get file to check workspace
    const { data: file } = await supabaseAdmin
      .from('files')
      .select('workspace_id')
      .eq('id', fileId)
      .single();
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Check editor permission
    const { data: permission } = await supabaseAdmin
      .from('permissions')
      .select('role')
      .eq('workspace_id', file.workspace_id)
      .eq('user_id', req.user!.userId)
      .single();
    
    if (!permission || permission.role === 'viewer') {
      return res.status(403).json({ error: 'Edit access required' });
    }
    
    // Check for duplicate path
    const { data: existing } = await supabaseAdmin
      .from('files')
      .select('id')
      .eq('workspace_id', file.workspace_id)
      .eq('path', normalizedPath)
      .neq('id', fileId)
      .single();
    
    if (existing) {
      return res.status(409).json({ error: 'A file with this path already exists' });
    }
    
    const language = detectLanguage(normalizedPath);
    
    const { data: updated, error } = await supabaseAdmin
      .from('files')
      .update({
        path: normalizedPath,
        language,
        updated_at: new Date().toISOString(),
      })
      .eq('id', fileId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    res.json({ file: updated });
  } catch (error) {
    console.error('Rename file error:', error);
    res.status(500).json({ error: 'Failed to rename file' });
  }
});

/**
 * DELETE /files/:fileId
 * Delete file
 */
router.delete('/files/:fileId', async (req: Request, res: Response) => {
  const { fileId } = req.params;
  
  try {
    // Get file to check workspace
    const { data: file } = await supabaseAdmin
      .from('files')
      .select('workspace_id')
      .eq('id', fileId)
      .single();
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Check editor permission
    const { data: permission } = await supabaseAdmin
      .from('permissions')
      .select('role')
      .eq('workspace_id', file.workspace_id)
      .eq('user_id', req.user!.userId)
      .single();
    
    if (!permission || permission.role === 'viewer') {
      return res.status(403).json({ error: 'Edit access required' });
    }
    
    const { error } = await supabaseAdmin
      .from('files')
      .delete()
      .eq('id', fileId);
    
    if (error) {
      throw error;
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;
