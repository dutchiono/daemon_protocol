# Architecture: What We Actually Built

## It's BOTH - A Hybrid!

We built something **in between Bluesky and Snapchain**:

### From Snapchain (Farcaster):
- ✅ **Hub** - P2P message relay
- ✅ Message validation
- ✅ Gossip protocol (when libp2p is fully configured)
- ✅ On-chain identity support (FID system)

### From Bluesky (AT Protocol):
- ✅ **PDS** - Personal Data Server
- ✅ AT Protocol-compatible API
- ✅ Account portability
- ✅ Federation between PDS instances

### The Hybrid:
- **Hub** handles fast message propagation (Snapchain style)
- **PDS** handles user data ownership (Bluesky style)
- **Gateway** provides unified API

## Wallet/Blockchain Integration

### Current State: Optional

**Right now:**
- Posts work without wallet
- PDS uses email/password (traditional signup)
- Hub accepts messages with FID (can be off-chain)

**But designed for blockchain integration:**
- FID system ready (just needs identity registry contract)
- Message signatures ready (Ed25519, just needs key management)
- Wallet connection ready in client

### How to Add Blockchain Later:

1. **Identity Registry Contract** (on-chain)
   - Maps wallet address → FID
   - Stores signing keys
   - Optional recovery

2. **Update PDS** to verify on-chain identity
   - Check FID exists on-chain
   - Verify wallet owns FID

3. **Update Hub** to verify signatures
   - Get signing key from on-chain registry
   - Verify Ed25519 signature

**The architecture supports it - just needs the contract!**

## DHT - Yes, We Need It!

Currently nodes connect via explicit peer lists:
```bash
PEERS="ws://node1.com,ws://node2.com"  # Manual
```

**With DHT:**
- Nodes discover each other automatically
- No central registry needed
- True decentralization

**What we need to add:**
- libp2p DHT module
- Bootstrap node list
- Peer discovery logic

## Signup/Login - Current vs Future

### Current Implementation (PDS):

**Traditional signup:**
```bash
POST /xrpc/com.atproto.server.createAccount
{
  "handle": "username",
  "email": "user@example.com",
  "password": "password123"
}
```

**This creates:**
- DID: `did:daemon:username`
- Account on PDS
- No wallet required

### Future: Wallet-Based Signup

**Option 1: Wallet-only**
```typescript
// User connects wallet
const wallet = await connectWallet();

// Get or create FID from identity registry
const fid = await getOrCreateFID(wallet.address);

// Create account on PDS with FID
await pds.createAccount(fid, wallet.address);
```

**Option 2: Hybrid (Wallet + PDS)**
- Wallet for identity (FID)
- PDS for data storage
- Best of both worlds

### The Flow:

1. **User connects wallet** → Gets FID from identity registry
2. **PDS creates account** → Links FID to DID
3. **User signs messages** → With Ed25519 key (from wallet or derived)
4. **Hub validates** → Checks signature against on-chain registry

## What We Need to Build

### 1. DHT Integration
```typescript
// In hub/src/index.ts
import { kadDHT } from '@libp2p/kad-dht';

const node = await createLibP2P({
  dht: kadDHT(), // Add DHT
  // ... rest of config
});
```

### 2. Identity Registry Contract
```solidity
contract IdentityRegistry {
    mapping(address => uint256) public fidOf; // wallet → FID
    mapping(uint256 => address) public ownerOf; // FID → wallet
    mapping(uint256 => bytes32[]) public keys; // FID → signing keys

    function register(address wallet) external returns (uint256 fid);
    function addKey(uint256 fid, bytes32 key) external;
}
```

### 3. Wallet-Based Signup
```typescript
// In PDS
async function createAccountWithWallet(walletAddress: string) {
  // Get FID from identity registry
  const fid = await identityRegistry.fidOf(walletAddress);

  // Create DID
  const did = `did:daemon:${fid}`;

  // Create account
  await db.createUser(did, fid, walletAddress);
}
```

## Summary

**What we built:**
- Hybrid of Bluesky + Snapchain
- PDS (Bluesky style) + Hub (Snapchain style)
- Wallet/blockchain ready (just needs integration)

**What we need:**
- DHT for true decentralization
- Identity registry contract (for wallet signup)
- Update PDS to support wallet-based signup

**Current signup:** Email/password (traditional)
**Future signup:** Wallet-based (blockchain)

The architecture is ready - we just need to wire it up!

