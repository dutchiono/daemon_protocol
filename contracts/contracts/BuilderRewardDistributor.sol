// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title BuilderRewardDistributor
 * @notice Core contract handling builder reward distribution with time-based decay
 * @dev Receives 5% of all protocol fees and distributes to active contributors
 */
contract BuilderRewardDistributor is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Constants
    uint256 public constant BUILDER_CUT_BPS = 500; // 5% hard cut (500 basis points)
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant DECAY_RATE_BPS = 500; // 5% daily decay (500 basis points)
    uint256 public constant DECAY_GRACE_PERIOD_DAYS = 7;
    uint256 public constant MIN_SCORE_FLOOR = 1; // 0.1 * 10 (scaled for precision)
    uint256 public constant SCORE_PRECISION = 10;

    // Contribution registry reference
    address public contributionRegistry;

    // Token that rewards are paid in (typically WETH or DAEMON)
    address public rewardToken;
    
    // Reward token split configuration: token => WETH split BPS (0-10000)
    // Remaining goes to DAEMON token
    mapping(address => uint256) public rewardTokenSplitBps; // token => WETH split BPS
    address public daemonToken; // DAEMON token address (optional, can be zero)

    // Daily distribution tracking
    struct DailyDistribution {
        uint256 totalScore;
        uint256 totalRewards;
        uint256 timestamp;
        bool distributed;
    }

    mapping(uint256 => DailyDistribution) public dailyDistributions; // epoch day => distribution
    mapping(address => uint256) public pendingRewards; // contributor => pending amount
    mapping(address => uint256) public lastClaimEpoch; // contributor => last claimed epoch

    // Epoch tracking (1 day = 1 epoch)
    uint256 public currentEpoch;
    uint256 public constant EPOCH_DURATION = 1 days;

    // Events
    event ContributionRegistered(address indexed contributor, uint256 score, uint256 timestamp);
    event ScoreUpdated(address indexed contributor, int256 scoreDelta, uint256 newScore);
    event DailyRewardsDistributed(uint256 indexed epoch, uint256 totalScore, uint256 totalRewards);
    event RewardsClaimed(address indexed contributor, uint256 amount, uint256 epoch);
    event RewardsDeposited(address indexed depositor, uint256 amount);
    event ContributionRegistryUpdated(address oldRegistry, address newRegistry);
    event RewardTokenUpdated(address oldToken, address newToken);
    event RewardTokenSplitUpdated(address indexed token, uint256 wethSplitBps);
    event DaemonTokenUpdated(address indexed daemonToken);

    constructor(
        address _contributionRegistry,
        address _rewardToken,
        address _initialOwner
    ) Ownable(_initialOwner) {
        require(_contributionRegistry != address(0), "Invalid registry");
        require(_rewardToken != address(0), "Invalid token");

        contributionRegistry = _contributionRegistry;
        rewardToken = _rewardToken;
        currentEpoch = block.timestamp / EPOCH_DURATION;
    }

    /**
     * @notice Register a new contribution and update contributor score
     * @dev Can only be called by contribution registry
     * @param contributor Address of the contributor
     * @param score Contribution score (before decay)
     * @param timestamp Contribution timestamp
     */
    function registerContribution(
        address contributor,
        uint256 score,
        uint256 timestamp
    ) external {
        require(msg.sender == contributionRegistry, "Only registry");
        require(contributor != address(0), "Invalid contributor");
        require(score > 0, "Invalid score");

        emit ContributionRegistered(contributor, score, timestamp);
    }

    /**
     * @notice Update contributor score (called by registry after decay calculation)
     * @dev Can only be called by contribution registry
     * @param contributor Address of the contributor
     * @param scoreDelta Change in score (can be negative for decay)
     */
    function updateContributorScore(
        address contributor,
        int256 scoreDelta
    ) external {
        require(msg.sender == contributionRegistry, "Only registry");
        require(contributor != address(0), "Invalid contributor");

        emit ScoreUpdated(contributor, scoreDelta, 0); // Registry tracks actual score
    }

    /**
     * @notice Get contributor's current score with decay applied
     * @param contributor Address of the contributor
     * @param timestamp Timestamp to calculate decay at
     * @return Current score after decay
     */
    function getContributorScore(
        address contributor,
        uint256 timestamp
    ) external view returns (uint256) {
        // This will query the contribution registry for the actual score
        // For now, return 0 as registry will handle the calculation
        return 0;
    }

    /**
     * @notice Distribute daily rewards based on contributor scores
     * @dev Calculates proportional shares and updates pending rewards
     * @param contributors Array of contributor addresses
     * @param scores Array of decayed scores for each contributor
     */
    function distributeDailyRewards(
        address[] calldata contributors,
        uint256[] calldata scores
    ) external nonReentrant {
        require(msg.sender == contributionRegistry, "Only registry");
        require(contributors.length == scores.length, "Length mismatch");

        uint256 epoch = block.timestamp / EPOCH_DURATION;
        require(epoch > currentEpoch || dailyDistributions[epoch].distributed == false, "Already distributed");

        uint256 totalScore = 0;
        for (uint256 i = 0; i < scores.length; i++) {
            totalScore += scores[i];
        }

        require(totalScore > 0, "No contributions");

        uint256 availableRewards = IERC20(rewardToken).balanceOf(address(this));
        require(availableRewards > 0, "No rewards available");

        // Calculate and update pending rewards for each contributor
        for (uint256 i = 0; i < contributors.length; i++) {
            if (scores[i] > 0) {
                uint256 share = (availableRewards * scores[i]) / totalScore;
                pendingRewards[contributors[i]] += share;
            }
        }

        dailyDistributions[epoch] = DailyDistribution({
            totalScore: totalScore,
            totalRewards: availableRewards,
            timestamp: block.timestamp,
            distributed: true
        });

        if (epoch > currentEpoch) {
            currentEpoch = epoch;
        }

        emit DailyRewardsDistributed(epoch, totalScore, availableRewards);
    }

    /**
     * @notice Claim pending rewards for a contributor
     * @dev Contributors can claim their accumulated rewards
     */
    function claimRewards() external nonReentrant {
        address contributor = msg.sender;
        uint256 amount = pendingRewards[contributor];

        require(amount > 0, "No rewards");

        pendingRewards[contributor] = 0;
        uint256 epoch = block.timestamp / EPOCH_DURATION;
        lastClaimEpoch[contributor] = epoch;

        IERC20(rewardToken).safeTransfer(contributor, amount);

        emit RewardsClaimed(contributor, amount, epoch);
    }

    /**
     * @notice Deposit rewards into the distributor
     * @dev Called by fee splitter when 5% builder cut is collected
     * @dev Splits rewards between WETH and DAEMON based on configured split
     * @param token Token address being deposited
     * @param amount Amount of tokens to deposit
     */
    function depositRewards(address token, uint256 amount) external {
        require(amount > 0, "Invalid amount");
        require(token != address(0), "Invalid token");
        
        // Transfer tokens from sender
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        // Get split configuration for this token (defaults to 100% WETH if not set)
        uint256 wethSplitBps = rewardTokenSplitBps[token];
        if (wethSplitBps == 0) {
            wethSplitBps = BPS_DENOMINATOR; // Default: 100% WETH
        }
        
        // Calculate splits
        uint256 wethAmount = (amount * wethSplitBps) / BPS_DENOMINATOR;
        uint256 daemonAmount = amount - wethAmount;
        
        // If rewardToken is WETH, keep WETH portion here
        // If DAEMON token is set and amount > 0, we'd need to swap or handle differently
        // For now, we just accept the token as-is and track it
        // In production, you might want to swap DAEMON portion to WETH or vice versa
        
        emit RewardsDeposited(msg.sender, amount);
    }
    
    /**
     * @notice Set reward token split for a specific token
     * @dev Only owner can set split
     * @param token Token address
     * @param wethSplitBps WETH split in basis points (0-10000), remainder goes to DAEMON
     */
    function setRewardTokenSplit(address token, uint256 wethSplitBps) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(wethSplitBps <= BPS_DENOMINATOR, "Invalid BPS");
        
        rewardTokenSplitBps[token] = wethSplitBps;
        emit RewardTokenSplitUpdated(token, wethSplitBps);
    }
    
    /**
     * @notice Set DAEMON token address
     * @dev Only owner can set
     * @param _daemonToken DAEMON token address
     */
    function setDaemonToken(address _daemonToken) external onlyOwner {
        daemonToken = _daemonToken;
        emit DaemonTokenUpdated(_daemonToken);
    }

    /**
     * @notice Get available rewards for a contributor
     * @param contributor Address of the contributor
     * @return Available reward amount
     */
    function getAvailableRewards(address contributor) external view returns (uint256) {
        return pendingRewards[contributor];
    }

    /**
     * @notice Update contribution registry address
     * @dev Only owner can update
     * @param newRegistry New registry address
     */
    function setContributionRegistry(address newRegistry) external onlyOwner {
        require(newRegistry != address(0), "Invalid registry");
        address oldRegistry = contributionRegistry;
        contributionRegistry = newRegistry;
        emit ContributionRegistryUpdated(oldRegistry, newRegistry);
    }

    /**
     * @notice Update reward token address
     * @dev Only owner can update
     * @param newToken New reward token address
     */
    function setRewardToken(address newToken) external onlyOwner {
        require(newToken != address(0), "Invalid token");
        address oldToken = rewardToken;
        rewardToken = newToken;
        emit RewardTokenUpdated(oldToken, newToken);
    }

    /**
     * @notice Emergency withdrawal function (owner only)
     * @dev In case of emergency, owner can withdraw tokens
     * @param token Token address to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
}

