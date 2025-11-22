# How Contract Deployment Works

## Each Script Deploys ONE Contract

**Important:** Each deployment script deploys **only one specific contract**.

### How It Works

1. **Script specifies the contract:**
   ```typescript
   // deploy-identity-registry-base.ts
   const artifactsPath = path.join(__dirname, '../artifacts/contracts/social/IdentityRegistry.sol/IdentityRegistry.json');
   ```
   This reads **only** the IdentityRegistry artifact.

2. **Deploys that one contract:**
   ```typescript
   const factory = new ethers.ContractFactory(contractArtifact.abi, contractArtifact.bytecode, wallet);
   const contract = await factory.deploy();
   ```

3. **Result:** Only IdentityRegistry is deployed.

## Your Contracts

You have **two types** of contracts:

### 1. Daemon Protocol Contracts (Already Deployed?)
- `DaemonFactory.sol`
- `DaemonHook.sol`
- `DaemonFeeLocker.sol`
- `FeeSplitter.sol`
- etc.

**These have their own deployment scripts:**
- `deploy-factory.ts`
- `deploy-hook.ts`
- `deploy-fee-splitter.ts`
- etc.

### 2. Social Network Contracts (New!)
- `IdentityRegistry.sol` ← **This is what we're deploying**
- `SocialNetworkFund.sol` (optional, for fee distribution)

**Deployment scripts:**
- `deploy-identity-registry-base.ts` ← **This one**
- `deploy-social-network-fund.ts` (optional)

## Why Only One?

**Each contract is independent:**
- IdentityRegistry doesn't need other contracts
- It's a standalone identity system
- Other contracts (Daemon Protocol) are separate

## Deploy All Contracts?

If you want to deploy multiple contracts, you can:

1. **Run scripts individually (recommended - explicit):**
   ```bash
   npx hardhat run scripts/deploy-identity-registry-base.ts --network base-sepolia
   npx hardhat run scripts/deploy-social-network-fund.ts --network base-sepolia
   ```

   **Or use npm scripts:**
   ```bash
   npm run deploy:identity-registry:base-sepolia
   ```

2. **Or create a master script** that calls them all (like `deploy-all.ts`)

## Summary

- ✅ `deploy-identity-registry-base.ts` → Deploys **only** IdentityRegistry
- ✅ Other contracts have their own scripts
- ✅ Each script is independent
- ✅ You can deploy them separately or together

**For the social network, you only need IdentityRegistry right now!**

