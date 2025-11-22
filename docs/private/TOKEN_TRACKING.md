# Daemon Protocol - Token Deployment Tracking

**PRIVATE DOCUMENTATION - DO NOT COMMIT TO PUBLIC REPOSITORY**

This is the **SINGLE SOURCE OF TRUTH** for tracking all tokens deployed via Daemon Factory.

## Base Sepolia Testnet

### Network Information
- **Network**: Base Sepolia
- **Chain ID**: 84532
- **RPC URL**: https://sepolia.base.org (or Alchemy)
- **Block Explorer**: https://sepolia.basescan.org
- **Factory Address**: TBD (update after factory deployment)

---

## Deployed Tokens

| Token Name | Symbol | Address | Admin | Salt | Tx Hash | Block | Deployed At | Pool Address | Notes |
|------------|--------|---------|-------|------|---------|-------|-------------|-------------|-------|
| - | - | - | - | - | - | - | - | - | - |

---

## Token Deployment Template

When deploying a new token, add a row with:

```markdown
| TokenName | SYMBOL | 0x... | 0x... | 0x... | 0x... | 12345 | 2024-01-01 12:00:00 UTC | 0x... | Notes |
```

**Fields:**
- **Token Name**: Full token name
- **Symbol**: Token symbol (uppercase)
- **Address**: Token contract address (from TokenCreated event)
- **Admin**: Token admin address (from deployment)
- **Salt**: Factory salt used (for reference)
- **Tx Hash**: Deployment transaction hash
- **Block**: Block number of deployment
- **Deployed At**: Timestamp of deployment
- **Pool Address**: Uniswap V4 pool address (if created)
- **Notes**: Any relevant notes (TGE enabled, special config, etc.)

---

## Quick Reference

### Factory Contract
- **Address**: TBD
- **Implementation**: TBD
- **Deployed**: TBD

### Base Token (DAEMON)
- **Address**: TBD
- **Name**: Daemon Protocol
- **Symbol**: DAEMON

### Hook Contract
- **Address**: TBD
- **Implementation**: TBD

---

## Notes

- **Salt Format**: Salt starts from 0 (0x0) to match production patterns
- **Collision Handling**: Factory service checks for collisions before deploying
- **Token0 Ordering**: All new tokens must have address < DAEMON address (ensures token0 ordering)
- **Update Frequency**: Update this file immediately after each token deployment
- **DO NOT COMMIT**: This file contains deployment information - keep private

---

## Deployment Commands

```bash
# Deploy token via factory service
cd backend
npm run test:launch

# Or use SDK directly
# (see docs/DEPLOYMENT.md for full instructions)
```

---

## Last Updated

- **Date**: TBD
- **Last Token Deployed**: None yet
- **Total Tokens Deployed**: 0

