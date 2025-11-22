/**
 * @title Builder Rewards SDK Functions
 * @notice Functions for interacting with builder reward system
 */

import { ethers } from 'ethers';
import type { Provider, Signer } from 'ethers';
import { BUILDER_REWARD_DISTRIBUTOR_ABI, CONTRIBUTION_REGISTRY_ABI } from '../contract/abi.js';
import { BUILDER_REWARD_DISTRIBUTOR_ADDRESS, CONTRIBUTION_REGISTRY_ADDRESS } from '../contract/address.js';
import type { ContributorInfo, Contribution, ContributionType } from '../types/index.js';

/**
 * Get Builder Reward Distributor contract instance
 */
export function getBuilderRewardDistributorContract(
    providerOrSigner: Provider | Signer,
    distributorAddress?: string
): ethers.Contract {
    return new ethers.Contract(
        distributorAddress || BUILDER_REWARD_DISTRIBUTOR_ADDRESS,
        BUILDER_REWARD_DISTRIBUTOR_ABI,
        providerOrSigner
    );
}

/**
 * Get Contribution Registry contract instance
 */
export function getContributionRegistryContract(
    providerOrSigner: Provider | Signer,
    registryAddress?: string
): ethers.Contract {
    return new ethers.Contract(
        registryAddress || CONTRIBUTION_REGISTRY_ADDRESS,
        CONTRIBUTION_REGISTRY_ABI,
        providerOrSigner
    );
}

/**
 * Get contributor active score
 */
export async function getContributorScore(
    provider: Provider,
    contributor: string,
    distributorAddress?: string
): Promise<bigint | null> {
    try {
        const contract = getBuilderRewardDistributorContract(provider, distributorAddress);
        const score = await contract.getContributorActiveScore(contributor);
        return BigInt(score.toString());
    } catch (error) {
        console.error('Error fetching contributor score:', error);
        return null;
    }
}

/**
 * Get available rewards for a contributor
 */
export async function getAvailableRewards(
    provider: Provider,
    contributor: string,
    distributorAddress?: string
): Promise<bigint | null> {
    try {
        const contract = getBuilderRewardDistributorContract(provider, distributorAddress);
        const rewards = await contract.getAvailableRewards(contributor);
        return BigInt(rewards.toString());
    } catch (error) {
        console.error('Error fetching available rewards:', error);
        return null;
    }
}

/**
 * Claim rewards for a contributor
 */
export async function claimRewards(
    signer: Signer,
    contributor: string,
    distributorAddress?: string
): Promise<ethers.TransactionResponse | null> {
    try {
        const contract = getBuilderRewardDistributorContract(signer, distributorAddress);
        const tx = await contract.claimRewards(contributor);
        return tx;
    } catch (error) {
        console.error('Error claiming rewards:', error);
        return null;
    }
}

/**
 * Get contributor information
 */
export async function getContributorInfo(
    provider: Provider,
    contributor: string,
    registryAddress?: string,
    distributorAddress?: string
): Promise<ContributorInfo | null> {
    try {
        const registryContract = getContributionRegistryContract(provider, registryAddress);
        const distributorContract = getBuilderRewardDistributorContract(provider, distributorAddress);

        const [registryInfo, activeScore, availableRewards] = await Promise.all([
            registryContract.getContributorInfo(contributor),
            distributorContract.getContributorActiveScore(contributor),
            distributorContract.getAvailableRewards(contributor),
        ]);

        return {
            totalScore: BigInt(registryInfo.totalScore.toString()),
            lastContributionTimestamp: BigInt(registryInfo.lastContributionTimestamp.toString()),
            contributionCount: BigInt(registryInfo.contributionCount.toString()),
            activeScore: BigInt(activeScore.toString()),
            availableRewards: BigInt(availableRewards.toString()),
        };
    } catch (error) {
        console.error('Error fetching contributor info:', error);
        return null;
    }
}

/**
 * Get contribution history
 */
export async function getContributionHistory(
    provider: Provider,
    contributor: string,
    registryAddress?: string
): Promise<Contribution[] | null> {
    try {
        // Note: This would require additional contract functions to iterate contributions
        // For now, this is a placeholder
        const registryContract = getContributionRegistryContract(provider, registryAddress);

        // In a full implementation, we'd need a function to get all contributions for a contributor
        // This might require off-chain indexing or a different contract design
        return [];
    } catch (error) {
        console.error('Error fetching contribution history:', error);
        return null;
    }
}

/**
 * Record a contribution (admin only)
 */
export async function recordContribution(
    signer: Signer,
    contributor: string,
    contributionHash: string,
    prUrl: string,
    score: bigint,
    timestamp: bigint,
    contributionType: ContributionType,
    registryAddress?: string
): Promise<ethers.TransactionResponse | null> {
    try {
        const contract = getContributionRegistryContract(signer, registryAddress);
        const tx = await contract.recordContribution(
            contributor,
            contributionHash,
            prUrl,
            score,
            timestamp,
            contributionType
        );
        return tx;
    } catch (error) {
        console.error('Error recording contribution:', error);
        return null;
    }
}

/**
 * Deposit rewards into the distributor
 */
export async function depositRewards(
    signer: Signer,
    amount: bigint,
    distributorAddress?: string
): Promise<ethers.TransactionResponse | null> {
    try {
        const contract = getBuilderRewardDistributorContract(signer, distributorAddress);
        const tx = await contract.depositRewards(amount);
        return tx;
    } catch (error) {
        console.error('Error depositing rewards:', error);
        return null;
    }
}

/**
 * Trigger daily reward distribution (admin only)
 */
export async function distributeDailyRewards(
    signer: Signer,
    distributorAddress?: string
): Promise<ethers.TransactionResponse | null> {
    try {
        const contract = getBuilderRewardDistributorContract(signer, distributorAddress);
        const tx = await contract.distributeDailyRewards();
        return tx;
    } catch (error) {
        console.error('Error distributing daily rewards:', error);
        return null;
    }
}

