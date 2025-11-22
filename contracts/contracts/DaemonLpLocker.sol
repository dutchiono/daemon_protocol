// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

/**
 * @title DaemonLpLocker
 * @notice Manages LP positions and distributes rewards to configured recipients
 * @dev Adapted from FEY LP Locker, made upgradeable with UUPS pattern
 * LP Locker Address: 0x975aF6a738f502935AFE64633Ad3EA2A3eb3e7Fa (FEY mainnet reference)
 */
contract DaemonLpLocker is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    // Constants
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MAX_REWARD_PARTICIPANTS = 10;
    uint256 public constant MAX_LP_POSITIONS = 10;

    // Configuration
    string public version;
    address public factory;
    address public feeLocker;
    address public positionManager;
    address public permit2;

    // Token reward configuration
    struct PoolKey {
        address currency0;
        address currency1;
        uint24 fee;
        int24 tickSpacing;
        address hooks;
    }

    struct TokenRewards {
        address token;
        PoolKey poolKey;
        uint256 positionId;
        uint256 numPositions;
        uint16[] rewardBps; // Basis points for each recipient
        address[] rewardAdmins; // Admin addresses
        address[] rewardRecipients; // Recipient addresses
    }

    mapping(address => TokenRewards) public tokenRewards; // token => rewards config

    // Events
    event RewardsCollected(address indexed token, uint256 amount);
    event TokenRewardsUpdated(address indexed token, TokenRewards rewards);
    event FactoryUpdated(address indexed oldFactory, address indexed newFactory);
    event FeeLockerUpdated(address indexed oldFeeLocker, address indexed newFeeLocker);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the LP locker
     * @param _factory Factory address
     * @param _feeLocker Fee locker address
     * @param _positionManager Position manager address
     * @param _permit2 Permit2 address
     * @param _owner Owner address
     */
    function initialize(
        address _factory,
        address _feeLocker,
        address _positionManager,
        address _permit2,
        address _owner
    ) public initializer {
        __Ownable_init(_owner);
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        // Factory can be 0x0 initially, will be set via setFactory() after Factory deployment
        // require(_factory != address(0), "Invalid factory");
        require(_feeLocker != address(0), "Invalid fee locker");

        version = "1.0.0";
        factory = _factory;
        feeLocker = _feeLocker;
        positionManager = _positionManager;
        permit2 = _permit2;
    }

    /**
     * @notice Collect rewards for a token
     * @param token Token address
     */
    function collectRewards(address token) external nonReentrant {
        TokenRewards memory rewards = tokenRewards[token];
        require(rewards.token != address(0), "Token not configured");

        // Implementation would collect LP rewards and distribute
        // This is a placeholder - actual implementation depends on Uniswap V4 position manager

        emit RewardsCollected(token, 0); // Placeholder
    }

    /**
     * @notice Set token rewards configuration
     * @param token Token address
     * @param rewards Rewards configuration
     */
    function setTokenRewards(address token, TokenRewards calldata rewards) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(rewards.rewardRecipients.length <= MAX_REWARD_PARTICIPANTS, "Too many recipients");
        require(rewards.numPositions <= MAX_LP_POSITIONS, "Too many positions");

        // Validate BPS sum
        uint256 totalBps = 0;
        for (uint256 i = 0; i < rewards.rewardBps.length; i++) {
            totalBps += rewards.rewardBps[i];
        }
        require(totalBps <= BASIS_POINTS, "BPS exceeds 100%");

        tokenRewards[token] = rewards;
        emit TokenRewardsUpdated(token, rewards);
    }

    /**
     * @notice Set factory address
     * @param _factory New factory address
     */
    function setFactory(address _factory) external onlyOwner {
        require(_factory != address(0), "Invalid factory");
        address oldFactory = factory;
        factory = _factory;
        emit FactoryUpdated(oldFactory, _factory);
    }

    /**
     * @notice Set fee locker address
     * @param _feeLocker New fee locker address
     */
    function setFeeLocker(address _feeLocker) external onlyOwner {
        require(_feeLocker != address(0), "Invalid fee locker");
        address oldFeeLocker = feeLocker;
        feeLocker = _feeLocker;
        emit FeeLockerUpdated(oldFeeLocker, _feeLocker);
    }

    /**
     * @notice Authorize upgrade (UUPS)
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}

