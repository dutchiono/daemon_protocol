# Daemon Protocol - Deployment Checklist

**PRIVATE DOCUMENTATION - DO NOT COMMIT TO PUBLIC REPOSITORY**

**See [DEPLOYMENT.md](../DEPLOYMENT.md) for complete deployment guide.**

This checklist is a quick reference - refer to the full deployment guide for detailed instructions.

## Pre-Deployment Checks

### Environment Setup
- [ ] Node.js 18+ installed
- [ ] Hardhat and dependencies installed (`npm install` in contracts directory)
- [ ] Uniswap V4 dependencies installed
- [ ] `.env` file configured with:
  - [ ] `BOT_WALLET_PRIVATE_KEY` (deployer and bot wallet - same wallet)
  - [ ] `BOT_WALLET_ADDRESS` (wallet address for bot operations)
  - [ ] `BASE_SEPOLIA_RPC_URL` (or use default)
  - [ ] `POOL_MANAGER_ADDRESS` (Uniswap V4 PoolManager)
  - [ ] `DAEMON_TOKEN_ADDRESS` (the base token that all other tokens pair with)
  - [ ] `WETH_ADDRESS` (default: 0x4200000000000000000000000000000000000006)
  - [ ] `VAULT_ADDRESS` (for FeeLocker, can be deployer)
  - [ ] `BOOTSTRAP_ADDRESS` (for FeeLocker, can be deployer)
  - [ ] `TEAM_FEE_RECIPIENT` (can be deployer)

### Wallet Verification
- [ ] Bot wallet (BOT_WALLET_PRIVATE_KEY) has sufficient Base Sepolia ETH
- [ ] Private key is correct and accessible
- [ ] Wallet address (BOT_WALLET_ADDRESS) matches the private key

### Contract Verification
- [ ] All contracts compile successfully (`npx hardhat compile`)
- [ ] All tests pass (`npm test`)
- [ ] No linter errors

### Network Verification
- [ ] Base Sepolia RPC endpoint is accessible
- [ ] Network connection is stable
- [ ] Gas prices are reasonable

## Deployment Order

Deploy contracts in this exact order:

0. [ ] **DAEMON Token with TGE** (no dependencies - deploy first)
   ```bash
   # Option A: Deploy via factory with TGE enabled (recommended)
   cd backend
   npm run test:launch

   # Option B: Deploy manually
   cd contracts
   npx hardhat run scripts/deploy-daemon-token.ts --network base-sepolia
   ```
   - **IMPORTANT**: DAEMON token launches via TGE (Token Generation Event)
   - TGE Target: 66.6 ETH from ~350 contributors (~0.19 ETH each)
   - This ETH creates DAEMON/ETH pool with initial liquidity
   - All future tokens pair with DAEMON (not ETH)
   - Save address to `DAEMON_TOKEN_ADDRESS` environment variable
   - Update `deployments/base-sepolia.json`
   - See [TGE Testing Guide](../TGE_TESTING.md) for simulation instructions

0. [ ] **Uniswap V4 PoolManager** (check if already deployed, or deploy)
   ```bash
   npx hardhat run scripts/deploy-pool-manager.ts --network base-sepolia
   ```
   - Check if Uniswap V4 is already deployed on Base Sepolia first
   - If using existing, document address in `docs/private/NETWORKS.md`
   - Save address to `POOL_MANAGER_ADDRESS` environment variable

1. [ ] **ContributionRegistry** (no dependencies)
   ```bash
   npx hardhat run scripts/deploy-contribution-registry.ts --network base-sepolia
   ```

2. [ ] **BuilderRewardDistributor** (depends on ContributionRegistry)
   ```bash
   npx hardhat run scripts/deploy-builder-reward-distributor.ts --network base-sepolia
   ```

3. [ ] **DaemonFeeLocker** (no dependencies, but needs vault/bootstrap)
   ```bash
   npx hardhat run scripts/deploy-fee-locker.ts --network base-sepolia
   ```

4. [ ] **DaemonLpLocker** (depends on DaemonFeeLocker)
   ```bash
   npx hardhat run scripts/deploy-lp-locker.ts --network base-sepolia
   ```

5. [ ] **DaemonPoolExtensionAllowlist** (no dependencies)
   ```bash
   npx hardhat run scripts/deploy-pool-extension-allowlist.ts --network base-sepolia
   ```

6. [ ] **FeeSplitter** (depends on BuilderRewardDistributor, DaemonFeeLocker)
   ```bash
   npx hardhat run scripts/deploy-fee-splitter.ts --network base-sepolia
   ```

7. [ ] **DaemonHook** (depends on FeeSplitter, BuilderRewardDistributor, DaemonPoolExtensionAllowlist)
   ```bash
   npx hardhat run scripts/deploy-hook.ts --network base-sepolia
   ```

8. [ ] **DaemonFactory** (depends on DaemonHook, DaemonFeeLocker, DaemonLpLocker)
   ```bash
   npx hardhat run scripts/deploy-factory.ts --network base-sepolia
   ```

### Alternative: Deploy All at Once
```bash
npx hardhat run scripts/deploy-all.ts --network base-sepolia
```

## Post-Deployment Verification

### Contract Verification
- [ ] All contracts deployed successfully
- [ ] All addresses saved to `deployments/base-sepolia.json`
- [ ] Verify each contract on Basescan:
  - [ ] ContributionRegistry
  - [ ] BuilderRewardDistributor
  - [ ] DaemonFeeLocker
  - [ ] DaemonLpLocker
  - [ ] DaemonPoolExtensionAllowlist
  - [ ] FeeSplitter
  - [ ] DaemonHook
  - [ ] DaemonFactory

### Contract Verification on Basescan
For each contract, verify source code:
```bash
npx hardhat verify --network base-sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

### Initialization Verification
- [ ] DAEMON Token: Verify token was deployed correctly (check name, symbol, supply)
- [ ] Uniswap V4 PoolManager: Verify address is correct (or document existing address)
- [ ] ContributionRegistry: Owner set correctly
- [ ] BuilderRewardDistributor: Registry and reward token set
- [ ] DaemonFeeLocker: Vault and bootstrap set
- [ ] DaemonLpLocker: Factory updated (after factory deployment)
- [ ] DaemonPoolExtensionAllowlist: Owner set
- [ ] FeeSplitter: Distributor and fee locker set
- [ ] DaemonHook: All addresses set correctly (PoolManager, DAEMON Token, WETH, etc.)
- [ ] DaemonFactory: All addresses set correctly (DAEMON Token, Hook, Bootstrap, FeeLocker, etc.)

### Integration Testing
- [ ] Test token deployment via Factory:
  - [ ] Use improved factory service with collision detection
  - [ ] Verify salt generation works correctly (starts from 0)
  - [ ] Verify token address prediction matches actual deployment
  - [ ] Test collision handling (try deploying same token twice)
  - [ ] Verify token0 ordering (new token should be token0)
- [ ] Test fee collection and splitting (if possible on testnet)
- [ ] Test builder reward distribution (if possible on testnet)
- [ ] Test hook callbacks (if possible on testnet)
- [ ] Test TGE functionality (if enabled for test token)

### Documentation Updates
- [ ] Update `DEPLOYMENT_TRACKING.md` with all addresses
- [ ] Update `NETWORKS.md` with deployment info
- [ ] Update SDK addresses in `sdk/src/contract/address.ts`
- [ ] Document any issues or deviations

## Post-Deployment Configuration

### Fee Locker Configuration
- [ ] Set allowed depositors in DaemonFeeLocker
- [ ] Configure vault address (if different from deployer)

### Factory Configuration
- [ ] Verify base token is set correctly
- [ ] Verify hook address is set correctly
- [ ] Configure team fee recipient

### Hook Configuration
- [ ] Verify all addresses are set correctly
- [ ] Set protocol fee (if needed)

## Security Checklist

- [ ] All contracts verified on Basescan
- [ ] Ownership addresses verified
- [ ] No unauthorized access controls
- [ ] Emergency pause mechanisms tested (if implemented)
- [ ] Upgrade paths tested
- [ ] Multisig setup (if applicable)

## Rollback Plan

If deployment fails:
1. Document the failure point
2. Check `deployments/base-sepolia.json` for partial deployments
3. Fix the issue
4. Redeploy from the failure point (or start over if needed)
5. Update documentation

## Notes

- Keep this checklist updated
- Document any issues or deviations
- DO NOT commit this file to public repositories

