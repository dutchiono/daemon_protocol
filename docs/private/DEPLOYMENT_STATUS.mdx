# Deployment Status - Base Sepolia

**Last Updated**: 2024-12-19
**Deployer**: 0x572feA2B7544B92Ee41e2F256a8393d5807d6a69

## ✅ Successfully Deployed

### 1. ContributionRegistry
- **Address**: `0x64d9FC2A6D21996f75D71491f810068A9d3bA6F1`
- **Tx Hash**: `0xd0e2675eb22b3e9d08fe951c64f0b02b3c61eb1a9d778f3bcf2b7f10376ee648`
- **Block**: 33825410
- **Owner**: `0x572feA2B7544B92Ee41e2F256a8393d5807d6a69`

### 2. BuilderRewardDistributor
- **Address**: `0x3be6b65493E2fF32aE335A2dbBB50a4d0629Dc63`
- **Tx Hash**: `0x2d4e613361ec66f2ab20dfad670511af1b05f2c83c4c6a982f8d12f0be1d0fda`
- **Block**: 33825416
- **ContributionRegistry**: `0x64d9FC2A6D21996f75D71491f810068A9d3bA6F1`
- **RewardToken (WETH)**: `0x4200000000000000000000000000000000000006`
- **Owner**: `0x572feA2B7544B92Ee41e2F256a8393d5807d6a69`

## ⏳ Pending Deployment

### 3. DaemonFeeLocker
- **Status**: RPC Error - "Method not found"
- **Issue**: OpenZeppelin upgrades plugin RPC call failing
- **Action Needed**: Check RPC URL configuration

### 4. DaemonLpLocker
- **Status**: Waiting for DaemonFeeLocker

### 5. DaemonPoolExtensionAllowlist
- **Status**: Ready to deploy (no dependencies)

### 6. FeeSplitter
- **Status**: Waiting for DaemonFeeLocker

### 7. DaemonHook
- **Status**: Blocked by BaseHook.sol compilation issue
- **Action Needed**: Fix Uniswap V4 Core dependency

### 8. DaemonFactory
- **Status**: Waiting for Hook, FeeLocker, LpLocker

## Environment Variables Needed

Add to `daemon/.env`:

```bash
# Already set (from previous deployments)
BOT_WALLET_PRIVATE_KEY=your_key_here
BOT_WALLET_ADDRESS=0x572feA2B7544B92Ee41e2F256a8393d5807d6a69

# RPC (REQUIRED - check if ALCHEMY_API_KEY or BASE_SEPOLIA_RPC_URL is set)
ALCHEMY_API_KEY=your_key_here
# OR
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Optional (will use BOT_WALLET_ADDRESS if not set)
VAULT_ADDRESS=
BOOTSTRAP_ADDRESS=
TEAM_FEE_RECIPIENT=

# PoolManager (REQUIRED for Hook)
TESTNET_POOL_MANAGER_ADDRESS=0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408

# Already deployed
DAEMON_ETH_TOKEN_ADDRESS=0xf1350D33C6ee456e1Fe61f52Ef628eA34BD3F4b1
```

## Current Issues

1. **RPC Error**: "Method not found" when deploying upgradeable contracts
   - May need to check RPC URL or use a different provider
   - OpenZeppelin upgrades plugin requires certain RPC methods

2. **BaseHook.sol**: Not found in @uniswap/v4-core package
   - Blocks DaemonHook deployment
   - Need to resolve Uniswap V4 Core dependency

## Next Steps

1. Fix RPC configuration issue
2. Deploy DaemonFeeLocker
3. Deploy DaemonPoolExtensionAllowlist (no dependencies)
4. Deploy DaemonLpLocker
5. Deploy FeeSplitter
6. Resolve BaseHook issue and deploy DaemonHook
7. Deploy DaemonFactory in bootstrap mode

