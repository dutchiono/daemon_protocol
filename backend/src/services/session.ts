import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import env from '../config/env.js';

export interface SessionPayload {
  fid?: bigint;
  walletAddress: string;
  platform: 'farcaster' | 'web' | 'telegram';
  sessionId: string;
}

/**
 * Generate a random nonce for session challenge
 */
export function generateNonce(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a JWT session token
 */
export function createSessionToken(payload: SessionPayload): string {
  const tokenPayload = {
    ...payload,
    fid: payload.fid?.toString(),
    // Don't set exp manually - let jwt.sign handle it with expiresIn
  };

  return jwt.sign(tokenPayload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

/**
 * Verify and decode a JWT session token
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    return {
      fid: decoded.fid ? BigInt(decoded.fid) : undefined,
      walletAddress: decoded.walletAddress,
      platform: decoded.platform,
      sessionId: decoded.sessionId,
    };
  } catch (error) {
    console.error('Error verifying session token:', error);
    return null;
  }
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return crypto.randomUUID();
}

export default {
  generateNonce,
  createSessionToken,
  verifySessionToken,
  generateSessionId,
};

