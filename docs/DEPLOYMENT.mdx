# Daemon Protocol - Complete Deployment Guide

This is the **consolidated deployment guide** for Daemon Protocol on Base Sepolia testnet.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Deployment Order](#deployment-order)
4. [Step-by-Step Deployment](#step-by-step-deployment)
5. [DAEMON Token TGE](#daemon-token-tge-token-generation-event) ⭐ **TGE for DAEMON token bootstrap**
6. [Post-Deployment](#post-deployment)
7. [Token Deployment](#token-deployment-future-tokens) (Future tokens that pair with DAEMON)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required
- Node.js 18+
- Hardhat installed
- Uniswap V4 Core dependency (see [Setup Guide](../contracts/SETUP.md))
- Base Sepolia ETH for gas
- Private key with sufficient funds

### Recommended
- Alchemy API key for reliable RPC access
- Git for Uniswap V4 submodule

---

## Environment Setup

### 1. Create `.env` File

Create `.env` in the `daemon` directory:

```bash
# Network Configuration
NETWORK=sepolia
ALCHEMY_API_KEY=your_alchemy_api_key_here

# Wallet (deployer and bot are the same)
BOT_WALLET_PRIVATE_KEY=your_private_key_here
BOT_WALLET_ADDRESS=your_wallet_address_here

# Contract Addresses (set after deployment)
# DAEMON Token address (deploy first)
# Note: In contracts, this is called "baseToken" but it's the DAEMON token
# This is the token that all other tokens pair with
DAEMON_TOKEN_ADDRESS=
POOL_MANAGER_ADDRESS=
WETH_ADDRESS=0x4200000000000000000000000000000000000006

# Deployment Configuration (defaults to deployer if not set)
VAULT_ADDRESS=
BOOTSTRAP_ADDRESS=
TEAM_FEE_RECIPIENT=
```

**See [ENV_SETUP.md](../ENV_SETUP.md) for complete environment variable documentation.**

### 2. Install Dependencies

```bash
# Root dependencies
npm install

# Contract dependencies
cd contracts
npm install

# Install Uniswap V4 (see contracts/SETUP.md)
```

### 3. Compile Contracts

```bash
cd contracts
npx hardhat compile
```

---

## Deployment Order

**CRITICAL**: Deploy contracts in this exact order due to dependencies:

0. **DAEMON Token with TGE** (no dependencies - deploy first)
   - This is launched via TGE (Token Generation Event)
   - People contribute ETH → 66.6 ETH total
   - Creates DAEMON/ETH pool with initial liquidity
   - All future tokens pair with DAEMON (not ETH)

0. **Uniswap V4 PoolManager** (check if already deployed, or deploy)
1. **ContributionRegistry** (no dependencies)
3. **BuilderRewardDistributor** (depends on ContributionRegistry)
4. **DaemonFeeLocker** (no dependencies)
5. **DaemonLpLocker** (depends on DaemonFeeLocker)
6. **DaemonPoolExtensionAllowlist** (no dependencies)
7. **FeeSplitter** (depends on BuilderRewardDistributor, DaemonFeeLocker)
8. **DaemonHook** (depends on FeeSplitter, BuilderRewardDistributor, DaemonPoolExtensionAllowlist, PoolManager)
9. **DaemonFactory** (depends on DaemonHook, DaemonFeeLocker, DaemonLpLocker, DAEMON Token)
10. **Post-deployment**: Update LP Locker with factory address

---

## Step-by-Step Deployment

### Step 0: Deploy DAEMON Token with TGE

**IMPORTANT**: The DAEMON token is launched via TGE (Token Generation Event) - this is how we bootstrap initial liquidity for the DAEMON/ETH pool, just like Fey did.

**TGE Target:**
- ~350 contributors
- ~0.19 ETH each
- 66.6 ETH total
- This ETH goes into DAEMON/ETH pool as initial liquidity

#### Option A: Deploy DAEMON Token (Manual - No TGE Yet)

```bash
cd contracts
npx hardhat run scripts/deploy-daemon-token.ts --network base-sepolia
```

**After deployment:**
- Save address to `DAEMON_TOKEN_ADDRESS` in `.env`
- Update `deployments/base-sepolia.json`
- Update `docs/private/DEPLOYMENT_TRACKING.md`

**Note**: This deploys the token but doesn't enable TGE. You'll need to deploy via Factory with TGE enabled, or enable TGE separately.

#### Option B: Deploy DAEMON Token via Factory with TGE Enabled (Recommended)

Use the factory service to deploy DAEMON token with TGE enabled:

```bash
cd backend
# Set DAEMON_TOKEN_ADDRESS in .env (will be set after deployment)
npm run test:launch
```

Or use the SDK directly to deploy with TGE enabled.

**TGE Configuration:**
- `enableTGE: true`
- `tgeDuration: 7 days` (604800 seconds)
- `minContribution: 0` (no minimum)
- `maxContribution: type(uint256).max` (no maximum)

**After deployment:**
- Save token address to `DAEMON_TOKEN_ADDRESS` in `.env`
- TGE is now active - contributors can contribute ETH
- See [TGE Testing Guide](./TGE_TESTING.md) for simulation instructions

### Step 0: Check/Deploy Uniswap V4 PoolManager

**IMPORTANT**: PoolManager is a singleton - one instance handles all pools.

1. **Check if already deployed**:
   - Check Uniswap documentation for official PoolManager on Base Sepolia
   - If available, use that address

2. **If not available, deploy**:
   ```bash
   cd contracts
   npx hardhat run scripts/deploy-pool-manager.ts --network base-sepolia
   ```

**After deployment:**
- Save address to `POOL_MANAGER_ADDRESS` in `.env`
- Update `docs/private/NETWORKS.md`

### Step 1: Deploy ContributionRegistry

```bash
cd contracts
npx hardhat run scripts/deploy-contribution-registry.ts --network base-sepolia
```

**Save the address** - needed for next step.

### Step 2: Deploy BuilderRewardDistributor

```bash
cd contracts
npx hardhat run scripts/deploy-builder-reward-distributor.ts --network base-sepolia
```

**Requires:**
- ContributionRegistry address (from Step 1)
- Reward token address (WETH: `0x4200000000000000000000000000000000000006`)

### Step 3: Deploy DaemonFeeLocker

```bash
cd contracts
npx hardhat run scripts/deploy-fee-locker.ts --network base-sepolia
```

**Uses:**
- Vault address (defaults to deployer)
- Bootstrap address (defaults to deployer)

### Step 4: Deploy DaemonLpLocker

```bash
cd contracts
npx hardhat run scripts/deploy-lp-locker.ts --network base-sepolia
```

**Requires:**
- DaemonFeeLocker address (from Step 3)
- Factory address will be set after factory deployment (Step 9)

### Step 5: Deploy DaemonPoolExtensionAllowlist

```bash
cd contracts
npx hardhat run scripts/deploy-pool-extension-allowlist.ts --network base-sepolia
```

### Step 6: Deploy FeeSplitter

```bash
cd contracts
npx hardhat run scripts/deploy-fee-splitter.ts --network base-sepolia
```

**Requires:**
- BuilderRewardDistributor address (from Step 2)
- DaemonFeeLocker address (from Step 3)

### Step 7: Deploy DaemonHook

```bash
cd contracts
npx hardhat run scripts/deploy-hook.ts --network base-sepolia
```

**Requires:**
- PoolManager address (from Step 0)
- DAEMON Token address (from Step 0)
- WETH address (`0x4200000000000000000000000000000000000006`)
- PoolExtensionAllowlist address (from Step 5)
- BuilderRewardDistributor address (from Step 2)
- FeeSplitter address (from Step 6)

### Step 8: Deploy DaemonFactory

```bash
cd contracts
npx hardhat run scripts/deploy-factory.ts --network base-sepolia
```

**Requires:**
- DAEMON Token address (from Step 0)
- DaemonHook address (from Step 7)
- Bootstrap address (defaults to deployer)
- DaemonFeeLocker address (from Step 3)
- TeamFeeRecipient address (defaults to deployer)

**After deployment:**
- Factory automatically updates LP Locker with factory address
- Save factory address to SDK: `sdk/src/contract/address.ts`

### Step 9: Update SDK Addresses

Update `sdk/src/contract/address.ts` with all deployed addresses:

```typescript
'base-sepolia': {
    daemonHook: '0x...', // From Step 7
    daemonToken: '0x...', // From Step 0
    daemonFactory: '0x...', // From Step 8
    builderRewardDistributor: '0x...', // From Step 2
    contributionRegistry: '0x...', // From Step 1
    feeSplitter: '0x...', // From Step 6
    weth: '0x4200000000000000000000000000000000000006',
},
```

---

## Post-Deployment

### 1. Verify Contracts

```bash
cd contracts
npx hardhat run scripts/verify-all.ts --network base-sepolia
```

Or verify individually:
```bash
npx hardhat verify --network base-sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

### 2. Update Documentation

- Update `docs/private/DEPLOYMENT_TRACKING.md` with all addresses
- Update `docs/private/NETWORKS.md` with PoolManager address
- Update `sdk/src/contract/address.ts` with Base Sepolia addresses

### 3. Verify Initialization

Check each contract is initialized correctly:
- ContributionRegistry: Owner set
- BuilderRewardDistributor: Registry and reward token set
- DaemonFeeLocker: Vault and bootstrap set
- DaemonLpLocker: Factory updated (after factory deployment)
- DaemonPoolExtensionAllowlist: Owner set
- FeeSplitter: Distributor and fee locker set
- DaemonHook: All addresses set correctly
- DaemonFactory: All addresses set correctly

---

## DAEMON Token TGE (Token Generation Event)

**The DAEMON token launches via TGE** - this is how we bootstrap initial liquidity, just like Fey did.

### TGE Overview

- **Purpose**: Bootstrap initial liquidity for DAEMON/ETH pool
- **Target**: 66.6 ETH total from ~350 contributors (~0.19 ETH each)
- **Reference**: Fey had 35 ETH from 350 contributors (0.1 ETH each)

### Testing TGE on Testnet

Since you can't easily get 66.6 ETH on testnet, you have two options:

#### Option 1: Hardhat Local Network (Recommended for Full Simulation) ⭐

```bash
# Deploy to Hardhat (can mint unlimited ETH)
cd contracts
npx hardhat run scripts/deploy-all.ts --network hardhat

# Deploy DAEMON token with TGE enabled
# Then simulate TGE:
npx hardhat run scripts/simulate-tge.ts --network hardhat
```

**Advantages:**
- ✅ Can mint unlimited ETH
- ✅ Full simulation with 350 contributors
- ✅ No real ETH needed

#### Option 2: Testnet with Test ETH Token

```bash
# Deploy TestETHToken and TGEWrapper
cd contracts
npx hardhat run scripts/deploy-tge-wrapper.ts --network base-sepolia

# Fund wrapper with ETH (from faucet or deployer)
# Then simulate TGE:
npx hardhat run scripts/simulate-tge.ts --network base-sepolia
```

**How it works:**
1. Deploy `TestETHToken` (mintable test token representing ETH)
2. Deploy `TGEWrapper` (converts test token to ETH for TGE)
3. Fund wrapper with real ETH (from faucet)
4. Mint test tokens to 350 contributors
5. Contributors use test tokens, wrapper converts to ETH and contributes

**See [TGE Testing Guide](./TGE_TESTING.md) for complete instructions.**

---

## Token Deployment (Future Tokens)

### Using Factory Service (Recommended)

**Note**: This is for tokens launched AFTER DAEMON token. These tokens pair with DAEMON (not ETH).

The factory service includes:
- ✅ Salt generation starting from 0
- ✅ On-chain collision detection
- ✅ Automatic retry on collision
- ✅ Token artifact loading from Hardhat

**Test deployment:**
```bash
cd backend
npm run test:launch
```

**Production deployment:**
- Use the backend API endpoint: `POST /api/launch`
- Or use the SDK directly (see `docs/SDK.md`)

### Manual Deployment

```typescript
import { deployToken } from '@daemon/sdk';

const result = await deployToken({
  tokenConfig: {
    name: 'My Token',
    symbol: 'TOKEN',
    tokenAdmin: '0x...',
    // ... other config
  },
  // ... pool config, locker config, etc.
});
```

### Track Deployments

**IMPORTANT**: After each token deployment, update:
- `docs/private/TOKEN_TRACKING.md` - Add new token row
- This is the **SINGLE SOURCE OF TRUTH** for token tracking

---

## Troubleshooting

### Out of Gas
- Increase gas limit in deployment scripts
- Check contract size (may need optimization)

### Initialization Failed
- Verify all constructor parameters
- Check contract dependencies are deployed
- Verify addresses are correct

### Salt Collision
- Factory service automatically handles collisions
- If manual deployment, try different context or name/symbol

### Token Address Prediction Mismatch
- Verify token bytecode matches deployed contract
- Check constructor arguments order
- Verify salt generation starts from 0

---

## Network-Specific Notes

### Base Sepolia
- Use Sepolia RPC endpoint
- Get testnet ETH from faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- Test thoroughly before mainnet deployment

### Base Mainnet (Future)
- Use mainnet RPC endpoint
- Ensure sufficient ETH for gas
- Verify all addresses before deployment
- Consider multisig for ownership

---

## Security Checklist

- [ ] All contracts verified on Basescan
- [ ] Ownership addresses verified
- [ ] No unauthorized access controls
- [ ] Emergency pause mechanisms tested (if implemented)
- [ ] Upgrade paths tested
- [ ] Multisig setup (if applicable)

---

## Additional Resources

- **Environment Setup**: [ENV_SETUP.md](../ENV_SETUP.md)
- **Contract Setup**: [contracts/SETUP.md](../contracts/SETUP.md)
- **Deployment Checklist**: [docs/private/DEPLOYMENT_CHECKLIST.md](./private/DEPLOYMENT_CHECKLIST.md)
- **Deployment Tracking**: [docs/private/DEPLOYMENT_TRACKING.md](./private/DEPLOYMENT_TRACKING.md)
- **Token Tracking**: [docs/private/TOKEN_TRACKING.md](./private/TOKEN_TRACKING.md) ⭐ **SINGLE SOURCE OF TRUTH**
- **Salt Generation Lessons**: [docs/SALT_GENERATION_LESSONS.md](./SALT_GENERATION_LESSONS.md)
- **Network Configuration**: [docs/private/NETWORKS.md](./private/NETWORKS.md)

---

## Quick Reference

### Deployment Scripts Location
`daemon/contracts/scripts/`

### Deployment Info Location
`daemon/contracts/deployments/base-sepolia.json`

### Token Tracking Location
`daemon/docs/private/TOKEN_TRACKING.md` ⭐

### Contract Addresses Location
`daemon/sdk/src/contract/address.ts`
