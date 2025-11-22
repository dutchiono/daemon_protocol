/**
 * @title Daemon SDK Types
 * @notice TypeScript type definitions for Daemon SDK
 */

import { PoolId } from '@uniswap/v4-core/contracts/types/PoolId';

/**
 * Pool configuration from hook
 */
export interface PoolConfig {
    feyIsToken0: boolean;
    locker: string;
    mevModule: string;
    mevModuleEnabled: boolean;
    feyFee: number; // uint24
    pairedFee: number; // uint24
    poolExtension: string;
    poolExtensionSetup: boolean;
    poolCreationTimestamp: bigint;
    tokenAdmin: string;
}

/**
 * Hook configuration
 */
export interface HookConfig {
    baseToken: string;
    weth: string;
    protocolFee: number; // uint24
    builderRewardDistributor: string;
    feeSplitter: string;
    maxLpFee: number; // uint24
    maxMevLpFee: number; // uint24
    maxMevModuleDelay: bigint;
    protocolFeeNumerator: bigint;
}

/**
 * Pool information
 */
export interface PoolInfo {
    poolId: string;
    config: PoolConfig;
    tokenAdmin: string;
}

/**
 * Contributor information
 */
export interface ContributorInfo {
    totalScore: bigint;
    lastContributionTimestamp: bigint;
    contributionCount: bigint;
    activeScore: bigint;
    availableRewards: bigint;
}

/**
 * Contribution type enum
 */
export enum ContributionType {
    Code = 0,
    SDK = 1,
    Docs = 2,
    Tests = 3,
    Bugfix = 4,
    Feature = 5,
    Refactor = 6,
}

/**
 * Contribution record
 */
export interface Contribution {
    contributionHash: string;
    prUrl: string;
    score: bigint;
    timestamp: bigint;
    contributionType: ContributionType;
}

/**
 * Token deployment configuration
 */
export interface DeploymentConfig {
    tokenConfig: {
        tokenAdmin: string;
        name: string;
        symbol: string;
        salt: string;
        image: string;
        metadata: string;
        context: string;
        originatingChainId: bigint;
    };
    poolConfig: {
        hook: string;
        pairedToken: string;
        tickIfToken0IsFey: number;
        tickSpacing: number;
        poolData: string;
    };
    lockerConfig: {
        locker: string;
        rewardAdmins: string[];
        rewardRecipients: string[];
        rewardBps: number[];
        tickLower: number[];
        tickUpper: number[];
        positionBps: number[];
        lockerData: string;
    };
    mevModuleConfig: {
        mevModule: string;
        mevModuleData: string;
    };
    extensionConfigs: any[];
}

