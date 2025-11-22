// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title FeeSplitter
 * @notice Integrates with existing fee locker to implement new split logic
 * @dev Takes 5% for builder rewards, then splits remaining 95% based on token's configured split
 */
contract FeeSplitter is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Constants
    uint256 public constant BUILDER_CUT_BPS = 500; // 5% hard cut
    uint256 public constant SOCIAL_NETWORK_CUT_BPS = 300; // 3% for social network
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant REMAINING_BPS = 9500; // 95% remaining after builder cut

    // Builder reward distributor
    address public builderRewardDistributor;

    // Fee locker (existing FEY fee locker)
    address public feeLocker;

    // Social network fund
    address public socialNetworkFund;

    // Token-specific fee split configuration
    // Maps token address to fee share with stakers (in basis points, 0-10000)
    // Remaining goes to token dev
    mapping(address => uint256) public tokenFeeSplit; // token => staker share BPS

    // Token dev address mapping (set during token deployment or via hook)
    mapping(address => address) public tokenDevAddress; // token => dev address

    // Events
    event FeesSplit(
        address indexed token,
        uint256 totalFees,
        uint256 builderCut,
        uint256 tokenDevShare,
        uint256 stakerShare
    );
    event BuilderRewardsDistributed(address indexed token, uint256 amount);
    event TokenDevRewardsDistributed(address indexed token, address dev, uint256 amount);
    event StakerRewardsDistributed(address indexed token, uint256 amount);
    event BuilderRewardDistributorUpdated(address oldDistributor, address newDistributor);
    event FeeLockerUpdated(address oldLocker, address newLocker);
    event SocialNetworkFundUpdated(address oldFund, address newFund);
    event TokenFeeSplitUpdated(address indexed token, uint256 stakerShareBps);
    event TokenDevAddressUpdated(address indexed token, address devAddress);

    constructor(
        address _builderRewardDistributor,
        address _feeLocker,
        address _socialNetworkFund,
        address _initialOwner
    ) Ownable(_initialOwner) {
        require(_builderRewardDistributor != address(0), "Invalid distributor");
        require(_feeLocker != address(0), "Invalid fee locker");

        builderRewardDistributor = _builderRewardDistributor;
        feeLocker = _feeLocker;
        socialNetworkFund = _socialNetworkFund;
    }

    /**
     * @notice Split fees according to the new distribution model
     * @dev Takes 5% for builders, 3% for social network, then splits remaining 92% based on token config
     * @param token Token address
     * @param totalFees Total fees collected
     */
    function splitFees(address token, uint256 totalFees) external nonReentrant {
        require(totalFees > 0, "No fees");
        require(token != address(0), "Invalid token");

        // Calculate 5% builder cut
        uint256 builderCut = (totalFees * BUILDER_CUT_BPS) / BPS_DENOMINATOR;

        // Calculate 3% social network cut
        uint256 socialNetworkCut = (totalFees * SOCIAL_NETWORK_CUT_BPS) / BPS_DENOMINATOR;

        uint256 remainingFees = totalFees - builderCut - socialNetworkCut;

        // Get token's fee split configuration (staker share in BPS, 0-10000)
        uint256 stakerShareBps = tokenFeeSplit[token];
        uint256 stakerShare = (remainingFees * stakerShareBps) / BPS_DENOMINATOR;
        uint256 tokenDevShare = remainingFees - stakerShare;

        // Transfer builder cut to builder reward distributor
        if (builderCut > 0 && builderRewardDistributor != address(0)) {
            IERC20(token).safeTransfer(builderRewardDistributor, builderCut);
            // Notify distributor of deposit (with token address for split calculation)
            (bool success, ) = builderRewardDistributor.call(
                abi.encodeWithSignature("depositRewards(address,uint256)", token, builderCut)
            );
            require(success, "Deposit failed");
        }

        // Transfer social network cut to social network fund
        if (socialNetworkCut > 0 && socialNetworkFund != address(0)) {
            IERC20(token).safeTransfer(socialNetworkFund, socialNetworkCut);
            // Notify fund of deposit
            (bool success, ) = socialNetworkFund.call(
                abi.encodeWithSignature("depositFees(address,uint256)", token, socialNetworkCut)
            );
            require(success, "Deposit failed");
        }

        // Distribute to token dev (if any)
        if (tokenDevShare > 0) {
            distributeToTokenDev(token, tokenDevShare);
        }

        // Distribute to stakers via fee locker (if any)
        if (stakerShare > 0 && feeLocker != address(0)) {
            distributeToStakers(token, stakerShare);
        }

        emit FeesSplit(token, totalFees, builderCut, tokenDevShare, stakerShare);
    }

    /**
     * @notice Set token dev address (can be called by hook or factory)
     * @param token Token address
     * @param devAddress Developer address
     */
    function setTokenDevAddress(address token, address devAddress) external {
        // Only allow setting if not already set, or allow hook/factory to update
        // In production, this should have proper access control
        require(token != address(0), "Invalid token");
        tokenDevAddress[token] = devAddress;
        emit TokenDevAddressUpdated(token, devAddress);
    }

    /**
     * @notice Distribute fees to token developer
     * @param token Token address
     * @param amount Amount to distribute
     */
    function distributeToTokenDev(address token, uint256 amount) internal {
        address tokenDev = tokenDevAddress[token];
        if (tokenDev != address(0) && amount > 0) {
            IERC20(token).safeTransfer(tokenDev, amount);
            emit TokenDevRewardsDistributed(token, tokenDev, amount);
        } else {
            // If no dev address set, send to fee locker as fallback
            if (amount > 0 && feeLocker != address(0)) {
                IERC20(token).safeTransfer(feeLocker, amount);
                emit StakerRewardsDistributed(token, amount);
            }
        }
    }

    /**
     * @notice Distribute fees to stakers via fee locker
     * @param token Token address
     * @param amount Amount to distribute
     */
    function distributeToStakers(address token, uint256 amount) internal {
        require(feeLocker != address(0), "Fee locker not set");

        // Transfer to fee locker
        // The fee locker contract should handle the distribution to stakers
        IERC20(token).safeTransfer(feeLocker, amount);

        emit StakerRewardsDistributed(token, amount);
    }

    /**
     * @notice Set fee split for a token
     * @dev Only owner can set fee splits
     * @param token Token address
     * @param stakerShareBps Staker share in basis points (0-10000)
     */
    function setTokenFeeSplit(address token, uint256 stakerShareBps) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(stakerShareBps <= BPS_DENOMINATOR, "Invalid BPS");

        tokenFeeSplit[token] = stakerShareBps;
        emit TokenFeeSplitUpdated(token, stakerShareBps);
    }

    /**
     * @notice Batch set fee splits for multiple tokens
     * @dev Only owner can set fee splits
     * @param tokens Array of token addresses
     * @param stakerShareBpsArray Array of staker shares in basis points
     */
    function batchSetTokenFeeSplit(
        address[] calldata tokens,
        uint256[] calldata stakerShareBpsArray
    ) external onlyOwner {
        require(tokens.length == stakerShareBpsArray.length, "Length mismatch");

        for (uint256 i = 0; i < tokens.length; i++) {
            require(tokens[i] != address(0), "Invalid token");
            require(stakerShareBpsArray[i] <= BPS_DENOMINATOR, "Invalid BPS");
            tokenFeeSplit[tokens[i]] = stakerShareBpsArray[i];
            emit TokenFeeSplitUpdated(tokens[i], stakerShareBpsArray[i]);
        }
    }

    /**
     * @notice Update builder reward distributor address
     * @dev Only owner can update
     * @param newDistributor New distributor address
     */
    function setBuilderRewardDistributor(address newDistributor) external onlyOwner {
        require(newDistributor != address(0), "Invalid distributor");
        address oldDistributor = builderRewardDistributor;
        builderRewardDistributor = newDistributor;
        emit BuilderRewardDistributorUpdated(oldDistributor, newDistributor);
    }

    /**
     * @notice Update fee locker address
     * @dev Only owner can update
     * @param newLocker New fee locker address
     */
    function setFeeLocker(address newLocker) external onlyOwner {
        require(newLocker != address(0), "Invalid locker");
        address oldLocker = feeLocker;
        feeLocker = newLocker;
        emit FeeLockerUpdated(oldLocker, newLocker);
    }

    /**
     * @notice Update social network fund address
     * @dev Only owner can update
     * @param newFund New social network fund address
     */
    function setSocialNetworkFund(address newFund) external onlyOwner {
        address oldFund = socialNetworkFund;
        socialNetworkFund = newFund;
        emit SocialNetworkFundUpdated(oldFund, newFund);
    }

    /**
     * @notice Get fee split configuration for a token
     * @param token Token address
     * @return stakerShareBps Staker share in basis points
     * @return tokenDevShareBps Token dev share in basis points (calculated)
     */
    function getTokenFeeSplit(address token)
        external
        view
        returns (uint256 stakerShareBps, uint256 tokenDevShareBps)
    {
        stakerShareBps = tokenFeeSplit[token];
        tokenDevShareBps = BPS_DENOMINATOR - stakerShareBps;
    }
}

