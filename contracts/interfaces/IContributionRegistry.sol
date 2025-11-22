// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IContributionRegistry
 * @notice Interface for ContributionRegistry contract
 */
interface IContributionRegistry {
    enum ContributionType {
        CODE,
        SDK,
        DOCS,
        TESTS,
        BUGFIX,
        FEATURE,
        REFACTOR
    }

    struct Contribution {
        address contributor;
        string prUrl;
        uint256 score;
        uint256 timestamp;
        ContributionType contributionType;
        bool verified;
        bytes32 contributionHash;
    }

    function recordContribution(
        address contributor,
        string calldata prUrl,
        ContributionType contributionType
    ) external;

    function verifyContribution(bytes32 contributionHash, bool verified) external;

    function getContributorHistory(address contributor)
        external
        view
        returns (
            bytes32[] memory hashes,
            uint256[] memory scores,
            uint256[] memory timestamps
        );

    function getContributorTotalScore(address contributor) external view returns (uint256);

    function calculateDecayedScore(uint256 baseScore, uint256 timestamp) external view returns (uint256);
}

