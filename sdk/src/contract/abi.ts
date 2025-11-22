/**
 * @title Daemon Contract ABIs
 * @notice ABIs for all Daemon Protocol contracts
 */

import { IDaemonHook } from '../../contracts/core/IDaemonHook.sol';
import { IBuilderRewardDistributor } from '../../contracts/rewards/IBuilderRewardDistributor.sol';
import { IContributionRegistry } from '../../contracts/rewards/IContributionRegistry.sol';

/**
 * Daemon Hook ABI
 */
export const DAEMON_HOOK_ABI = [
    // Configuration views
    'function baseToken() view returns (address)',
    'function weth() view returns (address)',
    'function protocolFee() view returns (uint24)',
    'function builderRewardDistributor() view returns (address)',
    'function feeSplitter() view returns (address)',

    // Pool-specific queries
    'function getTokenAdmin(bytes32 poolId) view returns (address)',
    'function getPoolConfig(bytes32 poolId) view returns (tuple(bool feyIsToken0, address locker, address mevModule, bool mevModuleEnabled, uint24 feyFee, uint24 pairedFee, address poolExtension, bool poolExtensionSetup, uint256 poolCreationTimestamp, address tokenAdmin))',
    'function poolExists(bytes32 poolId) view returns (bool)',
    'function poolTokenAdmin(bytes32 poolId) view returns (address)',

    // Constants
    'function MAX_LP_FEE() view returns (uint24)',
    'function MAX_MEV_LP_FEE() view returns (uint24)',
    'function MAX_MEV_MODULE_DELAY() view returns (uint256)',
    'function PROTOCOL_FEE_NUMERATOR() view returns (uint256)',

    // Events
    'event PoolInitialized(bytes32 indexed poolId, address indexed tokenAdmin, address locker)',
    'event BuilderRewardDistributorUpdated(address indexed newDistributor)',
    'event ProtocolFeeUpdated(uint24 newFee)',
] as const;

/**
 * Builder Reward Distributor ABI
 */
export const BUILDER_REWARD_DISTRIBUTOR_ABI = [
    'function depositRewards(uint256 amount)',
    'function registerContribution(address contributor, uint256 score, uint256 timestamp)',
    'function getContributorActiveScore(address contributor) view returns (uint256)',
    'function distributeDailyRewards()',
    'function claimRewards(address contributor)',
    'function getAvailableRewards(address contributor) view returns (uint256)',
    'event RewardDeposited(address indexed sender, uint256 amount)',
    'event RewardsClaimed(address indexed contributor, uint256 amount)',
    'event ContributionRegistered(address indexed contributor, uint256 score, uint256 timestamp)',
] as const;

/**
 * Contribution Registry ABI
 */
export const CONTRIBUTION_REGISTRY_ABI = [
    'function setBuilderRewardDistributor(address _builderRewardDistributor)',
    'function recordContribution(address contributor, bytes32 contributionHash, string prUrl, uint256 score, uint256 timestamp, uint8 contributionType)',
    'function getContributorInfo(address contributor) view returns (uint256 totalScore, uint256 lastContributionTimestamp, uint256 contributionCount)',
    'function getContribution(bytes32 contributionHash) view returns (tuple(bytes32 contributionHash, string prUrl, uint256 score, uint256 timestamp, uint8 contributionType))',
    'event ContributionRecorded(address indexed contributor, bytes32 indexed contributionHash, string prUrl, uint256 score, uint256 timestamp, uint8 contributionType)',
] as const;

/**
 * Fee Splitter ABI
 */
export const FEE_SPLITTER_ABI = [
    'function splitFees(address token, uint256 totalFees)',
    'function setTokenDevAddress(address token, address devAddress)',
    'function setTokenFeeSplit(address token, uint256 stakerShareBps)',
    'function getTokenFeeSplit(address token) view returns (uint256 stakerShareBps, uint256 tokenDevShareBps)',
    'function tokenDevAddress(address token) view returns (address)',
    'event FeesSplit(address indexed token, uint256 totalFees, uint256 builderCut, uint256 tokenDevShare, uint256 stakerShare)',
] as const;

