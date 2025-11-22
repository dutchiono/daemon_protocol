/**
 * @title Daemon Hook SDK Functions
 * @notice Functions for interacting with DaemonHook contract
 */

import { ethers } from 'ethers';
import type { Provider, Signer } from 'ethers';
import { DAEMON_HOOK_ABI } from '../contract/abi.js';
import { DAEMON_HOOK_ADDRESS } from '../contract/address.js';
import type { PoolConfig, HookConfig } from '../types/index.js';
import { PoolId } from '@uniswap/v4-core/contracts/types/PoolId';

/**
 * Get Daemon Hook contract instance
 */
export function getDaemonHookContract(
    providerOrSigner: Provider | Signer,
    hookAddress?: string
): ethers.Contract {
    return new ethers.Contract(
        hookAddress || DAEMON_HOOK_ADDRESS,
        DAEMON_HOOK_ABI,
        providerOrSigner
    );
}

/**
 * Get hook configuration
 */
export async function getHookConfig(
    provider: Provider,
    hookAddress?: string
): Promise<HookConfig | null> {
    try {
        const hookContract = getDaemonHookContract(provider, hookAddress);

        const [
            baseToken,
            weth,
            protocolFee,
            builderRewardDistributor,
            feeSplitter,
            maxLpFee,
            maxMevLpFee,
            maxMevModuleDelay,
            protocolFeeNumerator,
        ] = await Promise.all([
            hookContract.baseToken(),
            hookContract.weth(),
            hookContract.protocolFee(),
            hookContract.builderRewardDistributor(),
            hookContract.feeSplitter(),
            hookContract.MAX_LP_FEE(),
            hookContract.MAX_MEV_LP_FEE(),
            hookContract.MAX_MEV_MODULE_DELAY(),
            hookContract.PROTOCOL_FEE_NUMERATOR(),
        ]);

        return {
            baseToken,
            weth,
            protocolFee: Number(protocolFee),
            builderRewardDistributor,
            feeSplitter,
            maxLpFee: Number(maxLpFee),
            maxMevLpFee: Number(maxMevLpFee),
            maxMevModuleDelay,
            protocolFeeNumerator,
        };
    } catch (error) {
        console.error('Error fetching hook config:', error);
        return null;
    }
}

/**
 * Get pool information
 */
export async function getPoolInfo(
    provider: Provider,
    poolId: string,
    hookAddress?: string
): Promise<{ config: PoolConfig; tokenAdmin: string } | null> {
    try {
        const hookContract = getDaemonHookContract(provider, hookAddress);

        const [config, tokenAdmin] = await Promise.all([
            hookContract.getPoolConfig(poolId),
            hookContract.getTokenAdmin(poolId),
        ]);

        return {
            config: {
                feyIsToken0: config.feyIsToken0,
                locker: config.locker,
                mevModule: config.mevModule,
                mevModuleEnabled: config.mevModuleEnabled,
                feyFee: Number(config.feyFee),
                pairedFee: Number(config.pairedFee),
                poolExtension: config.poolExtension,
                poolExtensionSetup: config.poolExtensionSetup,
                poolCreationTimestamp: config.poolCreationTimestamp,
                tokenAdmin: config.tokenAdmin,
            },
            tokenAdmin,
        };
    } catch (error) {
        console.error('Error fetching pool info:', error);
        return null;
    }
}

/**
 * Get token admin for a pool
 */
export async function getPoolTokenAdmin(
    provider: Provider,
    poolId: string,
    hookAddress?: string
): Promise<string | null> {
    try {
        const hookContract = getDaemonHookContract(provider, hookAddress);
        return await hookContract.getTokenAdmin(poolId);
    } catch (error) {
        console.error('Error fetching token admin:', error);
        return null;
    }
}

/**
 * Check if pool exists
 */
export async function poolExists(
    provider: Provider,
    poolId: string,
    hookAddress?: string
): Promise<boolean | null> {
    try {
        const hookContract = getDaemonHookContract(provider, hookAddress);
        return await hookContract.poolExists(poolId);
    } catch (error) {
        console.error('Error checking pool existence:', error);
        return null;
    }
}

/**
 * Get builder reward split information
 */
export async function getBuilderRewardSplit(
    provider: Provider,
    hookAddress?: string
): Promise<{ distributor: string; feeSplitter: string } | null> {
    try {
        const hookContract = getDaemonHookContract(provider, hookAddress);
        const [distributor, feeSplitter] = await Promise.all([
            hookContract.builderRewardDistributor(),
            hookContract.feeSplitter(),
        ]);

        return { distributor, feeSplitter };
    } catch (error) {
        console.error('Error fetching builder reward split:', error);
        return null;
    }
}

