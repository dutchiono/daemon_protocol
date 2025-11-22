# What Blockchain Things Are Needed

## Required: Identity Registry Contract

**One contract on Optimism (or Base):**

### `IdentityRegistry.sol`
- Maps `wallet address → FID`
- Allows users to register FID
- Stores signing keys for message verification

**That's it!** Just identity. Everything else is off-chain.

## Deployment Steps

### 1. Deploy to Base Sepolia (Testing)
```bash
cd contracts

# Install dependencies
npm install

# Set your private key (get testnet ETH first!)
export PRIVATE_KEY=your_private_key_here
export RPC_URL=https://sepolia.base.org

# Compile contract
npx hardhat compile

# Deploy to Base Sepolia (recommended - explicit)
npx hardhat run scripts/deploy-identity-registry-base.ts --network base-sepolia

# Or use npm script (more specific name)
npm run deploy:identity-registry:base-sepolia
```

**Get Base Sepolia ETH:**
- Faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- Explorer: https://sepolia.basescan.org

### 2. Contract Address Saved Automatically
The deployment script automatically saves to `.env`:
```
IDENTITY_REGISTRY_ADDRESS=0x...
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

### 3. Update Hub to Use Contract
```typescript
// In hub/src/message-validator.ts
const identityRegistry = new ethers.Contract(
  process.env.IDENTITY_REGISTRY_ADDRESS!,
  IdentityRegistryABI,
  provider
);

async function verifyFid(fid: number): Promise<boolean> {
  return await identityRegistry.fidExists(fid);
}
```

### 4. Update PDS for Wallet Signup
```typescript
// In pds/src/pds-service.ts
async function createAccountWithWallet(walletAddress: string) {
  const fid = await identityRegistry.fidOf(walletAddress);
  if (fid === 0) {
    throw new Error('FID not registered');
  }
  // Create account with FID...
}
```

## What You DON'T Need

- ❌ No token contracts
- ❌ No fee contracts (for basic functionality)
- ❌ No governance contracts
- ❌ No staking contracts

**Just the Identity Registry!**

## Testing Without Blockchain

You can test everything with **placeholder FIDs**:
- Use address hash as FID
- Skip on-chain verification
- Everything works the same!

Then add blockchain later for production.

## Summary

**Required:**
- Identity Registry contract (one contract)

**Optional (for production):**
- Fee distribution contracts (for funding nodes)
- But basic social network works without them!

**The network works NOW - blockchain is just for identity!**

