// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title SocialNetworkFund
 * @notice Receives fees from Daemon Protocol and distributes to network operators
 */
contract SocialNetworkFund is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20 for IERC20;

    // Operator types
    enum OperatorType {
        HUB,      // Message relay hub
        PDS,      // Personal Data Server
        GATEWAY   // API Gateway
    }

    // Operator information
    struct Operator {
        OperatorType operatorType;
        string endpoint;
        uint256 stake;
        uint256 registeredAt;
        bool active;
        uint256 totalRewards;
    }

    // Operator metrics (updated by backend service)
    struct OperatorMetrics {
        uint256 uptime;              // Uptime percentage (0-10000 = 0-100%)
        uint256 messageThroughput;    // Messages processed
        uint256 userCount;            // Users served (for PDS)
        uint256 apiRequests;          // API requests served (for Gateway)
        uint256 lastUpdate;           // Last metrics update timestamp
    }

    // Epoch information
    struct Epoch {
        uint256 startTime;
        uint256 endTime;
        uint256 totalFees;
        bool distributed;
    }

    // Constants
    uint256 public constant EPOCH_DURATION = 7 days;
    uint256 public constant MIN_STAKE_HUB = 1000 * 10**18;      // 1000 DAEMON
    uint256 public constant MIN_STAKE_PDS = 500 * 10**18;       // 500 DAEMON
    uint256 public constant MIN_STAKE_GATEWAY = 2000 * 10**18;  // 2000 DAEMON
    uint256 public constant MIN_UPTIME = 9500;                   // 95% uptime required

    // State variables
    mapping(address => Operator) public operators;
    mapping(address => OperatorMetrics) public operatorMetrics;
    mapping(uint256 => Epoch) public epochs;
    mapping(address => mapping(address => uint256)) public operatorRewards; // token => operator => amount

    address public daemonToken; // DAEMON token address
    uint256 public currentEpoch;
    uint256 public hubAllocation;      // Percentage for hubs (in basis points)
    uint256 public pdsAllocation;      // Percentage for PDS (in basis points)
    uint256 public gatewayAllocation;  // Percentage for gateways (in basis points)

    // Events
    event OperatorRegistered(
        address indexed operator,
        OperatorType operatorType,
        string endpoint,
        uint256 stake
    );
    event OperatorMetricsUpdated(
        address indexed operator,
        uint256 uptime,
        uint256 throughput
    );
    event FeesDeposited(address indexed token, uint256 amount, uint256 epoch);
    event RewardsDistributed(
        uint256 indexed epoch,
        address indexed operator,
        address indexed token,
        uint256 amount
    );
    event OperatorSlashed(address indexed operator, uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the contract
     */
    function initialize(
        address _daemonToken,
        address _initialOwner
    ) public initializer {
        __Ownable_init(_initialOwner);
        __ReentrancyGuard_init();

        daemonToken = _daemonToken;
        currentEpoch = 1;
        epochs[currentEpoch] = Epoch({
            startTime: block.timestamp,
            endTime: block.timestamp + EPOCH_DURATION,
            totalFees: 0,
            distributed: false
        });

        // Default allocations: 40% hubs, 30% PDS, 20% gateways, 10% reserve
        hubAllocation = 4000;      // 40%
        pdsAllocation = 3000;      // 30%
        gatewayAllocation = 2000;  // 20%
    }

    /**
     * @notice Register as a network operator
     */
    function registerOperator(
        OperatorType operatorType,
        string memory endpoint,
        uint256 stakeAmount
    ) external nonReentrant {
        require(operators[msg.sender].registeredAt == 0, "Already registered");

        uint256 minStake = getMinStake(operatorType);
        require(stakeAmount >= minStake, "Insufficient stake");

        // Transfer stake
        IERC20(daemonToken).safeTransferFrom(msg.sender, address(this), stakeAmount);

        operators[msg.sender] = Operator({
            operatorType: operatorType,
            endpoint: endpoint,
            stake: stakeAmount,
            registeredAt: block.timestamp,
            active: true,
            totalRewards: 0
        });

        emit OperatorRegistered(msg.sender, operatorType, endpoint, stakeAmount);
    }

    /**
     * @notice Deposit fees from Daemon Protocol
     */
    function depositFees(address token, uint256 amount) external {
        require(amount > 0, "No fees");

        // Transfer tokens
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // Add to current epoch
        epochs[currentEpoch].totalFees += amount;

        emit FeesDeposited(token, amount, currentEpoch);
    }

    /**
     * @notice Update operator metrics (called by backend service)
     */
    function updateOperatorMetrics(
        address operator,
        OperatorMetrics memory metrics
    ) external onlyOwner {
        require(operators[operator].active, "Operator not active");

        operatorMetrics[operator] = metrics;

        emit OperatorMetricsUpdated(
            operator,
            metrics.uptime,
            metrics.messageThroughput
        );
    }

    /**
     * @notice Distribute rewards for an epoch
     */
    function distributeRewards(uint256 epoch, address token) external onlyOwner nonReentrant {
        require(epoch <= currentEpoch, "Invalid epoch");
        require(!epochs[epoch].distributed, "Already distributed");

        Epoch storage epochData = epochs[epoch];
        require(block.timestamp >= epochData.endTime, "Epoch not ended");

        uint256 totalFees = epochData.totalFees;
        if (totalFees == 0) {
            epochs[epoch].distributed = true;
            return;
        }

        // Distribute to each operator type
        _distributeToOperators(epoch, token, OperatorType.HUB, hubAllocation, totalFees);
        _distributeToOperators(epoch, token, OperatorType.PDS, pdsAllocation, totalFees);
        _distributeToOperators(epoch, token, OperatorType.GATEWAY, gatewayAllocation, totalFees);

        epochs[epoch].distributed = true;
    }

    /**
     * @notice Claim rewards for an operator
     */
    function claimRewards(address token) external nonReentrant {
        uint256 amount = operatorRewards[token][msg.sender];
        require(amount > 0, "No rewards");

        operatorRewards[token][msg.sender] = 0;
        operators[msg.sender].totalRewards += amount;

        IERC20(token).safeTransfer(msg.sender, amount);

        emit RewardsDistributed(0, msg.sender, token, amount);
    }

    /**
     * @notice Slash operator for misbehavior
     */
    function slashOperator(address operator, uint256 amount) external onlyOwner {
        require(operators[operator].stake >= amount, "Insufficient stake");

        operators[operator].stake -= amount;

        // Transfer slashed amount to treasury (or burn)
        IERC20(daemonToken).safeTransfer(owner(), amount);

        emit OperatorSlashed(operator, amount);
    }

    /**
     * @notice Advance to next epoch
     */
    function advanceEpoch() external onlyOwner {
        currentEpoch++;
        epochs[currentEpoch] = Epoch({
            startTime: block.timestamp,
            endTime: block.timestamp + EPOCH_DURATION,
            totalFees: 0,
            distributed: false
        });
    }

    // Internal functions

    function _distributeToOperators(
        uint256 epoch,
        address token,
        OperatorType operatorType,
        uint256 allocationBps,
        uint256 totalFees
    ) internal {
        uint256 poolRewards = (totalFees * allocationBps) / 10000;
        if (poolRewards == 0) return;

        // Calculate total score for this operator type
        uint256 totalScore = 0;
        address[] memory operatorList = _getOperatorsByType(operatorType);

        for (uint256 i = 0; i < operatorList.length; i++) {
            address operator = operatorList[i];
            if (operators[operator].active) {
                totalScore += _calculateOperatorScore(operator);
            }
        }

        if (totalScore == 0) return;

        // Distribute based on scores
        for (uint256 i = 0; i < operatorList.length; i++) {
            address operator = operatorList[i];
            if (!operators[operator].active) continue;

            uint256 operatorScore = _calculateOperatorScore(operator);
            uint256 operatorReward = (poolRewards * operatorScore) / totalScore;

            if (operatorReward > 0) {
                operatorRewards[token][operator] += operatorReward;
                emit RewardsDistributed(epoch, operator, token, operatorReward);
            }
        }
    }

    function _calculateOperatorScore(address operator) internal view returns (uint256) {
        OperatorMetrics memory metrics = operatorMetrics[operator];
        Operator memory op = operators[operator];

        // Require minimum uptime
        if (metrics.uptime < MIN_UPTIME) {
            return 0;
        }

        // Score = (uptime * 0.4 + throughput * 0.4 + stake * 0.2) * 10000
        uint256 uptimeScore = metrics.uptime * 4000; // 40% weight
        uint256 throughputScore = _normalizeThroughput(operator, metrics) * 4000; // 40% weight
        uint256 stakeScore = _normalizeStake(operator, op.stake) * 2000; // 20% weight

        return (uptimeScore + throughputScore + stakeScore) / 10000;
    }

    function _normalizeThroughput(address operator, OperatorMetrics memory metrics) internal pure returns (uint256) {
        // Normalize throughput (simplified - would need network averages)
        // For now, return uptime as proxy
        return metrics.uptime;
    }

    function _normalizeStake(address operator, uint256 stake) internal view returns (uint256) {
        // Normalize stake (0-10000)
        uint256 minStake = getMinStake(operators[operator].operatorType);
        if (stake <= minStake) return 5000; // 50% for minimum stake
        if (stake >= minStake * 10) return 10000; // 100% for 10x minimum

        return 5000 + ((stake - minStake) * 5000) / (minStake * 9);
    }

    function _getOperatorsByType(OperatorType operatorType) internal view returns (address[] memory) {
        // In production, would maintain a list
        // For now, return empty (would need to track operators)
        return new address[](0);
    }

    // View functions

    function getMinStake(OperatorType operatorType) public pure returns (uint256) {
        if (operatorType == OperatorType.HUB) return MIN_STAKE_HUB;
        if (operatorType == OperatorType.PDS) return MIN_STAKE_PDS;
        if (operatorType == OperatorType.GATEWAY) return MIN_STAKE_GATEWAY;
        revert("Invalid operator type");
    }

    function getOperatorRewards(address operator, address token) external view returns (uint256) {
        return operatorRewards[token][operator];
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}

