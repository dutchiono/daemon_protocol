/**
 * Builder Reward SDK
 * TypeScript SDK for interacting with builder reward system
 */

import { ethers } from 'ethers';
import type { Provider, Signer } from 'ethers';

// Contract ABIs (simplified)
const BUILDER_REWARD_DISTRIBUTOR_ABI = [
  'function getContributorScore(address contributor, uint256 timestamp) view returns (uint256)',
  'function getAvailableRewards(address contributor) view returns (uint256)',
  'function claimRewards()',
  'function currentEpoch() view returns (uint256)',
  'function rewardToken() view returns (address)',
];

const CONTRIBUTION_REGISTRY_ABI = [
  'function getContributorHistory(address contributor) view returns (bytes32[] hashes, uint256[] scores, uint256[] timestamps)',
  'function getContributorTotalScore(address contributor) view returns (uint256)',
  'function contributions(bytes32) view returns (address contributor, string prUrl, uint256 score, uint256 timestamp, uint8 contributionType, bool verified, bytes32 contributionHash)',
];

export interface ContributorScore {
  contributor: string;
  totalScore: bigint;
  availableRewards: bigint;
}

export interface ContributionHistory {
  hashes: string[];
  scores: bigint[];
  timestamps: bigint[];
}

export interface DailyDistribution {
  epoch: bigint;
  totalScore: bigint;
  totalRewards: bigint;
  timestamp: bigint;
  distributed: boolean;
}

/**
 * Builder Reward SDK Class
 */
export class BuilderRewardSDK {
  private provider: Provider;
  private builderRewardDistributor: ethers.Contract;
  private contributionRegistry: ethers.Contract;

  constructor(
    provider: Provider,
    builderRewardDistributorAddress: string,
    contributionRegistryAddress: string
  ) {
    this.provider = provider;
    this.builderRewardDistributor = new ethers.Contract(
      builderRewardDistributorAddress,
      BUILDER_REWARD_DISTRIBUTOR_ABI,
      provider
    );
    this.contributionRegistry = new ethers.Contract(
      contributionRegistryAddress,
      CONTRIBUTION_REGISTRY_ABI,
      provider
    );
  }

  /**
   * Get contributor score at a specific timestamp
   * @param contributor Contributor address
   * @param timestamp Timestamp to calculate score at
   * @returns Contributor score
   */
  async getContributorScore(
    contributor: string,
    timestamp: number = Math.floor(Date.now() / 1000)
  ): Promise<bigint> {
    return await this.builderRewardDistributor.getContributorScore(
      contributor,
      timestamp
    );
  }

  /**
   * Get available rewards for a contributor
   * @param contributor Contributor address
   * @returns Available reward amount
   */
  async getAvailableRewards(contributor: string): Promise<bigint> {
    return await this.builderRewardDistributor.getAvailableRewards(contributor);
  }

  /**
   * Claim rewards for a contributor
   * @param signer Signer to execute the transaction
   * @returns Transaction receipt
   */
  async claimRewards(signer: Signer): Promise<ethers.ContractTransactionReceipt> {
    const contract = this.builderRewardDistributor.connect(signer);
    const tx = await contract.claimRewards();
    return await tx.wait();
  }

  /**
   * Get contribution history for a contributor
   * @param contributor Contributor address
   * @returns Contribution history
   */
  async getContributionHistory(contributor: string): Promise<ContributionHistory> {
    const [hashes, scores, timestamps] = await this.contributionRegistry.getContributorHistory(contributor);
    return {
      hashes: hashes.map((h: string) => h),
      scores: scores.map((s: bigint) => s),
      timestamps: timestamps.map((t: bigint) => t),
    };
  }

  /**
   * Get contributor total score (with decay applied)
   * @param contributor Contributor address
   * @returns Total decayed score
   */
  async getContributorTotalScore(contributor: string): Promise<bigint> {
    return await this.contributionRegistry.getContributorTotalScore(contributor);
  }

  /**
   * Get current epoch
   * @returns Current epoch number
   */
  async getCurrentEpoch(): Promise<bigint> {
    return await this.builderRewardDistributor.currentEpoch();
  }

  /**
   * Get reward token address
   * @returns Reward token address
   */
  async getRewardToken(): Promise<string> {
    return await this.builderRewardDistributor.rewardToken();
  }

  /**
   * Get complete contributor information
   * @param contributor Contributor address
   * @returns Contributor score information
   */
  async getContributorInfo(contributor: string): Promise<ContributorScore> {
    const [totalScore, availableRewards] = await Promise.all([
      this.getContributorTotalScore(contributor),
      this.getAvailableRewards(contributor),
    ]);

    return {
      contributor,
      totalScore,
      availableRewards,
    };
  }
}

