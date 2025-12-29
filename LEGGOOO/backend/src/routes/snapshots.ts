/**
 * Snapshot Routes
 * API endpoints for file version history
 */

import { Router, type IRouter } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createSnapshot,
  getSnapshots,
  getSnapshot,
  restoreSnapshot,
  pruneSnapshots,
} from '../lib/snapshots.js';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.js';

const router: IRouter = Router();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

/**
 * Check if user has access to a file
 */
async function checkFileAccess(
  fileId: string,
  userId: string
): Promise<{ hasAccess: boolean; workspaceId?: string }> {
  // Get file's workspace
  const { data: file } = await supabase
    .from('files')
    .select('workspace_id')
    .eq('id', fileId)
    .single() as { data: { workspace_id: string } | null };

  if (!file) {
    return { hasAccess: false };
  }

  // Check user's permission for the workspace
  const { data: permission } = await supabase
    .from('permissions')
    .select('role')
    .eq('workspace_id', file.workspace_id)
    .eq('user_id', userId)
    .single();

  return {
    hasAccess: !!permission,
    workspaceId: file.workspace_id,
  };
}

/**
 * Create a snapshot of a file
 * POST /snapshots/:fileId
 */
router.post('/:fileId', requireAuth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { message } = req.body;
    const userId = req.user!.userId;

    // Check access
    const { hasAccess } = await checkFileAccess(fileId, userId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get current file content
    const { data: file } = await supabase
      .from('files')
      .select('content')
      .eq('id', fileId)
      .single() as { data: { content: string } | null };

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Create snapshot
    const snapshot = await createSnapshot(fileId, userId, file.content, message);

    if (!snapshot) {
      return res.status(500).json({ error: 'Failed to create snapshot' });
    }

    // Prune old snapshots
    await pruneSnapshots(fileId, 100);

    res.json({ snapshot });
  } catch (err) {
    console.error('Create snapshot error:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to create snapshot',
    });
  }
});

/**
 * Get snapshots for a file
 * GET /snapshots/:fileId
 */
router.get('/:fileId', requireAuth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { limit } = req.query;
    const userId = req.user!.userId;

    // Check access
    const { hasAccess } = await checkFileAccess(fileId, userId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const snapshots = await getSnapshots(fileId, parseInt(limit as string) || 50);

    res.json({ snapshots });
  } catch (err) {
    console.error('Get snapshots error:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to get snapshots',
    });
  }
});

/**
 * Get a specific snapshot
 * GET /snapshots/snapshot/:snapshotId
 */
router.get('/snapshot/:snapshotId', requireAuth, async (req, res) => {
  try {
    const { snapshotId } = req.params;
    const userId = req.user!.userId;

    const snapshot = await getSnapshot(snapshotId);

    if (!snapshot) {
      return res.status(404).json({ error: 'Snapshot not found' });
    }

    // Check access to the file
    const { hasAccess } = await checkFileAccess(snapshot.file_id, userId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ snapshot });
  } catch (err) {
    console.error('Get snapshot error:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to get snapshot',
    });
  }
});

/**
 * Restore a file to a snapshot
 * POST /snapshots/restore/:snapshotId
 */
router.post('/restore/:snapshotId', requireAuth, async (req, res) => {
  try {
    const { snapshotId } = req.params;
    const userId = req.user!.userId;

    const snapshot = await getSnapshot(snapshotId);

    if (!snapshot) {
      return res.status(404).json({ error: 'Snapshot not found' });
    }

    // Check access to the file (need editor role or higher)
    const { hasAccess, workspaceId } = await checkFileAccess(snapshot.file_id, userId);
    if (!hasAccess || !workspaceId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if user has editor or owner role
    const { data: permission } = await supabase
      .from('permissions')
      .select('role')
      .eq('workspace_id', workspaceId as string)
      .eq('user_id', userId)
      .single() as { data: { role: string } | null };

    if (!permission || permission.role === 'viewer') {
      return res.status(403).json({ error: 'You must be an editor or owner to restore snapshots' });
    }

    const result = await restoreSnapshot(snapshotId, userId);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      fileId: result.fileId,
      content: result.content,
    });
  } catch (err) {
    console.error('Restore snapshot error:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to restore snapshot',
    });
  }
});

export default router;
