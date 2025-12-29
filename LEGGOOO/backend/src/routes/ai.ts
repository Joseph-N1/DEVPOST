/**
 * AI Routes
 * API endpoints for AI chat and code assistance
 */

import { Router, type IRouter } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  chat,
  getCompletions,
  explainCode,
  suggestImprovements,
  fixCode,
  generateCode,
  isAIAvailable,
  getProviderName,
} from '../lib/ai.js';
import { createClient } from '@supabase/supabase-js';
import type { Database, AIRequestRow } from '../types/database.js';

const router: IRouter = Router();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

/**
 * Check if AI is available
 * GET /ai/status
 */
router.get('/status', (_req, res) => {
  res.json({
    available: isAIAvailable(),
    provider: getProviderName(),
  });
});

/**
 * Chat with AI assistant
 * POST /ai/chat
 */
router.post('/chat', requireAuth, async (req, res) => {
  try {
    const { workspaceId, message, context, conversationHistory } = req.body;
    const userId = req.user!.userId;

    if (!workspaceId || !message) {
      return res.status(400).json({ error: 'workspaceId and message are required' });
    }

    // Verify user has access to workspace
    const { data: permission } = await supabase
      .from('permissions')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .single();

    if (!permission) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }

    // Get file content if fileId is provided
    let fileContent: string | undefined;
    let fileName: string | undefined;

    if (context?.fileId) {
      const { data: file } = await supabase
        .from('files')
        .select('path, content')
        .eq('id', context.fileId)
        .single() as { data: { path: string; content: string } | null };

      if (file) {
        fileName = file.path.split('/').pop() || file.path;
        fileContent = file.content || undefined;
      }
    }

    const response = await chat(
      userId,
      workspaceId,
      message,
      {
        workspaceId,
        fileId: context?.fileId,
        fileName,
        fileContent,
        selectedCode: context?.selectedCode,
        cursorPosition: context?.cursorPosition,
      },
      conversationHistory || []
    );

    res.json({
      message: response.message,
      usage: response.usage,
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Chat failed',
    });
  }
});

/**
 * Get code completions
 * POST /ai/completions
 */
router.post('/completions', requireAuth, async (req, res) => {
  try {
    const { workspaceId, prefix, suffix, language, fileId } = req.body;
    const userId = req.user!.userId;

    if (!workspaceId || prefix === undefined) {
      return res.status(400).json({ error: 'workspaceId and prefix are required' });
    }

    // Verify user has access to workspace
    const { data: permission } = await supabase
      .from('permissions')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .single();

    if (!permission) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }

    const response = await getCompletions(
      userId,
      workspaceId,
      prefix,
      suffix || '',
      language || 'plaintext',
      { workspaceId, fileId }
    );

    res.json({
      suggestions: response.suggestions,
      usage: response.usage,
    });
  } catch (err) {
    console.error('Completions error:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Completions failed',
    });
  }
});

/**
 * Explain code selection
 * POST /ai/explain
 */
router.post('/explain', requireAuth, async (req, res) => {
  try {
    const { workspaceId, code, language } = req.body;
    const userId = req.user!.userId;

    if (!workspaceId || !code) {
      return res.status(400).json({ error: 'workspaceId and code are required' });
    }

    // Verify user has access to workspace
    const { data: permission } = await supabase
      .from('permissions')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .single();

    if (!permission) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }

    const response = await explainCode(
      userId,
      workspaceId,
      code,
      language || 'plaintext'
    );

    res.json({
      explanation: response.message,
      usage: response.usage,
    });
  } catch (err) {
    console.error('Explain error:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Explain failed',
    });
  }
});

/**
 * Suggest improvements
 * POST /ai/improve
 */
router.post('/improve', requireAuth, async (req, res) => {
  try {
    const { workspaceId, code, language } = req.body;
    const userId = req.user!.userId;

    if (!workspaceId || !code) {
      return res.status(400).json({ error: 'workspaceId and code are required' });
    }

    // Verify user has access to workspace
    const { data: permission } = await supabase
      .from('permissions')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .single();

    if (!permission) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }

    const response = await suggestImprovements(
      userId,
      workspaceId,
      code,
      language || 'plaintext'
    );

    res.json({
      suggestions: response.message,
      usage: response.usage,
    });
  } catch (err) {
    console.error('Improve error:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Improve failed',
    });
  }
});

/**
 * Fix code errors
 * POST /ai/fix
 */
router.post('/fix', requireAuth, async (req, res) => {
  try {
    const { workspaceId, code, language, error: codeError } = req.body;
    const userId = req.user!.userId;

    if (!workspaceId || !code) {
      return res.status(400).json({ error: 'workspaceId and code are required' });
    }

    // Verify user has access to workspace
    const { data: permission } = await supabase
      .from('permissions')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .single();

    if (!permission) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }

    const response = await fixCode(
      userId,
      workspaceId,
      code,
      language || 'plaintext',
      codeError
    );

    res.json({
      fix: response.message,
      usage: response.usage,
    });
  } catch (err) {
    console.error('Fix error:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Fix failed',
    });
  }
});

/**
 * Generate code from description
 * POST /ai/generate
 */
router.post('/generate', requireAuth, async (req, res) => {
  try {
    const { workspaceId, description, language, context } = req.body;
    const userId = req.user!.userId;

    if (!workspaceId || !description) {
      return res.status(400).json({ error: 'workspaceId and description are required' });
    }

    // Verify user has access to workspace
    const { data: permission } = await supabase
      .from('permissions')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .single();

    if (!permission) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }

    // Get file content if fileId is provided in context
    let fileContent: string | undefined;
    let fileName: string | undefined;

    if (context?.fileId) {
      const { data: file } = await supabase
        .from('files')
        .select('path, content')
        .eq('id', context.fileId)
        .single() as { data: { path: string; content: string } | null };

      if (file) {
        fileName = file.path.split('/').pop() || file.path;
        fileContent = file.content || undefined;
      }
    }

    const response = await generateCode(
      userId,
      workspaceId,
      description,
      language || 'plaintext',
      {
        workspaceId,
        fileId: context?.fileId,
        fileName,
        fileContent,
        selectedCode: context?.selectedCode,
      }
    );

    res.json({
      code: response.message,
      usage: response.usage,
    });
  } catch (err) {
    console.error('Generate error:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Generate failed',
    });
  }
});

/**
 * Get AI usage stats for user
 * GET /ai/usage
 */
router.get('/usage', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { workspaceId } = req.query;

    let query = supabase
      .from('ai_requests')
      .select('action, tokens_used, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId as string);
    }

    const { data: requests, error } = await query as { data: Pick<AIRequestRow, 'action' | 'tokens_used' | 'created_at'>[] | null; error: Error | null };

    if (error) {
      throw error;
    }

    // Calculate totals
    const totals = (requests || []).reduce(
      (acc, req) => {
        acc.tokensUsed += req.tokens_used || 0;
        acc.totalRequests += 1;
        acc.byType[req.action] = (acc.byType[req.action] || 0) + 1;
        return acc;
      },
      {
        tokensUsed: 0,
        totalRequests: 0,
        byType: {} as Record<string, number>,
      }
    );

    res.json({
      totals,
      recentRequests: requests?.slice(0, 10) || [],
    });
  } catch (err) {
    console.error('Usage error:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to get usage',
    });
  }
});

export default router;
