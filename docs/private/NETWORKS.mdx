# Daemon Protocol - Network Configuration

**PRIVATE DOCUMENTATION - DO NOT COMMIT TO PUBLIC REPOSITORY**

## Base Sepolia Testnet

### Network Details
- **Network Name**: Base Sepolia
- **Chain ID**: 84532
- **RPC URL**: https://sepolia.base.org
- **WebSocket URL**: wss://sepolia.base.org
- **Block Explorer**: https://sepolia.basescan.org
- **Faucet**: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

### Known Contract Addresses

#### Uniswap V4
- **PoolManager**: TBD (check if already deployed on Base Sepolia, or deploy using `scripts/deploy-pool-manager.ts`)
- **Note**:
  - Uniswap V4 PoolManager is typically a **singleton contract** deployed by Uniswap (one instance for all pools)
  - Fey Protocol doesn't deploy PoolManager - they use Uniswap's deployed instance
  - Check Uniswap documentation for official PoolManager address on Base/Base Sepolia
  - If not available, you may need to deploy your own from `@uniswap/v4-core`
- **How it works**: PoolManager address is passed to `DaemonHook.initialize()` - same pattern as Fey
- **Deployment Script**: `daemon/contracts/scripts/deploy-pool-manager.ts` (template provided)

#### Standard Tokens
- **WETH**: 0x4200000000000000000000000000000000000006
- **USDC**: TBD (if available on Base Sepolia)

#### Daemon Contracts
See `DEPLOYMENT_TRACKING.md` for deployed Daemon contract addresses.

### Gas Configuration

#### Current Gas Prices
- **Gas Price**: Check via RPC or Basescan
- **Gas Limit**: Standard limits apply
- **Max Fee Per Gas**: TBD
- **Max Priority Fee Per Gas**: TBD

#### Recommended Gas Settings
For deployment scripts, Hardhat will estimate gas automatically. For manual transactions:
- **Deployment**: 3,000,000 gas limit
- **Upgrade**: 500,000 gas limit
- **Regular calls**: 200,000 gas limit

### RPC Endpoints

#### Public RPCs
- https://sepolia.base.org (Base official)
- https://base-sepolia.gateway.tenderly.co (Tenderly)

#### Private RPCs (if using)
- TBD

### Block Explorer Links

- **Basescan**: https://sepolia.basescan.org
- **Base Official**: https://sepolia-explorer.base.org

### Deployment Configuration

#### Environment Variables
```bash
# Required
BOT_WALLET_PRIVATE_KEY=0x... # Used for both deployments and bot operations
BOT_WALLET_ADDRESS=0x... # Wallet address
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
POOL_MANAGER_ADDRESS=0x...
DAEMON_TOKEN_ADDRESS=0x... # The base token that all other tokens pair with

# Optional (with defaults)
WETH_ADDRESS=0x4200000000000000000000000000000000000006
VAULT_ADDRESS=0x... # defaults to deployer
BOOTSTRAP_ADDRESS=0x... # defaults to deployer
TEAM_FEE_RECIPIENT=0x... # defaults to deployer
```

#### Hardhat Network Config
```typescript
'base-sepolia': {
  url: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
  accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
  chainId: 84532,
}
```

### Testing

#### Testnet Tokens
- Get Base Sepolia ETH from faucet
- Use WETH for testing (wrap ETH if needed)

#### Test Scenarios
- Deploy test tokens via Factory
- Test fee collection and splitting
- Test builder rewards
- Test hook callbacks

### Monitoring

#### Key Metrics
- Contract deployment success rate
- Transaction success rate
- Gas usage
- Contract interactions

#### Monitoring Tools
- Basescan for transaction tracking
- Custom monitoring (if implemented)

### Troubleshooting

#### Common Issues
1. **RPC Timeout**: Use different RPC endpoint
2. **Gas Estimation Failed**: Increase gas limit manually
3. **Contract Too Large**: Split contract or optimize
4. **Verification Failed**: Check constructor arguments

#### Support Resources
- Base Sepolia Discord: TBD
- Base Documentation: https://docs.base.org
- Uniswap V4 Documentation: TBD

## Base Mainnet (Future)

### Network Details
- **Network Name**: Base Mainnet
- **Chain ID**: 8453
- **RPC URL**: https://mainnet.base.org
- **Block Explorer**: https://basescan.org

### Notes
- Mainnet deployment will follow same process
- Use mainnet addresses for production
- Ensure thorough testing on Sepolia first

## Notes

- Keep this document updated with current network information
- Document any network-specific issues
- DO NOT commit this file to public repositories

