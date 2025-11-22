/**
 * @title Social Network Contributors Routes
 * @notice API routes for social network contributor tracking
 */

import { Router, Request, Response } from 'express';
import { GitHubClient } from '../../../github/client.js';
import { SocialContributionsTracker } from '../../../github/social-contributions.js';
import env from '../config/env.js';

const socialContributorsRouter = Router();

// Initialize GitHub client and tracker
const githubClient = new GitHubClient({
  token: env.GITHUB_TOKEN || '',
  owner: env.GITHUB_OWNER || '',
  repo: env.GITHUB_REPO || ''
});

const contributionsTracker = new SocialContributionsTracker(githubClient);

/**
 * GET /api/v1/social/contributors
 * List all social network contributors
 */
socialContributorsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { since } = req.query;
    const sinceTimestamp = since ? parseInt(since as string) : Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days default

    const contributions = await contributionsTracker.getContributionsSince(sinceTimestamp);

    // Group by author
    const contributorsMap = new Map<string, {
      author: string;
      contributions: number;
      totalAdditions: number;
      totalDeletions: number;
      types: Record<string, number>;
    }>();

    for (const contrib of contributions) {
      const existing = contributorsMap.get(contrib.author) || {
        author: contrib.author,
        contributions: 0,
        totalAdditions: 0,
        totalDeletions: 0,
        types: {}
      };

      existing.contributions++;
      existing.totalAdditions += contrib.additions;
      existing.totalDeletions += contrib.deletions;
      existing.types[contrib.contributionType] = (existing.types[contrib.contributionType] || 0) + 1;

      contributorsMap.set(contrib.author, existing);
    }

    const contributors = Array.from(contributorsMap.values());

    res.json({
      contributors,
      total: contributors.length,
      contributions: contributions.length
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/social/contributions
 * List all social network contributions
 */
socialContributorsRouter.get('/contributions', async (req: Request, res: Response) => {
  try {
    const { since, type, author } = req.query;
    const sinceTimestamp = since ? parseInt(since as string) : Date.now() - 30 * 24 * 60 * 60 * 1000;

    let contributions = await contributionsTracker.getContributionsSince(sinceTimestamp);

    // Filter by type if provided
    if (type) {
      contributions = contributions.filter(c => c.contributionType === type);
    }

    // Filter by author if provided
    if (author) {
      contributions = contributions.filter(c => c.author === author);
    }

    res.json({
      contributions,
      total: contributions.length
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/social/contributors/:author
 * Get contributor details
 */
socialContributorsRouter.get('/:author', async (req: Request, res: Response) => {
  try {
    const { author } = req.params;
    const { since } = req.query;
    const sinceTimestamp = since ? parseInt(since as string) : 0;

    const contributions = await contributionsTracker.getContributionsSince(sinceTimestamp);
    const authorContributions = contributions.filter(c => c.author === author);

    const stats = {
      author,
      totalContributions: authorContributions.length,
      totalAdditions: authorContributions.reduce((sum, c) => sum + c.additions, 0),
      totalDeletions: authorContributions.reduce((sum, c) => sum + c.deletions, 0),
      contributionsByType: authorContributions.reduce((acc, c) => {
        acc[c.contributionType] = (acc[c.contributionType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      contributions: authorContributions
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { socialContributorsRouter };

