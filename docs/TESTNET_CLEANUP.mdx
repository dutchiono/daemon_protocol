# Testnet Cleanup Checklist

Before deploying to mainnet, ensure all testnet-specific code and configurations are removed or updated.

## Testnet-Only Contracts

### 1. TestETHToken (daemonETH)
- **File**: `daemon/contracts/core/TestETHToken.sol`
- **Purpose**: Mock ETH token for TGE testing on testnet
- **Action**:
  - ❌ Do NOT deploy to mainnet
  - ✅ Remove from deployment scripts
  - ✅ Document that it's testnet-only

### 2. TGEWrapper
- **File**: `daemon/contracts/core/TGEWrapper.sol`
- **Purpose**: Wrapper to convert test ETH token to real ETH for TGE
- **Action**:
  - ❌ Do NOT deploy to mainnet
  - ✅ Remove from deployment scripts
  - ✅ Document that it's testnet-only

## Testnet Configuration

### Environment Variables
- `DAEMON_ETH_TOKEN_ADDRESS` - Remove from mainnet `.env`
- `TESTNET_POOL_MANAGER_ADDRESS` - Verify mainnet PoolManager address
- `WETH_ADDRESS` - On testnet, Factory may use daemonETH as WETH. On mainnet, must use real WETH.

### Deployment Scripts
- `deploy-daemon-eth-token.ts` - Mark as testnet-only
- `deploy-tge-wrapper.ts` - Mark as testnet-only
- `simulate-tge.ts` - Mark as testnet-only

## Mainnet Deployment Checklist

### Before Mainnet:
- [ ] Remove all testnet-only contracts from deployment
- [ ] Verify WETH address for mainnet (Base: `0x4200000000000000000000000000000000000006`)
- [ ] **Set `WETH_ADDRESS=0x4200000000000000000000000000000000000006` in `.env`** (don't use daemonETH)
- [ ] Verify PoolManager address for mainnet
- [ ] Remove `DAEMON_ETH_TOKEN_ADDRESS` from `.env`
- [ ] Update `NETWORK=mainnet` in `.env`
- [ ] Test bootstrap deployment flow on testnet first
- [ ] Verify `setBaseToken()` can only be called once
- [ ] Document mainnet ceremony process

### Bootstrap Deployment Order (Mainnet):
1. Deploy infrastructure contracts (no changes)
2. Deploy Factory in bootstrap mode (`baseToken=0x0`)
3. Bootstrap collects ETH contributions (off-chain or separate contract)
4. Bootstrap deploys DAEMON token via `factory.deployToken()` with:
   - `pairedToken=WETH`
   - `msg.value=collectedETH` (for initial liquidity)
5. Bootstrap calls `factory.setBaseToken(daemonTokenAddress)`
6. Factory transitions to regular mode
7. All future tokens pair with DAEMON

## Notes

- Testnet allows testing with fake ETH tokens
- Mainnet uses real ETH for TGE
- Bootstrap address must be secure (has special permissions)
- `setBaseToken()` can only be called once (immutable after bootstrap)

