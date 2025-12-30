import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import {
  generateTokenPair,
  generateAccessToken,
  verifyAccessToken,
  verifyRefreshToken,
} from './jwt';

describe('JWT Library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateTokenPair', () => {
    it('should generate access and refresh tokens', () => {
      const payload = { userId: 'test-user-123', email: 'test@example.com', displayName: 'Test User' };
      const tokens = generateTokenPair(payload);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });

    it('should create tokens with correct claims', () => {
      const payload = { userId: 'test-user-123', email: 'test@example.com', displayName: 'Test User' };
      const tokens = generateTokenPair(payload);

      // Decode access token (without verification for testing)
      const decoded = jwt.decode(tokens.accessToken) as jwt.JwtPayload;
      
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const payload = { userId: 'test-user-123', email: 'test@example.com', displayName: 'Test User' };
      const accessToken = generateAccessToken(payload);

      const decoded = verifyAccessToken(accessToken);
      
      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(payload.userId);
    });

    it('should throw for invalid token', () => {
      expect(() => verifyAccessToken('invalid-token')).toThrow();
    });

    it('should throw for expired token', () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { userId: 'test', email: 'test@example.com', displayName: 'Test' },
        process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-in-prod',
        { expiresIn: '-1s' }
      );

      expect(() => verifyAccessToken(expiredToken)).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const payload = { userId: 'test-user-123', email: 'test@example.com', displayName: 'Test User' };
      const { refreshToken } = generateTokenPair(payload);

      const decoded = verifyRefreshToken(refreshToken);
      
      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(payload.userId);
    });

    it('should throw for invalid token', () => {
      expect(() => verifyRefreshToken('invalid-token')).toThrow();
    });
  });
});
