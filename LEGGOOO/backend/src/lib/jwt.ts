/**
 * JWT utilities for authentication
 * Per security_checklist.md: 15min access tokens, 30d refresh tokens
 */

import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-in-prod';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-prod';
const ACCESS_TTL = '15m';
const REFRESH_TTL = '30d';

export interface TokenPayload {
  userId: string;
  email: string;
  displayName: string;
}

export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

/**
 * Generate access token (short-lived)
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_TTL });
}

/**
 * Generate refresh token (long-lived)
 */
export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TTL });
}

/**
 * Verify and decode access token
 */
export function verifyAccessToken(token: string): DecodedToken {
  return jwt.verify(token, ACCESS_SECRET) as DecodedToken;
}

/**
 * Verify and decode refresh token
 */
export function verifyRefreshToken(token: string): DecodedToken {
  return jwt.verify(token, REFRESH_SECRET) as DecodedToken;
}

/**
 * Generate both tokens for a user
 */
export function generateTokenPair(payload: TokenPayload) {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
    expiresIn: 15 * 60, // 15 minutes in seconds
  };
}
