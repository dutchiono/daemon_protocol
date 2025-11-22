# Deploy Identity Registry to Base Sepolia

## Quick Start

### 1. Get Testnet ETH
- Go to: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- Enter your wallet address
- Get free Base Sepolia ETH (for gas fees)

### 2. Deploy Contract
```bash
cd contracts
npm install

# Create .env file
echo "PRIVATE_KEY=your_private_key_here" > .env
echo "RPC_URL=https://sepolia.base.org" >> .env

# Compile and deploy (explicit command - safer)
npx hardhat compile
npx hardhat run scripts/deploy-identity-registry-base.ts --network base-sepolia

# Or use npm script (specific name)
npm run deploy:identity-registry:base-sepolia
```

### 3. Save Address
The deployment script automatically saves to `.env`:
```
IDENTITY_REGISTRY_ADDRESS=0x...
```

### 4. Update Config
Use the address in:
- `daemon-node` Hub config
- `daemon-node` PDS config
- `daemon-client` wallet provider

## What This Enables

- ✅ Users can register FID on Base Sepolia
- ✅ Hub can verify FIDs exist
- ✅ PDS can link wallets to accounts
- ✅ Client can show real FIDs

## Testing

After deployment:
1. Register FID: Call `register()` on contract
2. Get FID: Call `fidOf(walletAddress)`
3. Verify: Hub checks `fidExists(fid)`

## Production

For production, deploy to **Base Mainnet**:
```bash
npm run deploy:base-mainnet
```

Same contract, just different network!

