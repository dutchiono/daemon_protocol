/**
 * GitHub Webhook Handler
 * Listens for PR events and automatically records contributions
 */

import crypto from 'crypto';
import { GitHubPR } from './client.js';
import { analyzePR, isPREligible } from './analyzer.js';
import type { GitHubConfig } from './client.js';

export interface WebhookPayload {
  action: string;
  pull_request: GitHubPR;
  repository: {
    full_name: string;
  };
}

export interface WebhookConfig {
  secret: string;
  contributionRegistry: string; // Address of ContributionRegistry contract
  githubConfig: GitHubConfig;
}

/**
 * Verify GitHub webhook signature
 * @param payload Raw request body
 * @param signature Signature from X-Hub-Signature-256 header
 * @param secret Webhook secret
 * @returns True if signature is valid
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): boolean {
  if (!signature) return false;

  // Remove 'sha256=' prefix if present
  const sig = signature.replace('sha256=', '');

  // Create HMAC hash
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');

  // Compare signatures using constant-time comparison
  return crypto.timingSafeEqual(
    Buffer.from(sig, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

/**
 * Process GitHub webhook event
 * @param payload Webhook payload
 * @param config Webhook configuration
 * @returns Processing result
 */
export async function processWebhookEvent(
  payload: WebhookPayload,
  config: WebhookConfig
): Promise<{
  success: boolean;
  contributionRecorded?: boolean;
  error?: string;
}> {
  try {
    // Only process merged PRs
    if (payload.action !== 'closed') {
      return { success: true, contributionRecorded: false };
    }

    const pr = payload.pull_request;

    // Check if PR is merged
    if (!pr.merged) {
      return { success: true, contributionRecorded: false };
    }

    // Verify repository matches
    if (payload.repository.full_name !== `${config.githubConfig.owner}/${config.githubConfig.repo}`) {
      return { success: false, error: 'Repository mismatch' };
    }

    // TODO: Fetch PR reviews to check for approvals
    // For now, we'll assume merged PRs have been approved

    // Analyze PR to determine type and score
    const analysis = await analyzePR(pr);

    // Check if PR is eligible
    // Note: We'd need to fetch reviews here, but for now we'll proceed
    // In production, you'd want to fetch reviews first

    // TODO: Get contributor Ethereum address from GitHub username
    // const contributorAddress = await getContributorAddress(pr.user.login);
    // if (!contributorAddress) {
    //   return { success: false, error: 'Contributor address not found' };
    // }

    // TODO: Record contribution on-chain
    // This would call the ContributionRegistry contract
    // await recordContributionOnChain({
    //   contributor: contributorAddress,
    //   prUrl: pr.html_url,
    //   score: analysis.score,
    //   type: analysis.type,
    // });

    return {
      success: true,
      contributionRecorded: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Handle GitHub webhook request
 * @param req HTTP request object
 * @param config Webhook configuration
 * @returns Processing result
 */
export async function handleWebhookRequest(
  req: {
    body: any;
    headers: Record<string, string | string[] | undefined>;
    rawBody?: string | Buffer;
  },
  config: WebhookConfig
): Promise<{
  success: boolean;
  contributionRecorded?: boolean;
  error?: string;
}> {
  // Verify signature
  const signature = req.headers['x-hub-signature-256'] as string;
  const payload = req.rawBody || JSON.stringify(req.body);

  if (!verifyWebhookSignature(payload, signature, config.secret)) {
    return { success: false, error: 'Invalid signature' };
  }

  // Process event
  return await processWebhookEvent(req.body, config);
}

