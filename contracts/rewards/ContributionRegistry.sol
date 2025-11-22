// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ContributionRegistry
 * @notice On-chain registry of contributions and their metadata
 * @dev Links GitHub PRs to on-chain records and tracks contribution history
 */
contract ContributionRegistry is Ownable, ReentrancyGuard {

    // Contribution types
    enum ContributionType {
        CODE,      // 0
        SDK,       // 1
        DOCS,      // 2
        TESTS,     // 3
        BUGFIX,    // 4
        FEATURE,   // 5
        REFACTOR   // 6
    }

    // Contribution record
    struct Contribution {
        address contributor;
        string prUrl;
        uint256 score;
        uint256 timestamp;
        ContributionType contributionType;
        bool verified;
        bytes32 contributionHash;
    }

    // Contributor information
    struct ContributorInfo {
        address contributor;
        uint256 totalScore;
        uint256 lastContributionTimestamp;
        uint256 contributionCount;
    }

    // Builder reward distributor reference
    address public builderRewardDistributor;

    // Contribution records
    mapping(bytes32 => Contribution) public contributions; // contributionHash => Contribution
    mapping(address => bytes32[]) public contributorContributions; // contributor => contribution hashes
    mapping(address => ContributorInfo) public contributorInfo; // contributor => info

    // Contribution weights (in basis points, 10000 = 1.0x)
    mapping(ContributionType => uint256) public contributionWeights;

    // Base scores for contribution types
    uint256 public constant BASE_SCORE_CODE = 10;
    uint256 public constant BASE_SCORE_SDK = 8;
    uint256 public constant BASE_SCORE_DOCS = 5;
    uint256 public constant BASE_SCORE_TESTS = 3;
    uint256 public constant BASE_SCORE_BUGFIX = 15;
    uint256 public constant BASE_SCORE_FEATURE = 20;
    uint256 public constant BASE_SCORE_REFACTOR = 7;

    // Decay constants
    uint256 public constant DECAY_RATE_BPS = 500; // 5% daily decay
    uint256 public constant DECAY_GRACE_PERIOD = 7 days;
    uint256 public constant MIN_SCORE_FLOOR = 1; // 0.1 * 10 (scaled)
    uint256 public constant SCORE_PRECISION = 10;

    // Access control
    mapping(address => bool) public authorizedRecorders; // Who can record contributions

    // Events
    event ContributionRecorded(
        address indexed contributor,
        bytes32 indexed contributionHash,
        string prUrl,
        uint256 score,
        ContributionType contributionType,
        uint256 timestamp
    );
    event ContributionVerified(bytes32 indexed contributionHash, bool verified);
    event AuthorizedRecorderUpdated(address indexed recorder, bool authorized);
    event BuilderRewardDistributorUpdated(address oldDistributor, address newDistributor);

    constructor(address _initialOwner) Ownable(_initialOwner) {
        // Initialize contribution weights (in basis points)
        contributionWeights[ContributionType.CODE] = 10000;      // 1.0x
        contributionWeights[ContributionType.SDK] = 8000;       // 0.8x
        contributionWeights[ContributionType.DOCS] = 5000;      // 0.5x
        contributionWeights[ContributionType.TESTS] = 3000;    // 0.3x
        contributionWeights[ContributionType.BUGFIX] = 15000;   // 1.5x
        contributionWeights[ContributionType.FEATURE] = 20000;  // 2.0x
        contributionWeights[ContributionType.REFACTOR] = 7000;  // 0.7x

        // Owner is authorized by default
        authorizedRecorders[_initialOwner] = true;
    }

    /**
     * @notice Record a new contribution
     * @dev Can only be called by authorized recorders
     * @param contributor Address of the contributor
     * @param prUrl GitHub PR URL
     * @param contributionType Type of contribution
     */
    function recordContribution(
        address contributor,
        string calldata prUrl,
        ContributionType contributionType
    ) external {
        require(authorizedRecorders[msg.sender] || msg.sender == owner(), "Not authorized");
        require(contributor != address(0), "Invalid contributor");
        require(bytes(prUrl).length > 0, "Invalid PR URL");

        // Calculate score based on type and weight
        uint256 baseScore = getBaseScore(contributionType);
        uint256 weight = contributionWeights[contributionType];
        uint256 score = (baseScore * weight) / 10000;

        // Create contribution hash
        bytes32 contributionHash = keccak256(
            abi.encodePacked(contributor, prUrl, block.timestamp, contributionType)
        );

        // Ensure hash is unique
        require(contributions[contributionHash].timestamp == 0, "Duplicate contribution");

        // Create contribution record
        Contribution memory contribution = Contribution({
            contributor: contributor,
            prUrl: prUrl,
            score: score,
            timestamp: block.timestamp,
            contributionType: contributionType,
            verified: true, // Auto-verified if recorded by authorized recorder
            contributionHash: contributionHash
        });

        contributions[contributionHash] = contribution;
        contributorContributions[contributor].push(contributionHash);

        // Update contributor info
        ContributorInfo storage info = contributorInfo[contributor];
        if (info.contributor == address(0)) {
            info.contributor = contributor;
        }
        info.totalScore += score;
        info.lastContributionTimestamp = block.timestamp;
        info.contributionCount += 1;

        // Notify builder reward distributor
        if (builderRewardDistributor != address(0)) {
            // Call registerContribution on distributor
            (bool success, ) = builderRewardDistributor.call(
                abi.encodeWithSignature(
                    "registerContribution(address,uint256,uint256)",
                    contributor,
                    score,
                    block.timestamp
                )
            );
            // If call fails, we still record the contribution
        }

        emit ContributionRecorded(
            contributor,
            contributionHash,
            prUrl,
            score,
            contributionType,
            block.timestamp
        );
    }

    /**
     * @notice Verify a contribution
     * @dev Only owner can verify contributions
     * @param contributionHash Hash of the contribution
     * @param verified Verification status
     */
    function verifyContribution(bytes32 contributionHash, bool verified) external onlyOwner {
        require(contributions[contributionHash].timestamp > 0, "Contribution not found");
        contributions[contributionHash].verified = verified;
        emit ContributionVerified(contributionHash, verified);
    }

    /**
     * @notice Get contribution history for a contributor
     * @param contributor Address of the contributor
     * @return hashes Array of contribution hashes
     * @return scores Array of contribution scores
     * @return timestamps Array of contribution timestamps
     */
    function getContributorHistory(address contributor)
        external
        view
        returns (
            bytes32[] memory hashes,
            uint256[] memory scores,
            uint256[] memory timestamps
        )
    {
        bytes32[] memory contribHashes = contributorContributions[contributor];
        uint256 count = contribHashes.length;

        hashes = new bytes32[](count);
        scores = new uint256[](count);
        timestamps = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            Contribution memory contrib = contributions[contribHashes[i]];
            hashes[i] = contrib.contributionHash;
            scores[i] = contrib.score;
            timestamps[i] = contrib.timestamp;
        }
    }

    /**
     * @notice Calculate decayed score for a contribution
     * @param baseScore Original contribution score
     * @param timestamp Contribution timestamp
     * @return Decayed score
     */
    function calculateDecayedScore(uint256 baseScore, uint256 timestamp) public view returns (uint256) {
        if (baseScore == 0) return 0;

        uint256 daysSince = (block.timestamp - timestamp) / 1 days;

        // Grace period - no decay for first 7 days
        if (daysSince < 7) {
            return baseScore;
        }

        // Exponential decay: score * e^(-decay_rate * days)
        // Using approximation: e^(-x) ≈ (1 - x) for small x, or use fixed-point math
        uint256 daysDecayed = daysSince - 7;

        // Calculate decay factor: (1 - decay_rate)^days
        // Using basis points: (10000 - 500)^days / 10000^days
        // Simplified: multiply by (9500/10000) for each day

        uint256 decayedScore = baseScore;
        for (uint256 i = 0; i < daysDecayed && decayedScore > MIN_SCORE_FLOOR; i++) {
            decayedScore = (decayedScore * 9500) / 10000; // 5% decay per day
            if (decayedScore < MIN_SCORE_FLOOR) {
                decayedScore = MIN_SCORE_FLOOR;
                break;
            }
        }

        return decayedScore;
    }

    /**
     * @notice Get current total score for a contributor (with decay applied)
     * @param contributor Address of the contributor
     * @return Total decayed score
     */
    function getContributorTotalScore(address contributor) external view returns (uint256) {
        bytes32[] memory contribHashes = contributorContributions[contributor];
        uint256 totalScore = 0;

        for (uint256 i = 0; i < contribHashes.length; i++) {
            Contribution memory contrib = contributions[contribHashes[i]];
            if (contrib.verified) {
                totalScore += calculateDecayedScore(contrib.score, contrib.timestamp);
            }
        }

        return totalScore;
    }

    /**
     * @notice Get base score for a contribution type
     * @param contributionType Type of contribution
     * @return Base score
     */
    function getBaseScore(ContributionType contributionType) public pure returns (uint256) {
        if (contributionType == ContributionType.CODE) return BASE_SCORE_CODE;
        if (contributionType == ContributionType.SDK) return BASE_SCORE_SDK;
        if (contributionType == ContributionType.DOCS) return BASE_SCORE_DOCS;
        if (contributionType == ContributionType.TESTS) return BASE_SCORE_TESTS;
        if (contributionType == ContributionType.BUGFIX) return BASE_SCORE_BUGFIX;
        if (contributionType == ContributionType.FEATURE) return BASE_SCORE_FEATURE;
        if (contributionType == ContributionType.REFACTOR) return BASE_SCORE_REFACTOR;
        return 0;
    }

    /**
     * @notice Set authorized recorder
     * @dev Only owner can authorize recorders
     * @param recorder Address to authorize/revoke
     * @param authorized Authorization status
     */
    function setAuthorizedRecorder(address recorder, bool authorized) external onlyOwner {
        authorizedRecorders[recorder] = authorized;
        emit AuthorizedRecorderUpdated(recorder, authorized);
    }

    /**
     * @notice Set builder reward distributor address
     * @dev Only owner can update
     * @param newDistributor New distributor address
     */
    function setBuilderRewardDistributor(address newDistributor) external onlyOwner {
        address oldDistributor = builderRewardDistributor;
        builderRewardDistributor = newDistributor;
        emit BuilderRewardDistributorUpdated(oldDistributor, newDistributor);
    }

    /**
     * @notice Update contribution weight for a type
     * @dev Only owner can update weights
     * @param contributionType Type of contribution
     * @param weight New weight in basis points
     */
    function setContributionWeight(ContributionType contributionType, uint256 weight) external onlyOwner {
        require(weight <= 50000, "Weight too high"); // Max 5.0x
        contributionWeights[contributionType] = weight;
    }
}

