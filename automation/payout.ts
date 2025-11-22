/**
 * Payout Executor
 * Executes daily reward distributions on-chain
 */

import { ethers } from 'ethers';
import type { ContributorScore } from './daily-processor.js';

export interface PayoutConfig {
  builderRewardDistributor: string; // Contract address
  rpcUrl: string;
  privateKey: string;
  gasLimit?: number;
  gasPrice?: bigint;
}

export interface PayoutResult {
  success: boolean;
  transactionHash?: string;
  contributorsPaid: number;
  totalAmount: bigint;
  error?: string;
}

/**
 * Payout Executor Class
 */
export class PayoutExecutor {
  private config: Required<PayoutConfig>;
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private distributorContract: ethers.Contract;

  constructor(config: PayoutConfig) {
    this.config = {
      ...config,
      gasLimit: config.gasLimit || 500000,
      gasPrice: config.gasPrice || BigInt(0),
    };

    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.signer = new ethers.Wallet(config.privateKey, this.provider);

    // Load distributor contract ABI (simplified)
    const distributorABI = [
      'function distributeDailyRewards(address[] contributors, uint256[] scores)',
      'function rewardToken() view returns (address)',
    ];

    this.distributorContract = new ethers.Contract(
      config.builderRewardDistributor,
      distributorABI,
      this.signer
    );
  }

  /**
   * Execute daily payout distribution
   * @param contributorScores Array of contributor scores
   * @returns Payout result
   */
  async executeDailyPayout(
    contributorScores: ContributorScore[]
  ): Promise<PayoutResult> {
    try {
      // Filter contributors with non-zero scores
      const eligibleContributors = contributorScores.filter(cs => cs.totalScore > 0);

      if (eligibleContributors.length === 0) {
        return {
          success: true,
          contributorsPaid: 0,
          totalAmount: BigInt(0),
        };
      }

      // Prepare arrays for contract call
      const contributors = eligibleContributors.map(cs => cs.contributor);
      const scores = eligibleContributors.map(cs =>
        BigInt(Math.floor(cs.totalScore * 10)) // Scale for precision
      );

      // Estimate gas
      const gasEstimate = await this.distributorContract.distributeDailyRewards.estimateGas(
        contributors,
        scores
      );

      // Execute transaction
      const tx = await this.distributorContract.distributeDailyRewards(
        contributors,
        scores,
        {
          gasLimit: gasEstimate * BigInt(120) / BigInt(100), // 20% buffer
          ...(this.config.gasPrice > 0 ? { gasPrice: this.config.gasPrice } : {}),
        }
      );

      // Wait for confirmation
      const receipt = await tx.wait();

      // Calculate total amount (would need to query contract)
      const totalAmount = BigInt(0); // TODO: Calculate from contract state

      return {
        success: true,
        transactionHash: receipt.hash,
        contributorsPaid: eligibleContributors.length,
        totalAmount,
      };
    } catch (error) {
      return {
        success: false,
        contributorsPaid: 0,
        totalAmount: BigInt(0),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Batch execute payouts for gas efficiency
   * @param contributorScores Array of contributor scores
   * @param batchSize Number of contributors per batch
   * @returns Array of payout results
   */
  async batchExecutePayouts(
    contributorScores: ContributorScore[],
    batchSize: number = 50
  ): Promise<PayoutResult[]> {
    const results: PayoutResult[] = [];

    for (let i = 0; i < contributorScores.length; i += batchSize) {
      const batch = contributorScores.slice(i, i + batchSize);
      const result = await this.executeDailyPayout(batch);
      results.push(result);

      // Add delay between batches to avoid rate limiting
      if (i + batchSize < contributorScores.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Get current reward token balance
   * @returns Token balance
   */
  async getRewardBalance(): Promise<bigint> {
    const rewardTokenAddress = await this.distributorContract.rewardToken();
    const tokenContract = new ethers.Contract(
      rewardTokenAddress,
      ['function balanceOf(address) view returns (uint256)'],
      this.provider
    );

    return await tokenContract.balanceOf(this.config.builderRewardDistributor);
  }
}

