# Testnet Deployment Guide

This guide covers deploying Daemon Protocol on Base Sepolia testnet, including using `daemonETH` (dETH) instead of real WETH for testing.

## Testnet-Specific Considerations

### Why Use daemonETH (dETH)?

On testnet, we may not have enough testnet ETH to:
1. Deploy all contracts
2. Fund the bootstrap TGE
3. Test the full deployment flow

**Solution**: Use `daemonETH` (dETH) as a mock WETH for testnet testing.

### Current Status

✅ **Deployed:**
- `daemonETH` token: `0xf1350D33C6ee456e1Fe61f52Ef628eA34BD3F4b1`

⏳ **Next Steps:**
1. Deploy infrastructure contracts
2. Deploy Factory in bootstrap mode (using dETH as WETH)
3. Deploy DAEMON token via Factory (pairs with dETH)
4. Call `setBaseToken()` to transition to regular mode
5. Test regular token deployment

## Deployment Flow

### Step 1: Deploy Infrastructure Contracts

Deploy in this order (no dependencies on DAEMON token):

```bash
# 1. ContributionRegistry
npx hardhat run scripts/deploy-contribution-registry.ts --network base-sepolia

# 2. BuilderRewardDistributor
npx hardhat run scripts/deploy-builder-reward-distributor.ts --network base-sepolia

# 3. DaemonFeeLocker
npx hardhat run scripts/deploy-fee-locker.ts --network base-sepolia

# 4. DaemonLpLocker
npx hardhat run scripts/deploy-lp-locker.ts --network base-sepolia

# 5. DaemonPoolExtensionAllowlist
npx hardhat run scripts/deploy-pool-extension-allowlist.ts --network base-sepolia

# 6. FeeSplitter
npx hardhat run scripts/deploy-fee-splitter.ts --network base-sepolia

# 7. DaemonHook
npx hardhat run scripts/deploy-hook.ts --network base-sepolia
```

### Step 2: Deploy Factory in Bootstrap Mode

**Important**: Factory will use `daemonETH` as WETH for testnet.

```bash
# Make sure DAEMON_TOKEN_ADDRESS is NOT set (or empty) for bootstrap mode
# The script will automatically use daemonETH as WETH on testnet

npx hardhat run scripts/deploy-factory.ts --network base-sepolia
```

**What happens:**
- Factory deploys with `baseToken = 0x0` (bootstrap mode)
- Factory uses `daemonETH` address as `WETH` parameter
- Factory is ready for DAEMON token deployment

### Step 3: Deploy DAEMON Token via Factory

**Bootstrap Deployment:**
- Call `factory.deployToken()` with:
  - `pairedToken = daemonETH address` (not real WETH)
  - `msg.value = dETH amount` (for initial liquidity)
  - Salt must ensure DAEMON address < daemonETH address

**After deployment:**
- Call `factory.setBaseToken(daemonTokenAddress)`
- Factory transitions to regular mode
- All future tokens pair with DAEMON

### Step 4: Test Regular Token Deployment

Deploy a test token that pairs with DAEMON (not dETH).

## Environment Variables for Testnet

```bash
# Network
NETWORK=base-sepolia

# RPC
ALCHEMY_API_KEY=your_key_here
# Or
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Wallet
BOT_WALLET_PRIVATE_KEY=your_key_here

# Testnet-specific: daemonETH
DAEMON_ETH_TOKEN_ADDRESS=0xf1350D33C6ee456e1Fe61f52Ef628eA34BD3F4b1

# Factory will use daemonETH as WETH automatically on testnet
# Don't set WETH_ADDRESS - let the script auto-detect

# PoolManager (check if Uniswap V4 deployed on Base Sepolia)
TESTNET_POOL_MANAGER_ADDRESS=0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408
```

## Testnet vs Mainnet Differences

| Aspect | Testnet | Mainnet |
|--------|---------|---------|
| WETH for Bootstrap | `daemonETH` (dETH) | Real WETH (`0x4200...0006`) |
| TGE Contributions | dETH tokens | Native ETH |
| Pool Pairing (Bootstrap) | DAEMON/dETH | DAEMON/WETH |
| Pool Pairing (Regular) | NewToken/DAEMON | NewToken/DAEMON |

## Cleanup Before Mainnet

See `TESTNET_CLEANUP.md` for full checklist. Key points:

1. ❌ **Do NOT deploy** `daemonETH` or `TGEWrapper` to mainnet
2. ✅ **Use real WETH** (`0x4200000000000000000000000000000000000006`) for mainnet
3. ✅ **Remove** `DAEMON_ETH_TOKEN_ADDRESS` from `.env`
4. ✅ **Update** `NETWORK=mainnet` in `.env`
5. ✅ **Verify** all testnet-only code is removed

## Notes

- `daemonETH` is only for testnet testing
- Factory contract doesn't change - we just pass dETH address as WETH parameter
- On mainnet, use real WETH and native ETH for TGE
- Bootstrap address must be secure (has special permissions)

