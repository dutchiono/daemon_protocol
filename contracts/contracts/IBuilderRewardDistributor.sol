// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IBuilderRewardDistributor
 * @notice Interface for BuilderRewardDistributor contract
 */
interface IBuilderRewardDistributor {
    // Events
    event RewardDeposited(address indexed sender, uint256 amount);
    event RewardsClaimed(address indexed contributor, uint256 amount);
    event ContributionRegistered(address indexed contributor, uint256 score, uint256 timestamp);
    event ContributorScoreUpdated(address indexed contributor, uint256 newScore);
    event DailyRewardsDistributed(uint256 totalDistributed, uint256 timestamp);

    // Functions
    function depositRewards(uint256 amount) external;
    function registerContribution(address contributor, uint256 score, uint256 timestamp) external;
    function getContributorActiveScore(address contributor) external view returns (uint256);
    function distributeDailyRewards() external;
    function claimRewards(address contributor) external;
    function getAvailableRewards(address contributor) external view returns (uint256);
}

