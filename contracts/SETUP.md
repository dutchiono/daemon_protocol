# Daemon Contracts Setup Guide

## Prerequisites

- Node.js 18+ and npm
- Git
- Hardhat installed globally (optional): `npm install -g hardhat`

## Step 1: Install Base Dependencies

```bash
cd daemon/contracts
npm install
```

## Step 2: Install Uniswap V4 Core

Uniswap V4 is not yet published to npm. You need to install it from GitHub:

### Option A: Git Submodule (Recommended)

```bash
# From daemon/contracts directory
git submodule add https://github.com/Uniswap/v4-core node_modules/@uniswap/v4-core

# Or if submodules already exist
git submodule update --init --recursive
```

### Option B: Direct Clone

```bash
# From daemon/contracts directory
mkdir -p node_modules/@uniswap
cd node_modules/@uniswap
git clone https://github.com/Uniswap/v4-core v4-core
cd ../../..
```

### Option C: Manual Installation

1. Clone Uniswap V4 Core:
```bash
git clone https://github.com/Uniswap/v4-core /tmp/v4-core
```

2. Copy to node_modules:
```bash
mkdir -p node_modules/@uniswap
cp -r /tmp/v4-core node_modules/@uniswap/v4-core
```

3. Install its dependencies:
```bash
cd node_modules/@uniswap/v4-core
npm install
cd ../../..
```

## Step 3: Update Hardhat Config

The `hardhat.config.ts` should already be configured, but verify it includes:

```typescript
import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@openzeppelin/hardhat-upgrades';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.28',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  // ... rest of config
};
```

## Step 4: Compile Contracts

```bash
npm run compile
```

If you get errors about missing Uniswap V4 imports, verify the installation:

```bash
ls node_modules/@uniswap/v4-core/contracts
```

You should see files like:
- `BaseHook.sol`
- `interfaces/IPoolManager.sol`
- `libraries/Hooks.sol`

## Step 5: Run Tests

```bash
npm test
```

## Troubleshooting

### Error: Cannot find module '@uniswap/v4-core'

**Solution**: Uniswap V4 is not on npm. Install from GitHub using one of the methods above.

### Error: BaseHook not found

**Solution**: Verify Uniswap V4 is installed:
```bash
ls node_modules/@uniswap/v4-core/contracts/BaseHook.sol
```

If missing, reinstall using Option A, B, or C above.

### Error: Solidity version mismatch

**Solution**: Uniswap V4 might use a different Solidity version. Check:
```bash
cat node_modules/@uniswap/v4-core/package.json | grep solidity
```

Update `hardhat.config.ts` to match if needed.

### Error: Import path issues

**Solution**: Hardhat should resolve `@uniswap/v4-core` imports automatically. If not:

1. Check `hardhat.config.ts` paths configuration
2. Verify node_modules structure
3. Try `npx hardhat clean` then `npm run compile`

## Development Workflow

1. **Make changes** to contracts in `core/` or `rewards/`
2. **Compile**: `npm run compile`
3. **Test**: `npm test`
4. **Deploy**: `npm run deploy` (after setting up network config)

## Network Configuration

Add your network configuration to `hardhat.config.ts`:

```typescript
networks: {
  base: {
    url: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
  },
}
```

Set environment variables:
```bash
export BASE_RPC_URL=https://mainnet.base.org
export PRIVATE_KEY=your_private_key_here
```

## Next Steps

- See `README.md` for contract architecture
- See `../docs/` for full documentation
- See `test/` for test examples

