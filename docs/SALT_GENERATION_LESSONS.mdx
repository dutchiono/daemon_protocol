# Salt Generation Lessons Learned

This document captures lessons learned from implementing salt generation for token deployment, based on patterns from Fey Protocol and testing with PixieProxy.

## Key Lessons

### 1. Start Salt Generation from 0

**Why**: Successful on-chain transactions (like Fey Protocol) use salt `0x0` (all zeros). Starting from salt 0 matches the production pattern and is the simplest approach.

**Implementation**:
```typescript
let salt = 0n; // Start at 0n to match successful transaction format (salt 0x0)
```

**Previous mistake**: Starting from `1n` skipped salt 0, which doesn't match production patterns.

### 2. Salt Collision Understanding

**How salt collisions work**:
- Salt 0 can be reused by **different admins** or **different configs** (different initCodeHash)
- Collision only occurs when: **same admin + same salt + same initCodeHash**
- Different admins can use salt 0 with the same config → different addresses (no collision)
- Same admin can use salt 0 with different configs → different addresses (no collision)

**Example**:
- Admin A deploys "Token1" with salt 0 → Address X
- Admin B deploys "Token1" with salt 0 → Address Y (different, no collision)
- Admin A deploys "Token1" with salt 0 again → Collision! (same admin + salt + config)

### 3. On-Chain Collision Detection

**Why it's needed**: When multiple deployers (frontend + backend) deploy simultaneously, collisions can occur even with proper salt generation.

**Implementation**:
```typescript
// Check on-chain if predicted address already exists
const existingCode = await provider.getCode(predictedAddress);
if (existingCode && existingCode !== '0x') {
  // Collision detected - retry with different context
}
```

**When to check**: Before deploying, always check if the predicted token address already has code deployed.

### 4. Collision Retry Strategy

**Approach**:
1. **First attempt**: Use base context format matching successful transactions
   ```typescript
   {
     interface: 'Daemon SDK',
     platform: '',
     messageId: '',
     id: ''
   }
   ```

2. **If collision detected**: Retry with unique context to get different initCodeHash
   ```typescript
   {
     interface: 'Daemon SDK',
     platform: '',
     messageId: `daemon-${Date.now()}-${attempts}`,
     id: `collision-${attempts}`
   }
   ```

3. **Max retries**: 3 attempts before failing

**Why this works**: Changing the context changes the initCodeHash, which changes the predicted address, avoiding the collision.

### 5. Context Format Matters

**Important**: The context format must match successful on-chain transactions exactly.

**Correct format** (matches Fey Protocol):
```typescript
{
  interface: 'Daemon SDK',  // or 'Fey SDK' for Fey
  platform: '',
  messageId: '',
  id: ''
}
```

**Why**: This ensures consistency with production deployments and makes debugging easier.

### 6. Token0 Ordering Requirement

**Why it matters**: In Uniswap V4, token ordering determines which token is token0 and which is token1:
- token0 = lower address (numerically)
- token1 = higher address (numerically)

**For Daemon Protocol**:
- New tokens must have addresses < DAEMON token address
- This ensures: NewToken (token0) / DAEMON (token1)
- Salt generation finds salts that produce addresses < DAEMON address

**Implementation**:
```typescript
// Find salt that produces address < DAEMON address
if (BigInt(predictedAddress) < BigInt(DAEMON_TOKEN_ADDRESS)) {
  return { salt, token: predictedAddress };
}
```

### 7. InitCodeHash Calculation

**Formula**: `keccak256(bytecode + encoded_constructor_args)`

**Constructor args order** (must match exactly):
```typescript
[
  name,              // string
  symbol,            // string
  initialSupply,     // uint256
  tokenAdmin,        // address
  image,             // string
  metadata,          // string (JSON)
  context,           // string (JSON)
  originatingChainId // uint256
]
```

**Why order matters**: Changing the order changes the initCodeHash, which changes the predicted address.

### 8. Token Artifact Loading

**Best practice**: Load token bytecode from Hardhat artifacts (compiled contracts).

**Fallback options**:
1. Hardhat artifacts: `contracts/artifacts/contracts/core/Token.sol/Token.json`
2. Environment variable: `TOKEN_BYTECODE`
3. JSON file: Similar to `feyToken.json` in PixieProxy

**Why**: Ensures consistency and avoids manual bytecode management.

## Common Mistakes to Avoid

1. **Starting salt from 1**: Should start from 0 to match production
2. **Not checking collisions**: Always check on-chain before deploying
3. **Wrong context format**: Must match successful transaction format exactly
4. **Wrong constructor args order**: Order matters for initCodeHash
5. **Hardcoded chain ID**: Use dynamic chain ID based on network
6. **Not handling retries**: Implement retry logic for collisions

## Testing Recommendations

1. **Test salt generation**: Verify it starts from 0 and finds valid salts
2. **Test collision detection**: Try deploying same token twice
3. **Test retry logic**: Verify retries work with modified context
4. **Test address prediction**: Verify predicted address matches actual deployment
5. **Test on testnet first**: Always test on Sepolia before mainnet

## References

- Fey Protocol Factory: `0x8eef0dc80adf57908bb1be0236c2a72a7e379c2d` (Base Mainnet)
- Successful Fey transaction: Uses salt `0x0` with base context format
- PixieProxy testing: Revealed collision issues and salt generation problems

