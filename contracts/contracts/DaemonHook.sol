// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {SwapParams, ModifyLiquidityParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "../rewards/FeeSplitter.sol";
import "../rewards/IBuilderRewardDistributor.sol";
import "./IDaemonHook.sol";

/**
 * @title DaemonHook
 * @notice Upgradeable Uniswap V4 hook matching Fey's pattern - implements IHooks directly
 * @dev Based on FEY hook patterns, implements IHooks directly (not BaseHook)
 */
contract DaemonHook is
    IHooks,
    IDaemonHook,
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using PoolIdLibrary for PoolKey;

    // Constants
    uint24 public constant MAX_LP_FEE = 3000; // 0.3% max LP fee
    uint24 public constant MAX_MEV_LP_FEE = 5000; // 0.5% max MEV LP fee
    uint256 public constant MAX_MEV_MODULE_DELAY = 300; // 5 minutes max delay
    uint256 public constant PROTOCOL_FEE_NUMERATOR = 1e6; // Protocol fee calculation

    // Core addresses
    IPoolManager public poolManager;
    address public factory; // Factory address (only factory can call initializePool)
    address public baseToken; // DAEMON token address
    address public weth; // WETH address
    address public poolExtensionAllowlist; // Extension allowlist contract
    address public builderRewardDistributor; // Builder reward distributor (5% cut)
    address public feeSplitter; // Fee splitter for remaining 95%
    address public socialNetworkFund; // Social Network Fund (portion of fees)

    // Protocol fee (can be updated by owner)
    uint24 public protocolFee;

    // Pool configuration storage (using struct from interface)
    mapping(PoolId => IDaemonHook.PoolConfig) internal poolConfigs;
    mapping(PoolId => address) public poolTokenAdmin; // poolId => tokenAdmin (for quick lookup)

    // Errors (matching Fey pattern)
    error ETHPoolNotAllowed();
    error OnlyFactory();
    error UnsupportedInitializePath();
    error PastCreationTimestamp();
    error MevModuleEnabled();
    error BaseTokenCannotBeFey();
    error BaseTokenNotSet();
    error NotPoolManager();

    // Events
    event PoolCreatedFactory(
        address indexed pairedToken,
        address indexed fey,
        PoolId poolId,
        int24 tickIfToken0IsFey,
        int24 tickSpacing,
        address locker,
        address mevModule
    );
    event PoolInitialized(PoolId indexed poolId, address indexed tokenAdmin, address locker);
    event BuilderRewardDistributorUpdated(address indexed newDistributor);
    event FeeSplitterUpdated(address indexed newSplitter);
    event SocialNetworkFundUpdated(address indexed newFund);
    event ProtocolFeeUpdated(uint24 newFee);
    event BuilderRewardCollected(PoolId indexed poolId, uint256 amount);
    event SocialNetworkFeeCollected(PoolId indexed poolId, uint256 amount);
    event MevModuleDisabled(PoolId poolId);
    event ClaimProtocolFees(address indexed token, uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the hook (replaces constructor for upgradeable contracts)
     */
    function initialize(
        IPoolManager _poolManager,
        address _factory,
        address _baseToken,
        address _weth,
        address _poolExtensionAllowlist,
        address _builderRewardDistributor,
        address _feeSplitter,
        address _socialNetworkFund,
        address _owner
    ) public initializer {
        __Ownable_init(_owner);
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        require(address(_poolManager) != address(0), "Invalid pool manager");
        require(_factory != address(0), "Invalid factory");
        require(_weth != address(0), "Invalid WETH");
        require(_builderRewardDistributor != address(0), "Invalid distributor");
        require(_feeSplitter != address(0), "Invalid fee splitter");

        poolManager = _poolManager;
        factory = _factory;
        baseToken = _baseToken; // Can be 0 initially (bootstrap mode)
        weth = _weth;
        poolExtensionAllowlist = _poolExtensionAllowlist;
        builderRewardDistributor = _builderRewardDistributor;
        feeSplitter = _feeSplitter;
        socialNetworkFund = _socialNetworkFund;
        protocolFee = 0; // Default: no protocol fee
    }

    /**
     * @notice Authorize upgrade (UUPS pattern)
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @notice Set factory address (owner only, for bootstrap setup)
     * @dev Called after factory deployment to update from temporary address
     */
    function setFactory(address _factory) external onlyOwner {
        require(_factory != address(0), "Invalid address");
        factory = _factory;
    }

    /**
     * @notice Set base token (called by Factory, matching Fey pattern)
     */
    function setBaseToken(address _baseToken) external {
        require(msg.sender == factory || msg.sender == owner(), "Only factory or owner");
        require(_baseToken != address(0), "Invalid address");
        baseToken = _baseToken;
    }

    /**
     * @notice Initialize pool (called by Factory, matching Fey pattern)
     * @dev This is the main entry point - Factory calls this after token deployment
     */
    function initializePool(
        address fey,
        address pairedToken,
        int24 tickIfToken0IsFey,
        int24 tickSpacing,
        address locker,
        address mevModule,
        bytes calldata poolData
    ) external returns (PoolKey memory poolKey) {
        // Only factory can call this
        if (msg.sender != factory) revert OnlyFactory();

        // Bootstrap check: if baseToken not set, must pair with WETH
        if (baseToken == address(0)) {
            if (pairedToken != weth) revert ETHPoolNotAllowed();
        } else {
            // Regular mode: must pair with baseToken
            if (pairedToken != baseToken) revert BaseTokenNotSet();
        }

        // Determine token ordering (token0 must be < token1)
        address token0;
        address token1;
        bool feyIsToken0;

        if (uint160(fey) < uint160(pairedToken)) {
            token0 = fey;
            token1 = pairedToken;
            feyIsToken0 = true;
        } else {
            token0 = pairedToken;
            token1 = fey;
            feyIsToken0 = false;
        }

        // Build PoolKey
        poolKey = PoolKey(
            Currency.wrap(token0),
            Currency.wrap(token1),
            0, // Fee will be set by hook callbacks
            tickSpacing,
            IHooks(address(this))
        );

        PoolId poolId = poolKey.toId();

        // Decode poolData to get fees and tokenAdmin
        // Format: (uint24 feyFee, uint24 pairedFee, address tokenAdmin)
        (uint24 feyFeeVal, uint24 pairedFeeVal, address tokenAdmin) =
            abi.decode(poolData, (uint24, uint24, address));

        require(feyFeeVal <= MAX_LP_FEE, "Fee exceeds max");
        require(pairedFeeVal <= MAX_LP_FEE, "Fee exceeds max");

        // Store pool configuration
        poolConfigs[poolId] = IDaemonHook.PoolConfig({
            feyIsToken0: feyIsToken0,
            locker: locker,
            mevModule: mevModule,
            mevModuleEnabled: mevModule != address(0),
            feyFee: feyFeeVal,
            pairedFee: pairedFeeVal,
            poolExtension: address(0),
            poolExtensionSetup: false,
            poolCreationTimestamp: block.timestamp,
            tokenAdmin: tokenAdmin
        });

        poolTokenAdmin[poolId] = tokenAdmin;

        // Initialize the pool on PoolManager
        // Note: We've already stored the config above, so afterInitialize can read from storage
        // The poolData passed to this function is for our own use, not passed to Uniswap's initialize
        poolManager.initialize(poolKey, uint160(1 << 96)); // sqrtPriceX96 = 1 << 96 (1.0)

        emit PoolCreatedFactory(
            pairedToken,
            fey,
            poolId,
            tickIfToken0IsFey,
            tickSpacing,
            locker,
            mevModule
        );
    }

    /**
     * @notice After pool initialization - called by PoolManager
     * @dev This is called by PoolManager after initialize() is called
     */
    function afterInitialize(
        address sender,
        PoolKey calldata key,
        uint160 sqrtPriceX96,
        int24 tick
    ) external returns (bytes4) {
        // Only PoolManager can call this
        if (msg.sender != address(poolManager)) revert NotPoolManager();

        PoolId poolId = key.toId();

        // Verify pool was configured
        require(poolConfigs[poolId].poolCreationTimestamp > 0, "Pool not configured");

        IDaemonHook.PoolConfig storage config = poolConfigs[poolId];
        emit PoolInitialized(poolId, config.tokenAdmin, config.locker);
        return this.afterInitialize.selector;
    }

    /**
     * @notice Before swap - MEV protection and dynamic fees
     */
    function beforeSwap(
        address,
        PoolKey calldata key,
        SwapParams calldata,
        bytes calldata
    ) external returns (bytes4, BeforeSwapDelta, uint24) {
        // Only PoolManager can call this
        if (msg.sender != address(poolManager)) revert NotPoolManager();

        PoolId poolId = key.toId();
        IDaemonHook.PoolConfig storage config = poolConfigs[poolId];

        // MEV protection logic
        if (config.mevModuleEnabled && config.mevModule != address(0)) {
            require(
                block.timestamp >= config.poolCreationTimestamp + 60, // 1 minute cooldown
                "MEV protection: Pool too new"
            );
        }

        // Return fee based on swap direction
        uint24 swapFee = config.feyIsToken0 ? config.feyFee : config.pairedFee;
        return (this.beforeSwap.selector, BeforeSwapDelta.wrap(0), swapFee);
    }

    /**
     * @notice After swap - collect fees and route 5% to builder rewards
     */
    function afterSwap(
        address,
        PoolKey calldata key,
        SwapParams calldata,
        BalanceDelta,
        bytes calldata
    ) external returns (bytes4, int128) {
        // Only PoolManager can call this
        if (msg.sender != address(poolManager)) revert NotPoolManager();

        PoolId poolId = key.toId();
        IDaemonHook.PoolConfig storage config = poolConfigs[poolId];

        // Fee collection happens via fee locker system
        // Builder reward split is handled in FeeSplitter contract

        // Return 0 delta (hook doesn't take or owe currency)
        return (this.afterSwap.selector, 0);
    }

    /**
     * @notice Get token admin for a pool
     */
    function getTokenAdmin(PoolId poolId) external view returns (address) {
        return poolTokenAdmin[poolId];
    }

    /**
     * @notice Get pool configuration
     */
    function getPoolConfig(PoolId poolId) external view override returns (IDaemonHook.PoolConfig memory) {
        return poolConfigs[poolId];
    }

    /**
     * @notice Check if pool exists
     */
    function poolExists(PoolId poolId) external view returns (bool) {
        return poolConfigs[poolId].poolCreationTimestamp > 0;
    }

    /**
     * @notice Get MEV module enabled status
     */
    function mevModuleEnabled(PoolId poolId) external view returns (bool) {
        return poolConfigs[poolId].mevModuleEnabled;
    }

    /**
     * @notice Get pool creation timestamp
     */
    function poolCreationTimestamp(PoolId poolId) external view returns (uint256) {
        return poolConfigs[poolId].poolCreationTimestamp;
    }

    /**
     * @notice ERC165 supportsInterface (matching Fey pattern)
     */
    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == type(IDaemonHook).interfaceId ||
               interfaceId == type(IHooks).interfaceId ||
               interfaceId == 0x01ffc9a7; // ERC165
    }

    /**
     * @notice Update builder reward distributor (owner only)
     */
    function setBuilderRewardDistributor(address _builderRewardDistributor) external onlyOwner {
        require(_builderRewardDistributor != address(0), "Invalid address");
        builderRewardDistributor = _builderRewardDistributor;
        emit BuilderRewardDistributorUpdated(_builderRewardDistributor);
    }

    /**
     * @notice Update fee splitter (owner only)
     */
    function setFeeSplitter(address _feeSplitter) external onlyOwner {
        require(_feeSplitter != address(0), "Invalid address");
        feeSplitter = _feeSplitter;
        emit FeeSplitterUpdated(_feeSplitter);
    }

    /**
     * @notice Update protocol fee (owner only)
     */
    function setProtocolFee(uint24 _protocolFee) external onlyOwner {
        protocolFee = _protocolFee;
        emit ProtocolFeeUpdated(_protocolFee);
    }

    // Unused hook functions (required by IHooks interface)
    function beforeInitialize(address, PoolKey calldata, uint160) external returns (bytes4) {
        revert("Not implemented");
    }

    function beforeAddLiquidity(
        address,
        PoolKey calldata,
        ModifyLiquidityParams calldata,
        bytes calldata
    ) external returns (bytes4) {
        revert("Not implemented");
    }

    function afterAddLiquidity(
        address,
        PoolKey calldata,
        ModifyLiquidityParams calldata,
        BalanceDelta,
        BalanceDelta,
        bytes calldata
    ) external returns (bytes4, BalanceDelta) {
        revert("Not implemented");
    }

    function beforeRemoveLiquidity(
        address,
        PoolKey calldata,
        ModifyLiquidityParams calldata,
        bytes calldata
    ) external returns (bytes4) {
        revert("Not implemented");
    }

    function afterRemoveLiquidity(
        address,
        PoolKey calldata,
        ModifyLiquidityParams calldata,
        BalanceDelta,
        BalanceDelta,
        bytes calldata
    ) external returns (bytes4, BalanceDelta) {
        revert("Not implemented");
    }

    function beforeDonate(
        address,
        PoolKey calldata,
        uint256,
        uint256,
        bytes calldata
    ) external returns (bytes4) {
        revert("Not implemented");
    }

    function afterDonate(
        address,
        PoolKey calldata,
        uint256,
        uint256,
        bytes calldata
    ) external returns (bytes4) {
        revert("Not implemented");
    }
}
