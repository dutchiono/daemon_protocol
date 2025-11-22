/**
 * API Server
 * Backend service for builder reward system
 */

import express from 'express';
import cors from 'cors';
import { handleWebhookRequest } from '../github/webhook.js';
import type { WebhookConfig } from '../github/webhook.js';
import { agentRouter } from './src/routes/agent.js';
import { aiRouter } from './src/routes/ai.js';
import { authRouter } from './src/routes/auth.js';
import { uploadRouter } from './src/routes/upload.js';
import { launchRouter } from './src/routes/launch.js';
import { x402Router } from './src/routes/x402.js';
import { socialContributorsRouter } from './src/routes/social-contributors.js';
import { initializeTelegramBot } from './src/services/telegram.js';

const app = express();
app.use(cors());
app.use(express.json({ verify: (req: any, res, buf) => { req.rawBody = buf; }, limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/agent', agentRouter);
app.use('/api/ai', aiRouter);
app.use('/auth', authRouter);
app.use('/api/upload', uploadRouter);
app.use('/factory', launchRouter);
app.use('/api/v1/payments', x402Router);
app.use('/api/v1/social/contributors', socialContributorsRouter);

// TODO: Load from environment or config
const webhookConfig: WebhookConfig = {
  secret: process.env.GITHUB_WEBHOOK_SECRET || '',
  contributionRegistry: process.env.CONTRIBUTION_REGISTRY_ADDRESS || '',
  githubConfig: {
    token: process.env.GITHUB_TOKEN || '',
    owner: process.env.GITHUB_OWNER || '',
    repo: process.env.GITHUB_REPO || '',
  },
};

/**
 * GET /contributors
 * List all contributors with current scores
 */
app.get('/contributors', async (req, res) => {
  try {
    // TODO: Query ContributionRegistry contract for all contributors
    // For now, return mock data
    res.json({
      contributors: [],
      total: 0,
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * GET /contributors/:address
 * Get contributor details and history
 */
app.get('/contributors/:address', async (req, res) => {
  try {
    const { address } = req.params;

    // TODO: Query ContributionRegistry contract for contributor info
    // For now, return mock data
    res.json({
      contributor: address,
      totalScore: 0,
      contributions: [],
      pendingRewards: '0',
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * GET /contributions
 * List all recorded contributions
 */
app.get('/contributions', async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;

    // TODO: Query ContributionRegistry contract for contributions
    // For now, return mock data
    res.json({
      contributions: [],
      total: 0,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * POST /webhook/github
 * GitHub webhook receiver
 */
app.post('/webhook/github', async (req, res) => {
  try {
    const result = await handleWebhookRequest(req as any, webhookConfig);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /stats
 * Protocol statistics
 */
app.get('/stats', async (req, res) => {
  try {
    // TODO: Query contracts for statistics
    // For now, return mock data
    res.json({
      totalContributors: 0,
      totalContributions: 0,
      totalRewardsDistributed: '0',
      currentEpoch: 0,
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Builder Reward API server running on port ${PORT}`);

  // Initialize Telegram bot (runs in same process as backend)
  initializeTelegramBot();
});

export default app;

