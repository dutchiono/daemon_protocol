/**
 * @title Social Network Contributions Tracker
 * @notice Tracks GitHub contributions to social network codebase
 */

import { GitHubClient } from './client.js';
import type { GitHubPR } from './client.js';

export interface SocialContribution {
  prNumber: number;
  prUrl: string;
  author: string;
  title: string;
  contributionType: 'hub' | 'pds' | 'gateway' | 'client' | 'contracts' | 'docs' | 'other';
  filesChanged: number;
  additions: number;
  deletions: number;
  timestamp: number;
}

export class SocialContributionsTracker {
  private githubClient: GitHubClient;
  private socialNetworkPaths: string[];

  constructor(githubClient: GitHubClient) {
    this.githubClient = githubClient;
    this.socialNetworkPaths = [
      'social-network/',
      'social-client/',
      'contracts/social/',
      'docs/SOCIAL',
      'docs/NETWORK',
      'docs/FEE_INTEGRATION',
      'docs/X402',
      'backend/src/services/x402',
      'backend/src/routes/x402',
      'backend/db/social-schema'
    ];
  }

  /**
   * Check if a PR is related to social network
   */
  async isSocialNetworkPR(prNumber: number): Promise<boolean> {
    const pr = await this.githubClient.getPRDetails(prNumber);
    const files = await this.githubClient.getPRFiles(prNumber);

    // Check if any files are in social network paths
    return files.some(file =>
      this.socialNetworkPaths.some(path => file.filename.startsWith(path))
    );
  }

  /**
   * Get contribution type from PR
   */
  async getContributionType(prNumber: number): Promise<SocialContribution['contributionType']> {
    const files = await this.githubClient.getPRFiles(prNumber);

    // Determine type based on files changed
    if (files.some(f => f.filename.startsWith('social-network/hub/'))) {
      return 'hub';
    }
    if (files.some(f => f.filename.startsWith('social-network/pds/'))) {
      return 'pds';
    }
    if (files.some(f => f.filename.startsWith('social-network/gateway/'))) {
      return 'gateway';
    }
    if (files.some(f => f.filename.startsWith('social-client/'))) {
      return 'client';
    }
    if (files.some(f => f.filename.startsWith('contracts/social/'))) {
      return 'contracts';
    }
    if (files.some(f => f.filename.startsWith('docs/') && f.filename.includes('SOCIAL'))) {
      return 'docs';
    }

    return 'other';
  }

  /**
   * Process PR and create contribution record
   */
  async processPR(prNumber: number): Promise<SocialContribution | null> {
    const isSocial = await this.isSocialNetworkPR(prNumber);
    if (!isSocial) {
      return null;
    }

    const pr = await this.githubClient.getPRDetails(prNumber);
    const files = await this.githubClient.getPRFiles(prNumber);

    const contributionType = await this.getContributionType(prNumber);

    const totalAdditions = files.reduce((sum, f) => sum + f.additions, 0);
    const totalDeletions = files.reduce((sum, f) => sum + f.deletions, 0);

    return {
      prNumber: pr.number,
      prUrl: pr.html_url || `https://github.com/${this.githubClient['config'].owner}/${this.githubClient['config'].repo}/pull/${pr.number}`,
      author: pr.user.login,
      title: pr.title,
      contributionType,
      filesChanged: files.length,
      additions: totalAdditions,
      deletions: totalDeletions,
      timestamp: pr.merged_at ? new Date(pr.merged_at).getTime() : Date.now()
    };
  }

  /**
   * Get all social network contributions since a timestamp
   */
  async getContributionsSince(since: number): Promise<SocialContribution[]> {
    const prs = await this.githubClient.getMergedPRs(since);
    const contributions: SocialContribution[] = [];

    for (const pr of prs) {
      const contribution = await this.processPR(pr.number);
      if (contribution) {
        contributions.push(contribution);
      }
    }

    return contributions;
  }
}

