// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title DaemonFeeLocker
 * @notice Stores and distributes protocol fees to eligible recipients
 * @dev Adapted from FEY Fee Locker, made upgradeable with UUPS pattern
 * Fee Locker Address: 0xf739FC4094F3Df0a1Be08E2925b609F3C3Aa13c6 (FEY mainnet reference)
 */
contract DaemonFeeLocker is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20 for IERC20;

    // Configuration
    address public vault; // Vault address for fee storage
    address public bootstrap; // Bootstrap address for TGE

    // Fee tracking: feeOwner => token => amount
    mapping(address => mapping(address => uint256)) public feesToClaim;
    mapping(address => mapping(address => uint256)) public availableFees;

    // Access control
    mapping(address => bool) public allowedDepositors; // Who can deposit fees

    // Events
    event FeesDeposited(address indexed depositor, address indexed token, uint256 amount);
    event FeesClaimed(address indexed feeOwner, address indexed token, uint256 amount);
    event VaultUpdated(address indexed oldVault, address indexed newVault);
    event BootstrapUpdated(address indexed oldBootstrap, address indexed newBootstrap);
    event DepositorUpdated(address indexed depositor, bool allowed);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the fee locker
     * @param _vault Vault address for fee storage
     * @param _bootstrap Bootstrap address for TGE
     * @param _owner Owner address
     */
    function initialize(
        address _vault,
        address _bootstrap,
        address _owner
    ) public initializer {
        __Ownable_init(_owner);
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        require(_vault != address(0), "Invalid vault");
        require(_bootstrap != address(0), "Invalid bootstrap");

        vault = _vault;
        bootstrap = _bootstrap;
    }

    /**
     * @notice Deposit fees for a fee owner and token
     * @dev Can only be called by allowed depositors
     * @param feeOwner Address that owns the fees
     * @param token Token address
     * @param amount Amount to deposit
     */
    function deposit(
        address feeOwner,
        address token,
        uint256 amount
    ) external nonReentrant {
        require(allowedDepositors[msg.sender], "Not allowed depositor");
        require(feeOwner != address(0), "Invalid fee owner");
        require(token != address(0), "Invalid token");
        require(amount > 0, "Invalid amount");

        // Transfer tokens from depositor
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // Update fee tracking
        feesToClaim[feeOwner][token] += amount;
        availableFees[feeOwner][token] += amount;

        emit FeesDeposited(msg.sender, token, amount);
    }

    /**
     * @notice Claim fees for a fee owner and token
     * @param feeOwner Address that owns the fees
     * @param token Token address
     */
    function claim(address feeOwner, address token) external nonReentrant {
        require(feeOwner != address(0), "Invalid fee owner");
        require(token != address(0), "Invalid token");

        uint256 amount = availableFees[feeOwner][token];
        require(amount > 0, "No fees available");

        // Reset available fees
        availableFees[feeOwner][token] = 0;

        // Transfer to fee owner
        IERC20(token).safeTransfer(feeOwner, amount);

        emit FeesClaimed(feeOwner, token, amount);
    }

    /**
     * @notice Set vault address
     * @param _vault New vault address
     */
    function setVault(address _vault) external onlyOwner {
        require(_vault != address(0), "Invalid vault");
        address oldVault = vault;
        vault = _vault;
        emit VaultUpdated(oldVault, _vault);
    }

    /**
     * @notice Set bootstrap address
     * @param _bootstrap New bootstrap address
     */
    function setBootstrap(address _bootstrap) external onlyOwner {
        require(_bootstrap != address(0), "Invalid bootstrap");
        address oldBootstrap = bootstrap;
        bootstrap = _bootstrap;
        emit BootstrapUpdated(oldBootstrap, _bootstrap);
    }

    /**
     * @notice Set allowed depositor
     * @param depositor Depositor address
     * @param allowed Whether depositor is allowed
     */
    function setAllowedDepositor(address depositor, bool allowed) external onlyOwner {
        allowedDepositors[depositor] = allowed;
        emit DepositorUpdated(depositor, allowed);
    }

    /**
     * @notice Authorize upgrade (UUPS)
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}

