/**
 * @title Daemon Contract Addresses
 * @notice Contract addresses for Daemon Protocol on different networks
 */

export type Network = 'base' | 'base-sepolia' | 'localhost';

export interface ContractAddresses {
    daemonHook: string;
    daemonToken: string; // DAEMON base token address
    daemonFactory: string; // Factory for deploying tokens
    builderRewardDistributor: string;
    contributionRegistry: string;
    feeSplitter: string;
    weth?: string; // WETH address (Base: 0x4200000000000000000000000000000000000006)
}

/**
 * Contract addresses by network
 */
export const CONTRACT_ADDRESSES: Record<Network, ContractAddresses> = {
    'base': {
        daemonHook: '0x0000000000000000000000000000000000000000', // TODO: Deploy
        daemonToken: '0x0000000000000000000000000000000000000000', // TODO: Deploy DAEMON token
        daemonFactory: '0x0000000000000000000000000000000000000000', // TODO: Deploy
        builderRewardDistributor: '0x0000000000000000000000000000000000000000', // TODO: Deploy
        contributionRegistry: '0x0000000000000000000000000000000000000000', // TODO: Deploy
        feeSplitter: '0x0000000000000000000000000000000000000000', // TODO: Deploy
        weth: '0x4200000000000000000000000000000000000006', // Base WETH
    },
    'base-sepolia': {
        daemonHook: '0x0000000000000000000000000000000000000000', // TODO: Deploy
        daemonToken: '0x0000000000000000000000000000000000000000', // TODO: Deploy DAEMON token
        daemonFactory: '0x0000000000000000000000000000000000000000', // TODO: Deploy
        builderRewardDistributor: '0x0000000000000000000000000000000000000000', // TODO: Deploy
        contributionRegistry: '0x0000000000000000000000000000000000000000', // TODO: Deploy
        feeSplitter: '0x0000000000000000000000000000000000000000', // TODO: Deploy
        weth: '0x4200000000000000000000000000000000000006', // Base Sepolia WETH
    },
    'localhost': {
        daemonHook: '0x0000000000000000000000000000000000000000', // TODO: Deploy
        daemonToken: '0x0000000000000000000000000000000000000000', // TODO: Deploy DAEMON token
        daemonFactory: '0x0000000000000000000000000000000000000000', // TODO: Deploy
        builderRewardDistributor: '0x0000000000000000000000000000000000000000', // TODO: Deploy
        contributionRegistry: '0x0000000000000000000000000000000000000000', // TODO: Deploy
        feeSplitter: '0x0000000000000000000000000000000000000000', // TODO: Deploy
        weth: '0x4200000000000000000000000000000000000006', // Mock WETH
    },
};

/**
 * Get contract addresses for a network
 */
export function getContractAddresses(network: Network = 'base'): ContractAddresses {
    return CONTRACT_ADDRESSES[network];
}

/**
 * DAEMON Hook address (mainnet)
 */
export const DAEMON_HOOK_ADDRESS = CONTRACT_ADDRESSES.base.daemonHook;

/**
 * DAEMON Token address (mainnet)
 */
export const DAEMON_TOKEN_ADDRESS = CONTRACT_ADDRESSES.base.daemonToken;

/**
 * DAEMON Factory address (mainnet)
 */
export const DAEMON_FACTORY_ADDRESS = CONTRACT_ADDRESSES.base.daemonFactory;

/**
 * Builder Reward Distributor address (mainnet)
 */
export const BUILDER_REWARD_DISTRIBUTOR_ADDRESS = CONTRACT_ADDRESSES.base.builderRewardDistributor;

/**
 * Contribution Registry address (mainnet)
 */
export const CONTRIBUTION_REGISTRY_ADDRESS = CONTRACT_ADDRESSES.base.contributionRegistry;

/**
 * Fee Splitter address (mainnet)
 */
export const FEE_SPLITTER_ADDRESS = CONTRACT_ADDRESSES.base.feeSplitter;

/**
 * WETH address (Base mainnet)
 */
export const WETH_ADDRESS = CONTRACT_ADDRESSES.base.weth || '0x4200000000000000000000000000000000000006';

