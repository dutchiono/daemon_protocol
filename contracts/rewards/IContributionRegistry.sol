// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IContributionRegistry
 * @notice Interface for ContributionRegistry contract
 */
interface IContributionRegistry {
    enum ContributionType {
        Code,
        SDK,
        Docs,
        Tests,
        Bugfix,
        Feature,
        Refactor
    }

    struct Contribution {
        bytes32 contributionHash;
        string prUrl;
        uint256 score;
        uint256 timestamp;
        ContributionType contributionType;
    }

    // Events
    event ContributionRecorded(
        address indexed contributor,
        bytes32 indexed contributionHash,
        string prUrl,
        uint256 score,
        uint256 timestamp,
        ContributionType contributionType
    );
    event BuilderRewardDistributorUpdated(address indexed newAddress);

    // Functions
    function setBuilderRewardDistributor(address _builderRewardDistributor) external;
    function recordContribution(
        address contributor,
        bytes32 contributionHash,
        string calldata prUrl,
        uint256 score,
        uint256 timestamp,
        ContributionType contributionType
    ) external;
    function getContributorInfo(address contributor)
        external
        view
        returns (
            uint256 totalScore,
            uint256 lastContributionTimestamp,
            uint256 contributionCount
        );
    function getContribution(bytes32 contributionHash)
        external
        view
        returns (Contribution memory);
}

