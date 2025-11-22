# Daemon SDK

## Installation

```bash
npm install @daemon/sdk
```

## Usage

### Initialize SDK

```typescript
import { ethers } from 'ethers';
import * as daemon from '@daemon/sdk';

const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
```

### Hook Functions

```typescript
// Get hook configuration
const config = await daemon.getHookConfig(provider);

// Get pool information
const poolInfo = await daemon.getPoolInfo(provider, poolId);

// Get token admin for pool
const tokenAdmin = await daemon.getPoolTokenAdmin(provider, poolId);
```

### Builder Rewards

```typescript
// Get contributor score
const score = await daemon.getContributorScore(provider, contributorAddress);

// Get available rewards
const rewards = await daemon.getAvailableRewards(provider, contributorAddress);

// Claim rewards
const signer = await provider.getSigner();
const tx = await daemon.claimRewards(signer, contributorAddress);
```

### Token Deployment

```typescript
import { buildDeployTokenTx } from '@daemon/sdk';

const config = {
  tokenConfig: { /* ... */ },
  poolConfig: { /* ... */ },
  lockerConfig: { /* ... */ },
  mevModuleConfig: { /* ... */ },
};

const txRequest = await buildDeployTokenTx(config, factoryAddress, signer);
const tx = await signer.sendTransaction(txRequest);
```

## API Reference

See TypeScript definitions in `sdk/src/` for complete API documentation.

