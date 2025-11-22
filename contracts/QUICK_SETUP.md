# Quick Setup for Deployment

## The Error You're Seeing

```
Error: PRIVATE_KEY environment variable required
```

This means you need to create a `.env` file with your private key.

## Quick Fix (3 Steps)

### Step 1: Create .env file

In PowerShell (from `contracts/` directory):

```powershell
@"
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
RPC_URL=https://sepolia.base.org
"@ | Out-File -FilePath .env -Encoding utf8
```

**Replace `0xYOUR_PRIVATE_KEY_HERE` with your actual private key from MetaMask**

### Step 2: Get Your Private Key

1. Open MetaMask
2. Click account icon (top right)
3. Account details → Show private key
4. Enter password
5. Copy the key (starts with `0x`)

### Step 3: Get Testnet ETH

Before deploying, get free Base Sepolia ETH:
- https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- Enter your wallet address
- Get testnet ETH

### Step 4: Deploy

```bash
npx hardhat run scripts/deploy-identity-registry-base.ts --network base-sepolia
```

## Security Notes

- ⚠️ `.env` file is in `.gitignore` (won't be committed)
- ⚠️ Never share your private key
- ⚠️ Use a test wallet for testnet (not your main wallet)

## Verify .env is Working

The script will now:
1. Load `.env` automatically
2. Check your balance
3. Deploy the contract
4. Save address to `.env`

