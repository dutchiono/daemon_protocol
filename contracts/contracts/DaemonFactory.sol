// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "./IDaemonHook.sol";

/**
 * @title DaemonFactory
 * @notice Factory contract for deploying tokens with deterministic addresses and TGE bootstrapping
 * @dev Uses CREATE2 to ensure token ordering:
 *      - DAEMON token address must be < WETH address (so DAEMON is token0 in DAEMON/ETH pool)
 *      - All new tokens must have addresses < DAEMON address (so new tokens are token0 in NewToken/DAEMON pools)
 *
 * TGE (Token Generation Event) bootstrapping is handled here, not in the hook
 * Based on FEY Factory patterns but with TGE functionality
 */
contract DaemonFactory is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    // Base token (DAEMON) - all other tokens pair with this
    // Note: This is the DAEMON token. Called "baseToken" because it's the base pairing token.
    address public baseToken;

    // Bootstrap address - has special permissions during TGE
    address public bootstrap;

    // Hook address
    address public hook;

    // Fee locker for staker rewards
    address public feeLocker;

    // Team fee recipient
    address public teamFeeRecipient;

    // WETH address (for bootstrap deployment - DAEMON pairs with WETH)
    address public WETH;

    // TGE configuration per token
    struct TGEConfig {
        bool enabled;
        uint256 startTime;
        uint256 endTime;
        uint256 minContribution;
        uint256 maxContribution;
        bool completed;
    }

    mapping(address => TGEConfig) public tokenTGEConfig; // token => TGE config
    mapping(address => mapping(address => uint256)) public tgeContributions; // token => contributor => amount
    mapping(address => uint256) public tgeTotalContributed; // token => total

    // Token deployment tracking
    mapping(address => bool) public deployedTokens; // token => is deployed
    mapping(bytes32 => address) public saltToToken; // factorySalt => token address

    // Events
    event BootstrapUpdated(address indexed oldBootstrap, address indexed newBootstrap);
    event BaseTokenUpdated(address indexed oldBaseToken, address indexed newBaseToken);
    event HookUpdated(address indexed oldHook, address indexed newHook);
    event TGEStarted(address indexed token, uint256 startTime, uint256 endTime);
    event TGECompleted(address indexed token, uint256 totalContributed);
    event TGEContribution(address indexed token, address indexed contributor, uint256 amount);
    event TokenCreated(
        address indexed token,
        address indexed admin,
        address indexed creator,
        address pairedToken,
        int24 tickIfToken0IsFey
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize factory
     */
    function initialize(
        address _baseToken,
        address _hook,
        address _bootstrap,
        address _feeLocker,
        address _teamFeeRecipient,
        address _weth,
        address _owner
    ) public initializer {
        __Ownable_init(_owner);
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        require(_hook != address(0), "Invalid hook");
        require(_bootstrap != address(0), "Invalid bootstrap");
        require(_feeLocker != address(0), "Invalid fee locker");
        require(_weth != address(0), "Invalid WETH");

        // baseToken can be address(0) initially (for bootstrap deployment)
        baseToken = _baseToken;
        hook = _hook;
        bootstrap = _bootstrap;
        feeLocker = _feeLocker;
        teamFeeRecipient = _teamFeeRecipient;
        WETH = _weth;
    }

    /**
     * @notice Authorize upgrade (UUPS pattern)
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @notice Deploy a new token using CREATE2
     * @dev Matches Fey Factory pattern:
     *      - When baseToken == address(0): Bootstrap deployment (only owner/bootstrap, must pair with WETH)
     *      - When baseToken != address(0): Regular deployment (must pair with baseToken)
     *      - Function is payable to accept ETH for initial liquidity/extensions
     *
     *      Salt Generation Requirements:
     *      - Salt should start from 0 (0x0) to match production patterns
     *      - For bootstrap: Token address must be < WETH address (DAEMON/WETH pool)
     *      - For regular: Token address must be < baseToken address (NewToken/DAEMON pool)
     *
     * @param salt Factory salt (computed as keccak256(abi.encode(admin, innerSalt))).
     * @param initCode Init code for token deployment (bytecode + encoded constructor args).
     * @param tokenAdmin Token admin address (has special permissions on the token)
     * @param pairedToken Token to pair with (WETH for bootstrap, baseToken for regular)
     * @param tickIfToken0IsFey Starting tick if token0 is FEY (legacy parameter)
     * @param enableTGE Whether to enable Token Generation Event (TGE) for this token
     * @param tgeDuration TGE duration in seconds (only used if enableTGE is true)
     * @return token Deployed token address
     */
    function deployToken(
        bytes32 salt,
        bytes calldata initCode,
        address tokenAdmin,
        address pairedToken,
        int24 tickIfToken0IsFey,
        bool enableTGE,
        uint256 tgeDuration
    ) external payable nonReentrant returns (address token) {
        // Check if this is bootstrap deployment (baseToken not set yet)
        bool isBootstrap = (baseToken == address(0));

        if (isBootstrap) {
            // Bootstrap deployment: only owner or bootstrap can deploy
            require(msg.sender == owner() || msg.sender == bootstrap, "Only owner or bootstrap");
            // Must pair with WETH for bootstrap
            require(pairedToken == WETH, "Bootstrap must pair with WETH");
        } else {
            // Regular deployment: baseToken must be set
            require(baseToken != address(0), "BaseToken not set");
            // Must pair with baseToken for regular deployments
            require(pairedToken == baseToken, "Must pair with baseToken");
        }

        // Verify salt hasn't been used
        require(saltToToken[salt] == address(0), "Salt already used");

        // Deploy token using CREATE2
        // Convert calldata bytes to memory for CREATE2
        bytes memory initCodeMem = initCode;
        assembly {
            token := create2(0, add(initCodeMem, 0x20), mload(initCodeMem), salt)
        }
        require(token != address(0), "Token deployment failed");

        // Verify token address ordering
        if (isBootstrap) {
            // For bootstrap: token address must be < WETH address (DAEMON/WETH pool)
            require(uint160(token) < uint160(WETH), "Token address must be < WETH");
        } else {
            // For regular: token address must be < baseToken address (NewToken/DAEMON pool)
            require(uint160(token) < uint160(baseToken), "Token address must be < baseToken");
        }

        // Record deployment
        deployedTokens[token] = true;
        saltToToken[salt] = token;

        // Initialize pool via hook (matching Fey pattern)
        // This must be called after token deployment but before TGE
        require(hook != address(0), "Hook not set");

        // Encode poolData: (uint24 feyFee, uint24 pairedFee, address tokenAdmin)
        // Using default fees for now - these should come from parameters
        uint24 defaultFee = 3000; // 0.3% default fee
        bytes memory poolData = abi.encode(defaultFee, defaultFee, tokenAdmin);

        // Call hook's initializePool (matching Fey's pattern)
        IDaemonHook(hook).initializePool(
            token,
            pairedToken,
            tickIfToken0IsFey,
            60, // Default tick spacing
            address(0), // Locker - will be set later
            address(0), // MEV module - optional
            poolData
        );

        // If TGE enabled, configure TGE
        if (enableTGE) {
            tokenTGEConfig[token] = TGEConfig({
                enabled: true,
                startTime: block.timestamp,
                endTime: block.timestamp + tgeDuration,
                minContribution: 0,
                maxContribution: type(uint256).max,
                completed: false
            });
            emit TGEStarted(token, block.timestamp, block.timestamp + tgeDuration);
        }

        emit TokenCreated(token, tokenAdmin, msg.sender, pairedToken, tickIfToken0IsFey);
        return token;
    }

    /**
     * @notice Predict token address from salt and init code hash
     * @dev Uses CREATE2 formula: keccak256(0xff || factory || salt || keccak256(initCode))[12:]
     */
    function predictTokenAddress(
        bytes32 salt,
        bytes32 initCodeHash
    ) external view returns (address) {
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                salt,
                initCodeHash
            )
        );
        return address(uint160(uint256(hash)));
    }

    /**
     * @notice Contribute to TGE for a token
     */
    function contributeToTGE(address token) external payable nonReentrant {
        TGEConfig storage config = tokenTGEConfig[token];
        require(config.enabled, "TGE not enabled");
        require(!config.completed, "TGE completed");
        require(block.timestamp >= config.startTime, "TGE not started");
        require(block.timestamp <= config.endTime, "TGE ended");
        require(msg.value >= config.minContribution, "Below min contribution");
        require(msg.value <= config.maxContribution, "Above max contribution");

        tgeContributions[token][msg.sender] += msg.value;
        tgeTotalContributed[token] += msg.value;

        emit TGEContribution(token, msg.sender, msg.value);
    }

    /**
     * @notice Complete TGE for a token (bootstrap or owner only)
     */
    function completeTGE(address token) external {
        TGEConfig storage config = tokenTGEConfig[token];
        require(config.enabled, "TGE not enabled");
        require(!config.completed, "TGE already completed");
        require(
            msg.sender == bootstrap || msg.sender == owner(),
            "Only bootstrap or owner"
        );
        require(
            block.timestamp >= config.endTime || msg.sender == owner(),
            "TGE not ended yet"
        );

        config.completed = true;
        emit TGECompleted(token, tgeTotalContributed[token]);
    }

    /**
     * @notice Update bootstrap address (owner only)
     */
    function setBootstrap(address _bootstrap) external onlyOwner {
        require(_bootstrap != address(0), "Invalid address");
        address oldBootstrap = bootstrap;
        bootstrap = _bootstrap;
        emit BootstrapUpdated(oldBootstrap, _bootstrap);
    }

    /**
     * @notice Update base token (owner or bootstrap only, matches Fey pattern)
     * @dev Can only be set once (when transitioning from bootstrap to regular mode)
     */
    function setBaseToken(address _baseToken) external {
        require(msg.sender == owner() || msg.sender == bootstrap, "Only owner or bootstrap");
        require(_baseToken != address(0), "Invalid address");
        // Can only set baseToken once (bootstrap -> regular transition)
        require(baseToken == address(0), "BaseToken already set");
        address oldBaseToken = baseToken;
        baseToken = _baseToken;
        emit BaseTokenUpdated(oldBaseToken, _baseToken);
    }

    /**
     * @notice Update hook address (owner only)
     */
    function setHook(address _hook) external onlyOwner {
        require(_hook != address(0), "Invalid address");
        address oldHook = hook;
        hook = _hook;
        emit HookUpdated(oldHook, _hook);
    }

    /**
     * @notice Check if TGE is active for a token
     */
    function isTGEActive(address token) external view returns (bool) {
        TGEConfig memory config = tokenTGEConfig[token];
        return (
            config.enabled &&
            block.timestamp >= config.startTime &&
            block.timestamp <= config.endTime &&
            !config.completed
        );
    }

    /**
     * @notice Get TGE contribution for a token and contributor
     */
    function getTGEContribution(address token, address contributor) external view returns (uint256) {
        return tgeContributions[token][contributor];
    }

    /**
     * @notice Get total TGE contribution for a token
     */
    function getTGETotalContributed(address token) external view returns (uint256) {
        return tgeTotalContributed[token];
    }

    /**
     * @notice Check if a token address would be token0 when paired with baseToken
     * @dev Returns true if token address < baseToken address
     */
    function wouldBeToken0(address token) external view returns (bool) {
        return uint160(token) < uint160(baseToken);
    }
}
