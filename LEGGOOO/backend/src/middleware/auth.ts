/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user to request
 */

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, DecodedToken } from '../lib/jwt.js';
import { supabaseAdmin } from '../lib/supabase.js';
import type { Role } from '../types/database.js';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: DecodedToken;
      userRole?: Role;
    }
  }
}

/**
 * Require authentication - extracts and verifies JWT
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header required' });
  }
  
  const [scheme, token] = authHeader.split(' ');
  
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Invalid authorization format. Use: Bearer <token>' });
  }
  
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return next();
  }
  
  const [scheme, token] = authHeader.split(' ');
  
  if (scheme !== 'Bearer' || !token) {
    return next();
  }
  
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
  } catch {
    // Ignore invalid tokens in optional auth
  }
  
  next();
}

/**
 * Require specific role for a workspace
 * Must be used after requireAuth and with workspaceId in params
 */
export function requireRole(...allowedRoles: Role[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const workspaceId = req.params.workspaceId || req.params.id;
    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace ID required' });
    }
    
    try {
      // Check user's permission for this workspace
      const { data: permission, error } = await supabaseAdmin
        .from('permissions')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', req.user.userId)
        .single();
      
      if (error || !permission) {
        return res.status(403).json({ error: 'Access denied to this workspace' });
      }
      
      // Owner has all permissions
      if (permission.role === 'owner') {
        req.userRole = 'owner';
        return next();
      }
      
      // Check if user's role is in allowed roles
      if (allowedRoles.includes(permission.role)) {
        req.userRole = permission.role;
        return next();
      }
      
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: permission.role,
      });
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({ error: 'Failed to verify permissions' });
    }
  };
}
