# DaemonHook Contract

## Overview

DaemonHook is a Uniswap V4 hook that implements:
- 5% builder reward fee split
- MEV protection
- Pool extensions
- Token admin tracking

## Contract Address

**Base Mainnet**: `0x...` (TODO: Deploy)

## Key Functions

### Pool Initialization

```solidity
function afterInitialize(
    address sender,
    PoolKey calldata key,
    uint160 sqrtPriceX96,
    int24 tick,
    bytes calldata hookData
) external returns (bytes4)
```

Stores pool configuration including token admin address.

### MEV Protection

```solidity
function beforeSwap(
    address sender,
    PoolKey calldata key,
    IPoolManager.SwapParams calldata params,
    bytes calldata hookData
) external returns (bytes4, BeforeSwapDelta, uint24)
```

Enforces cooldown period for new pools to prevent MEV attacks.

### Fee Collection

```solidity
function afterSwap(
    address sender,
    PoolKey calldata key,
    IPoolManager.SwapParams calldata params,
    BalanceDelta delta,
    bytes calldata hookData
) external returns (bytes4, AfterSwapDelta)
```

Routes fees through FeeSplitter for builder reward distribution.

## Configuration

- `baseToken`: DAEMON token address
- `builderRewardDistributor`: Builder reward distributor contract
- `feeSplitter`: Fee splitter contract
- `protocolFee`: Protocol fee rate (uint24)

## Events

- `PoolInitialized(PoolId, address tokenAdmin, address locker)`
- `BuilderRewardDistributorUpdated(address)`
- `ProtocolFeeUpdated(uint24)`

## Usage

See [SDK Documentation](./SDK.md) for integration examples.

