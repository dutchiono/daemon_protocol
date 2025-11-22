# Daemon Social Network - Smart Contracts

## Identity Registry Contract

Deploy to **Base Sepolia** (testnet) for testing.

## Quick Deploy

### 1. Setup
```bash
cd contracts
npm install
```

### 2. Configure
Create `.env` file:
```bash
PRIVATE_KEY=your_private_key_here
RPC_URL=https://sepolia.base.org
```

### 3. Get Testnet ETH
- Faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- You need ETH to pay gas fees

### 4. Deploy
```bash
# Compile
npx hardhat compile

# Deploy to Base Sepolia (specific script name)
npm run deploy:identity-registry:base-sepolia

# Or use hardhat directly (more explicit)
npx hardhat run scripts/deploy-identity-registry-base.ts --network base-sepolia
```

### 5. Verify (Optional)
```bash
npx hardhat verify --network base-sepolia <CONTRACT_ADDRESS>
```

## Contract Address

After deployment, the address is saved to `.env`:
```
IDENTITY_REGISTRY_ADDRESS=0x...
```

Use this address in:
- Hub configuration (for FID verification)
- PDS configuration (for wallet signup)
- Client configuration (for FID lookup)

## Networks

- **Base Sepolia** (Testnet): Chain ID 84532
- **Base Mainnet** (Production): Chain ID 8453

## What It Does

- Maps wallet address → FID
- Stores Ed25519 signing keys
- Allows FID registration
- Verifies FID ownership

**That's it!** Just identity. Everything else is off-chain.
