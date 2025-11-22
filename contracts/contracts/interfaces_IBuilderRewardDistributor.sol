// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IBuilderRewardDistributor
 * @notice Interface for BuilderRewardDistributor contract
 */
interface IBuilderRewardDistributor {
    function registerContribution(
        address contributor,
        uint256 score,
        uint256 timestamp
    ) external;

    function updateContributorScore(
        address contributor,
        int256 scoreDelta
    ) external;

    function distributeDailyRewards(
        address[] calldata contributors,
        uint256[] calldata scores
    ) external;

    function claimRewards() external;

    function getContributorScore(
        address contributor,
        uint256 timestamp
    ) external view returns (uint256);

    function getAvailableRewards(address contributor) external view returns (uint256);

    function depositRewards(uint256 amount) external;
}

