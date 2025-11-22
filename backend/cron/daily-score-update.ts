/**
 * Daily Score Update Cron Job
 * Runs at midnight UTC to update contributor scores with decay
 */

import { DailyContributionProcessor } from '../../automation/daily-processor.js';
import type { GitHubConfig } from '../../github/client.js';

/**
 * Daily score update job
 */
export async function runDailyScoreUpdate() {
  console.log('Starting daily score update...');

  const githubConfig: GitHubConfig = {
    token: process.env.GITHUB_TOKEN || '',
    owner: process.env.GITHUB_OWNER || '',
    repo: process.env.GITHUB_REPO || '',
  };

  const contributionRegistry = process.env.CONTRIBUTION_REGISTRY_ADDRESS || '';

  if (!githubConfig.token || !githubConfig.owner || !githubConfig.repo) {
    throw new Error('GitHub configuration missing');
  }

  if (!contributionRegistry) {
    throw new Error('Contribution registry address missing');
  }

  const processor = new DailyContributionProcessor(githubConfig, contributionRegistry);

  try {
    const result = await processor.processDailyContributions();
    console.log('Daily score update completed:', result);
    return result;
  } catch (error) {
    console.error('Daily score update failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  runDailyScoreUpdate()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

