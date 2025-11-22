/**
 * Daily Payout Cron Job
 * Runs at 1 AM UTC (after score update) to distribute rewards
 */

import { PayoutExecutor } from '../../automation/payout.js';
import type { ContributorScore } from '../../automation/daily-processor.js';

/**
 * Daily payout job
 */
export async function runDailyPayout() {
  console.log('Starting daily payout...');

  const config = {
    builderRewardDistributor: process.env.BUILDER_REWARD_DISTRIBUTOR_ADDRESS || '',
    rpcUrl: process.env.RPC_URL || '',
    privateKey: process.env.PRIVATE_KEY || '',
  };

  if (!config.builderRewardDistributor || !config.rpcUrl || !config.privateKey) {
    throw new Error('Payout configuration missing');
  }

  const executor = new PayoutExecutor(config);

  try {
    // TODO: Fetch contributor scores from ContributionRegistry
    // For now, use empty array
    const contributorScores: ContributorScore[] = [];

    const result = await executor.executeDailyPayout(contributorScores);
    console.log('Daily payout completed:', result);
    return result;
  } catch (error) {
    console.error('Daily payout failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  runDailyPayout()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

