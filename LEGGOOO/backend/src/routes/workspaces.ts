/**
 * Workspace Routes
 * CRUD operations for workspaces and file management
 */

import { Router, Request, Response, IRouter } from 'express';
import crypto from 'crypto';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import type { Role } from '../types/database.js';

const router: IRouter = Router();

// All workspace routes require authentication
router.use(requireAuth);

/**
 * POST /workspaces
 * Create a new workspace
 */
router.post('/', async (req: Request, res: Response) => {
  const { name, description } = req.body;
  
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Workspace name is required' });
  }
  
  if (name.length > 100) {
    return res.status(400).json({ error: 'Workspace name must be 100 characters or less' });
  }
  
  try {
    // Create workspace
    const { data: workspace, error: wsError } = await supabaseAdmin
      .from('workspaces')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        owner_id: req.user!.userId,
      })
      .select()
      .single();
    
    if (wsError) {
      throw wsError;
    }
    
    // Add owner permission
    const { error: permError } = await supabaseAdmin
      .from('permissions')
      .insert({
        workspace_id: workspace.id,
        user_id: req.user!.userId,
        role: 'owner',
      });
    
    if (permError) {
      // Rollback workspace creation
      await supabaseAdmin.from('workspaces').delete().eq('id', workspace.id);
      throw permError;
    }
    
    res.status(201).json({ workspace });
  } catch (error) {
    console.error('Create workspace error:', error);
    res.status(500).json({ error: 'Failed to create workspace' });
  }
});

/**
 * GET /workspaces
 * List all workspaces the user has access to
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Get workspace IDs the user has permission for
    const { data: permissions, error: permError } = await supabaseAdmin
      .from('permissions')
      .select('workspace_id, role')
      .eq('user_id', req.user!.userId);
    
    if (permError) {
      throw permError;
    }
    
    if (!permissions || permissions.length === 0) {
      return res.json({ workspaces: [] });
    }
    
    const workspaceIds = permissions.map(p => p.workspace_id);
    const roleMap = Object.fromEntries(permissions.map(p => [p.workspace_id, p.role]));
    
    // Get workspace details
    const { data: workspaces, error: wsError } = await supabaseAdmin
      .from('workspaces')
      .select(`
        id,
        name,
        description,
        created_at,
        updated_at,
        owner:users!workspaces_owner_id_fkey(id, display_name, avatar_url)
      `)
      .in('id', workspaceIds)
      .order('updated_at', { ascending: false });
    
    if (wsError) {
      throw wsError;
    }
    
    // Add user's role to each workspace
    const workspacesWithRole = workspaces?.map(ws => ({
      ...ws,
      userRole: roleMap[ws.id],
    })) || [];
    
    res.json({ workspaces: workspacesWithRole });
  } catch (error) {
    console.error('List workspaces error:', error);
    res.status(500).json({ error: 'Failed to list workspaces' });
  }
});

/**
 * GET /workspaces/:id
 * Get workspace details including files and collaborators
 */
router.get('/:id', requireRole('viewer', 'editor', 'owner'), async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    // Get workspace with owner info
    const { data: workspace, error: wsError } = await supabaseAdmin
      .from('workspaces')
      .select(`
        id,
        name,
        description,
        github_repo,
        created_at,
        updated_at,
        owner:users!workspaces_owner_id_fkey(id, display_name, avatar_url)
      `)
      .eq('id', id)
      .single();
    
    if (wsError) {
      throw wsError;
    }
    
    // Get collaborators
    const { data: permissions } = await supabaseAdmin
      .from('permissions')
      .select(`
        role,
        user:users(id, display_name, avatar_url, email)
      `)
      .eq('workspace_id', id);
    
    // Get files (without content)
    const { data: files } = await supabaseAdmin
      .from('files')
      .select('id, path, language, created_at, updated_at')
      .eq('workspace_id', id)
      .order('path');
    
    res.json({
      workspace,
      collaborators: permissions || [],
      files: files || [],
      userRole: req.userRole,
    });
  } catch (error) {
    console.error('Get workspace error:', error);
    res.status(500).json({ error: 'Failed to get workspace' });
  }
});

/**
 * PATCH /workspaces/:id
 * Update workspace (owner only)
 */
router.patch('/:id', requireRole('owner'), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, github_repo } = req.body;
  
  try {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (github_repo !== undefined) updates.github_repo = github_repo;
    
    const { data: workspace, error } = await supabaseAdmin
      .from('workspaces')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    res.json({ workspace });
  } catch (error) {
    console.error('Update workspace error:', error);
    res.status(500).json({ error: 'Failed to update workspace' });
  }
});

/**
 * DELETE /workspaces/:id
 * Delete workspace (owner only)
 */
router.delete('/:id', requireRole('owner'), async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    // Delete in order: files, permissions, sessions, then workspace
    await supabaseAdmin.from('files').delete().eq('workspace_id', id);
    await supabaseAdmin.from('permissions').delete().eq('workspace_id', id);
    await supabaseAdmin.from('sessions').delete().eq('workspace_id', id);
    await supabaseAdmin.from('invite_links').delete().eq('workspace_id', id);
    
    const { error } = await supabaseAdmin
      .from('workspaces')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete workspace error:', error);
    res.status(500).json({ error: 'Failed to delete workspace' });
  }
});

/**
 * POST /workspaces/:id/invite
 * Generate invite link (owner or editor only)
 */
router.post('/:id/invite', requireRole('editor', 'owner'), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role = 'viewer', expires_in = 7 } = req.body; // expires_in in days
  
  // Only owner can create editor invites
  if (role === 'editor' && req.userRole !== 'owner') {
    return res.status(403).json({ error: 'Only owners can create editor invites' });
  }
  
  // Validate role
  if (!['viewer', 'editor'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Use "viewer" or "editor"' });
  }
  
  try {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expires_in);
    
    const { data: invite, error } = await supabaseAdmin
      .from('invite_links')
      .insert({
        workspace_id: id,
        token,
        role: role as Role,
        created_by: req.user!.userId,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/join/${token}`;
    
    res.json({
      invite: {
        ...invite,
        url: inviteUrl,
      },
    });
  } catch (error) {
    console.error('Create invite error:', error);
    res.status(500).json({ error: 'Failed to create invite link' });
  }
});

/**
 * POST /workspaces/join/:token
 * Join workspace via invite link
 */
router.post('/join/:token', async (req: Request, res: Response) => {
  const { token } = req.params;
  
  try {
    // Find valid invite
    const { data: invite, error: invError } = await supabaseAdmin
      .from('invite_links')
      .select('workspace_id, role, used, expires_at')
      .eq('token', token)
      .single();
    
    if (invError || !invite) {
      return res.status(404).json({ error: 'Invalid invite link' });
    }
    
    if (invite.used) {
      return res.status(400).json({ error: 'Invite link has already been used' });
    }
    
    if (new Date(invite.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Invite link has expired' });
    }
    
    // Check if user already has access
    const { data: existing } = await supabaseAdmin
      .from('permissions')
      .select('role')
      .eq('workspace_id', invite.workspace_id)
      .eq('user_id', req.user!.userId)
      .single();
    
    if (existing) {
      // User already has access, return workspace info
      const { data: workspace } = await supabaseAdmin
        .from('workspaces')
        .select('id, name')
        .eq('id', invite.workspace_id)
        .single();
      
      return res.json({
        workspace,
        role: existing.role,
        message: 'You already have access to this workspace',
      });
    }
    
    // Add permission for user
    const { error: permError } = await supabaseAdmin
      .from('permissions')
      .insert({
        workspace_id: invite.workspace_id,
        user_id: req.user!.userId,
        role: invite.role,
      });
    
    if (permError) {
      throw permError;
    }
    
    // Mark invite as used
    await supabaseAdmin
      .from('invite_links')
      .update({ used: true })
      .eq('token', token);
    
    // Get workspace info
    const { data: workspace } = await supabaseAdmin
      .from('workspaces')
      .select('id, name')
      .eq('id', invite.workspace_id)
      .single();
    
    res.json({
      workspace,
      role: invite.role,
      message: 'Successfully joined workspace',
    });
  } catch (error) {
    console.error('Join workspace error:', error);
    res.status(500).json({ error: 'Failed to join workspace' });
  }
});

/**
 * POST /workspaces/:id/collaborators
 * Add collaborator directly (owner only)
 */
router.post('/:id/collaborators', requireRole('owner'), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { email, role = 'viewer' } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  if (!['viewer', 'editor'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  
  try {
    // Find user by email
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if permission already exists
    const { data: existing } = await supabaseAdmin
      .from('permissions')
      .select('role')
      .eq('workspace_id', id)
      .eq('user_id', user.id)
      .single();
    
    if (existing) {
      return res.status(400).json({ error: 'User already has access', currentRole: existing.role });
    }
    
    // Add permission
    const { error: permError } = await supabaseAdmin
      .from('permissions')
      .insert({
        workspace_id: id,
        user_id: user.id,
        role: role as Role,
      });
    
    if (permError) {
      throw permError;
    }
    
    res.json({ success: true, message: `Added ${email} as ${role}` });
  } catch (error) {
    console.error('Add collaborator error:', error);
    res.status(500).json({ error: 'Failed to add collaborator' });
  }
});

/**
 * DELETE /workspaces/:id/collaborators/:userId
 * Remove collaborator (owner only)
 */
router.delete('/:id/collaborators/:userId', requireRole('owner'), async (req: Request, res: Response) => {
  const { id, userId } = req.params;
  
  // Can't remove the owner
  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .select('owner_id')
    .eq('id', id)
    .single();
  
  if (workspace?.owner_id === userId) {
    return res.status(400).json({ error: 'Cannot remove workspace owner' });
  }
  
  try {
    const { error } = await supabaseAdmin
      .from('permissions')
      .delete()
      .eq('workspace_id', id)
      .eq('user_id', userId);
    
    if (error) {
      throw error;
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Remove collaborator error:', error);
    res.status(500).json({ error: 'Failed to remove collaborator' });
  }
});

export default router;
