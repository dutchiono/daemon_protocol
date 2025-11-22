# Environment Variables Setup

## Current Status

The warning `ID_REGISTRY_ADDRESS not set` appears because:

1. **The IdRegistry contract hasn't been deployed yet** - We created the deployment script, but haven't run it
2. **No `.env` file exists** - The deployment script would create/update this
3. **The node still works** - This is just a warning, not an error

## What This Means

- ✅ **Node will start and run** - Hub, PDS, and Gateway all work
- ⚠️ **Wallet-based signup is disabled** - Users can't sign up with their wallet/FID
- ✅ **Email/password signup still works** - Traditional signup works fine

## To Enable Wallet Signup (Optional)

If you want to enable wallet-based signup, you need to:

### Step 1: Deploy IdRegistry Contract

```powershell
cd contracts
npx hardhat run scripts/deploy-id-registry-base.ts
```

This will:
- Deploy the IdRegistry contract to Base Sepolia
- Save the address to `.env` as `ID_REGISTRY_ADDRESS`

### Step 2: Restart the Node

After deployment, restart your node:
```powershell
cd daemon-node
npm run dev all
```

The warning should disappear and wallet signup will be enabled.

## Current Environment Variables Needed

The node looks for these in `.env` (in the root directory):

- `ID_REGISTRY_ADDRESS` - For wallet-based signup (optional)
- `KEY_REGISTRY_ADDRESS` - For signing key verification (optional)
- `STORAGE_REGISTRY_ADDRESS` - For storage checks (optional)
- `RPC_URL` - Base Sepolia RPC (defaults to `https://sepolia.base.org`)
- `PRIVATE_KEY` or `BOT_WALLET_PRIVATE_KEY` - For contract deployment

## Summary

**You don't need to deploy the contract right now** - the node works fine without it. The warning is just informational. Deploy it later when you want to test wallet-based signup.
