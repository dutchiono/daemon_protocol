/**
 * @title x402 Payment Routes
 * @notice API routes for x402 payment handling
 */

import { Router, Request, Response } from 'express';
import { X402Service } from '../services/x402.js';
import env from '../config/env.js';

const x402Router = Router();

// Initialize x402 service
const x402Service = new X402Service(
  env.RPC_URL || '',
  env.DATABASE_URL || '',
  env.JWT_SECRET || 'change-me-in-production'
);

/**
 * POST /api/v1/payments/verify
 * Verify payment and get access token
 */
x402Router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { transactionHash, nonce, blockNumber, amount, currency } = req.body;

    if (!transactionHash || !amount || !currency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const proof = {
      transactionHash,
      blockNumber: blockNumber || 0,
      amount,
      currency,
      timestamp: Math.floor(Date.now() / 1000)
    };

    const accessToken = await x402Service.generateAccessToken(proof, req.body.resource);

    res.json({
      accessToken,
      expiresIn: 3600 // 1 hour
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/payments/verify-token
 * Verify access token
 */
x402Router.post('/verify-token', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    const isValid = await x402Service.verifyAccessToken(token);

    if (!isValid) {
      return res.status(401).json({ valid: false });
    }

    res.json({ valid: true });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/payments/request
 * Get payment request for a resource
 */
x402Router.get('/request', async (req: Request, res: Response) => {
  try {
    const { resource, userId } = req.query;

    if (!resource) {
      return res.status(400).json({ error: 'Resource required' });
    }

    const paymentRequest = await x402Service.generatePaymentRequest(
      resource as string,
      userId as string | undefined
    );

    res.json(paymentRequest);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { x402Router };

