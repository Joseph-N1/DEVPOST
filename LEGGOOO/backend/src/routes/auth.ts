/**
 * Authentication Routes
 * OAuth callbacks and user management
 */

import { Router, Request, Response, IRouter } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { generateTokenPair, verifyRefreshToken, TokenPayload } from '../lib/jwt.js';
import { encryptToken } from '../lib/encryption.js';
import { requireAuth } from '../middleware/auth.js';

const router: IRouter = Router();

// GitHub OAuth configuration
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

interface GitHubUserResponse {
  id: number;
  login: string;
  avatar_url: string;
  name: string | null;
  email: string | null;
}

interface GitHubEmailResponse {
  email: string;
  primary: boolean;
  verified: boolean;
}

/**
 * GET /auth/github
 * Redirect to GitHub OAuth
 */
router.get('/github', (_req: Request, res: Response) => {
  const scopes = ['repo', 'read:user', 'user:email'];
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: `${process.env.API_URL || 'http://localhost:3001'}/auth/github/callback`,
    scope: scopes.join(' '),
    state: generateState(),
  });
  
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

/**
 * GET /auth/github/callback
 * Handle GitHub OAuth callback
 */
router.get('/github/callback', async (req: Request, res: Response) => {
  const { code, error, error_description } = req.query;
  
  if (error) {
    return res.redirect(`${FRONTEND_URL}/auth/error?error=${error_description || error}`);
  }
  
  if (!code || typeof code !== 'string') {
    return res.redirect(`${FRONTEND_URL}/auth/error?error=No authorization code received`);
  }
  
  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    
    const tokenData = (await tokenResponse.json()) as GitHubTokenResponse;
    
    if (!tokenData.access_token) {
      throw new Error('No access token received from GitHub');
    }
    
    // Get user info from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    
    const githubUser = (await userResponse.json()) as GitHubUserResponse;
    
    // Get user's primary email if not public
    let email = githubUser.email;
    if (!email) {
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      const emails = (await emailsResponse.json()) as GitHubEmailResponse[];
      const primaryEmail = emails.find(e => e.primary && e.verified);
      email = primaryEmail?.email || emails[0]?.email;
    }
    
    if (!email) {
      throw new Error('Unable to retrieve email from GitHub');
    }
    
    // Encrypt GitHub token for storage
    const encryptedToken = encryptToken(tokenData.access_token);
    
    // Upsert user in database
    const { data: user, error: dbError } = await supabaseAdmin
      .from('users')
      .upsert({
        email,
        display_name: githubUser.name || githubUser.login,
        avatar_url: githubUser.avatar_url,
        github_token: encryptedToken,
      }, {
        onConflict: 'email',
      })
      .select()
      .single();
    
    if (dbError || !user) {
      throw new Error(`Database error: ${dbError?.message}`);
    }
    
    // Generate JWT tokens
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      displayName: user.display_name,
    };
    
    const tokens = generateTokenPair(payload);
    
    // Redirect to frontend with tokens
    const params = new URLSearchParams({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn.toString(),
    });
    
    res.redirect(`${FRONTEND_URL}/auth/callback?${params}`);
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    const message = error instanceof Error ? error.message : 'Authentication failed';
    res.redirect(`${FRONTEND_URL}/auth/error?error=${encodeURIComponent(message)}`);
  }
});

/**
 * POST /auth/refresh
 * Exchange refresh token for new access token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }
  
  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Verify user still exists
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, display_name')
      .eq('id', decoded.userId)
      .single();
    
    if (error || !user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Generate new tokens
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      displayName: user.display_name,
    };
    
    const tokens = generateTokenPair(payload);
    
    res.json(tokens);
  } catch (error) {
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Refresh token expired', code: 'REFRESH_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

/**
 * GET /auth/me
 * Get current user profile
 */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, display_name, avatar_url, theme, created_at')
      .eq('id', req.user!.userId)
      .single();
    
    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

/**
 * PATCH /auth/me
 * Update current user profile
 */
router.patch('/me', requireAuth, async (req: Request, res: Response) => {
  const { display_name, avatar_url, theme } = req.body;
  
  // Validate theme if provided
  const validThemes = ['light', 'dark', 'anime', 'neon-city', 'space-explorer', 'nature-forest', 'mechanical', 'aviation'];
  if (theme && !validThemes.includes(theme)) {
    return res.status(400).json({ error: 'Invalid theme', validThemes });
  }
  
  try {
    const updates: Record<string, unknown> = {};
    if (display_name !== undefined) updates.display_name = display_name;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (theme !== undefined) updates.theme = theme;
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', req.user!.userId)
      .select('id, email, display_name, avatar_url, theme, created_at')
      .single();
    
    if (error) {
      throw error;
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * POST /auth/logout
 * Logout (client should discard tokens)
 */
router.post('/logout', requireAuth, (_req: Request, res: Response) => {
  // JWT is stateless, client handles token removal
  // Could implement token blacklist here for revocation
  res.json({ success: true });
});

// Helper: Generate random state for OAuth
function generateState(): string {
  return Math.random().toString(36).substring(2, 15);
}

export default router;
