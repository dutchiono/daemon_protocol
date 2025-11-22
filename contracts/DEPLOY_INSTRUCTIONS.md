# Deploy Identity Registry to Base Sepolia

## Step 1: Get Testnet ETH

Go to: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- Enter your wallet address
- Get free Base Sepolia ETH (you need this for gas fees)

## Step 2: Setup Environment

Create `.env` file in `contracts/` directory:

```bash
PRIVATE_KEY=your_private_key_here
RPC_URL=https://sepolia.base.org
```

**⚠️ Never commit your private key!**

## Step 3: Compile (Already Done!)

The contract is already compiled. If you see "Nothing to compile", that's fine - it means it's up to date.

## Step 4: Deploy

**Recommended (explicit):**
```bash
npx hardhat run scripts/deploy-identity-registry-base.ts --network base-sepolia
```

**Or use npm script:**
```bash
npm run deploy:identity-registry:base-sepolia
```

**Why explicit is better:** You can see exactly what script is running!

## Step 5: Verify Deployment

The script will:
- ✅ Show contract address
- ✅ Save to `.env` automatically
- ✅ Show Basescan explorer link

## What You Get

After deployment, your `.env` will have:
```
IDENTITY_REGISTRY_ADDRESS=0x...
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

## Next Steps

1. Update Hub config with `IDENTITY_REGISTRY_ADDRESS`
2. Update PDS config for wallet signup
3. Test FID registration!

## Troubleshooting

**"Nothing to compile"** = ✅ Good! Contract is already compiled.

**"Contract not compiled"** = Run `npx hardhat compile` first.

**"Insufficient funds"** = Get testnet ETH from faucet.

**"PRIVATE_KEY required"** = Add your private key to `.env` file.

