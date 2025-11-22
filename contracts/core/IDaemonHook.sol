// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {PoolId} from "@uniswap/v4-core/src/types/PoolId.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";

/**
 * @title IDaemonHook
 * @notice Interface for DaemonHook contract
 */
interface IDaemonHook {
    struct PoolConfig {
        bool feyIsToken0;
        address locker;
        address mevModule;
        bool mevModuleEnabled;
        uint24 feyFee;
        uint24 pairedFee;
        address poolExtension;
        bool poolExtensionSetup;
        uint256 poolCreationTimestamp;
        address tokenAdmin;
    }

    // View functions
    function baseToken() external view returns (address);
    function weth() external view returns (address);
    function protocolFee() external view returns (uint24);
    function builderRewardDistributor() external view returns (address);
    function feeSplitter() external view returns (address);
    function getTokenAdmin(PoolId poolId) external view returns (address);
    function getPoolConfig(PoolId poolId) external view returns (PoolConfig memory);
    function poolExists(PoolId poolId) external view returns (bool);
    function poolTokenAdmin(PoolId poolId) external view returns (address);

    // Pool initialization (matching Fey pattern)
    function initializePool(
        address fey,
        address pairedToken,
        int24 tickIfToken0IsFey,
        int24 tickSpacing,
        address locker,
        address mevModule,
        bytes calldata poolData
    ) external returns (PoolKey memory);

    // Constants
    function MAX_LP_FEE() external view returns (uint24);
    function MAX_MEV_LP_FEE() external view returns (uint24);
    function MAX_MEV_MODULE_DELAY() external view returns (uint256);
    function PROTOCOL_FEE_NUMERATOR() external view returns (uint256);
}

