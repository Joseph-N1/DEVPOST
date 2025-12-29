/**
 * GitHub Routes
 * Repository import and push operations
 */

import { Router, Request, Response, IRouter } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  getUserGitHubToken,
  listUserRepos,
  getRepoInfo,
  importRepository,
  pushToGitHub,
} from '../lib/github.js';

const router: IRouter = Router();

// All GitHub routes require authentication
router.use(requireAuth);

/**
 * GET /github/repos
 * List user's GitHub repositories
 */
router.get('/repos', async (req: Request, res: Response) => {
  try {
    const token = await getUserGitHubToken(req.user!.userId);
    
    if (!token) {
      return res.status(401).json({ 
        error: 'GitHub token not found. Please re-authenticate with GitHub.' 
      });
    }

    const repos = await listUserRepos(token);
    
    res.json({ 
      repos: repos.map(repo => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        private: repo.private,
        defaultBranch: repo.default_branch,
        htmlUrl: repo.html_url,
      }))
    });
  } catch (err) {
    console.error('List repos error:', err);
    const message = err instanceof Error ? err.message : 'Failed to list repositories';
    res.status(500).json({ error: message });
  }
});

/**
 * POST /github/import
 * Import a GitHub repository into a workspace
 */
router.post('/import', async (req: Request, res: Response) => {
  const { repoFullName, workspaceId, branch } = req.body;

  if (!repoFullName || !workspaceId) {
    return res.status(400).json({ 
      error: 'repoFullName and workspaceId are required' 
    });
  }

  // Parse owner/repo
  const [owner, repo] = repoFullName.split('/');
  if (!owner || !repo) {
    return res.status(400).json({ 
      error: 'Invalid repository format. Use owner/repo' 
    });
  }

  try {
    // Verify user has editor access to workspace
    const { data: permission } = await supabaseAdmin
      .from('permissions')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', req.user!.userId)
      .single();

    if (!permission || permission.role === 'viewer') {
      return res.status(403).json({ error: 'Editor access required' });
    }

    // Get GitHub token
    const token = await getUserGitHubToken(req.user!.userId);
    if (!token) {
      return res.status(401).json({ 
        error: 'GitHub token not found. Please re-authenticate with GitHub.' 
      });
    }

    // Get repo info for default branch if not specified
    const repoInfo = await getRepoInfo(token, owner, repo);
    const targetBranch = branch || repoInfo.default_branch;

    // Import repository
    const result = await importRepository(
      token,
      owner,
      repo,
      targetBranch,
      workspaceId
    );

    // Update workspace with GitHub repo info
    if (result.success) {
      await supabaseAdmin
        .from('workspaces')
        .update({
          github_repo: repoFullName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', workspaceId);
    }

    res.json({
      success: result.success,
      filesImported: result.filesImported,
      branch: targetBranch,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (err) {
    console.error('Import error:', err);
    const message = err instanceof Error ? err.message : 'Failed to import repository';
    res.status(500).json({ error: message });
  }
});

/**
 * POST /github/push/:workspaceId
 * Push workspace changes to GitHub
 */
router.post('/push/:workspaceId', requireRole('editor', 'owner'), async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const { message = 'Update from LEGGOOO' } = req.body;

  try {
    // Get workspace with GitHub repo info
    const { data: workspace, error: wsError } = await supabaseAdmin
      .from('workspaces')
      .select('github_repo')
      .eq('id', workspaceId)
      .single();

    if (wsError || !workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (!workspace.github_repo) {
      return res.status(400).json({ 
        error: 'Workspace is not linked to a GitHub repository' 
      });
    }

    // Parse owner/repo
    const [owner, repo] = workspace.github_repo.split('/');
    if (!owner || !repo) {
      return res.status(400).json({ error: 'Invalid GitHub repo format' });
    }

    // Get GitHub token
    const token = await getUserGitHubToken(req.user!.userId);
    if (!token) {
      return res.status(401).json({ 
        error: 'GitHub token not found. Please re-authenticate with GitHub.' 
      });
    }

    // Get repo info for default branch
    const repoInfo = await getRepoInfo(token, owner, repo);

    // Push changes
    const result = await pushToGitHub(
      token,
      owner,
      repo,
      repoInfo.default_branch,
      workspaceId,
      message
    );

    if (result.success) {
      // Update workspace timestamp
      await supabaseAdmin
        .from('workspaces')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', workspaceId);

      res.json({
        success: true,
        commitSha: result.commitSha,
        message: result.message,
        branch: repoInfo.default_branch,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (err) {
    console.error('Push error:', err);
    const message = err instanceof Error ? err.message : 'Failed to push to GitHub';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /github/status/:workspaceId
 * Check if workspace has pending changes vs GitHub
 */
router.get('/status/:workspaceId', requireRole('viewer', 'editor', 'owner'), async (req: Request, res: Response) => {
  const { workspaceId } = req.params;

  try {
    // Get workspace
    const { data: workspace } = await supabaseAdmin
      .from('workspaces')
      .select('github_repo')
      .eq('id', workspaceId)
      .single();

    if (!workspace?.github_repo) {
      return res.json({ 
        linked: false,
        message: 'Workspace is not linked to GitHub' 
      });
    }

    // Get file count
    const { count } = await supabaseAdmin
      .from('files')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId);

    res.json({
      linked: true,
      repo: workspace.github_repo,
      fileCount: count || 0,
    });
  } catch (err) {
    console.error('Status check error:', err);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

export default router;
