# Wallet-Based Signup/Login

## Current: Email/Password (Traditional)

Right now, PDS uses traditional signup:
```bash
POST /xrpc/com.atproto.server.createAccount
{
  "handle": "username",
  "email": "user@example.com",
  "password": "password123"
}
```

## Future: Wallet-Based (Blockchain)

### Option 1: Wallet-Only Signup

**Flow:**
1. User connects wallet (MetaMask, etc.)
2. Get FID from identity registry contract
3. Create account on PDS with FID
4. No email/password needed

**Implementation:**
```typescript
// Client
const wallet = await connectWallet();
const fid = await getFID(wallet.address); // From identity registry

// Create account
await pds.createAccountWithWallet(wallet.address, fid);
```

### Option 2: Hybrid (Wallet + PDS)

**Flow:**
1. User connects wallet → Gets FID
2. User chooses PDS → Creates account there
3. PDS links FID to account
4. User signs messages with wallet

**Best of both worlds:**
- Wallet for identity (on-chain)
- PDS for data (off-chain, portable)

## Identity Registry Contract

We need this contract for wallet signup:

```solidity
contract IdentityRegistry {
    uint256 public nextFID = 1;

    mapping(address => uint256) public fidOf; // wallet → FID
    mapping(uint256 => address) public ownerOf; // FID → wallet
    mapping(uint256 => bytes32[]) public signingKeys; // FID → keys

    function register() external returns (uint256) {
        require(fidOf[msg.sender] == 0, "Already registered");

        uint256 fid = nextFID++;
        fidOf[msg.sender] = fid;
        ownerOf[fid] = msg.sender;

        return fid;
    }

    function getFID(address wallet) external view returns (uint256) {
        return fidOf[wallet];
    }
}
```

## Updated PDS Signup

```typescript
// social-network/pds/src/pds-service.ts

async function createAccountWithWallet(
  walletAddress: string,
  fid: number
): Promise<{ did: string; fid: number }> {
  // Verify FID exists and wallet owns it
  const owner = await identityRegistry.ownerOf(fid);
  if (owner.toLowerCase() !== walletAddress.toLowerCase()) {
    throw new Error('Wallet does not own FID');
  }

  // Create DID
  const did = `did:daemon:${fid}`;

  // Create account
  await this.db.createUser(did, fid, walletAddress);

  return { did, fid };
}
```

## Updated Hub Message Validation

```typescript
// social-network/hub/src/message-validator.ts

async function verifySignature(message: Message): Promise<boolean> {
  // Get signing keys from identity registry
  const keys = await identityRegistry.getSigningKeys(message.fid);

  // Verify Ed25519 signature
  return ed25519.verify(message.signature, message.content, keys[0]);
}
```

## Client Flow

```typescript
// social-client/src/wallet/WalletProvider.tsx

async function signup() {
  // 1. Connect wallet
  const wallet = await connectWallet();

  // 2. Get or create FID
  let fid = await identityRegistry.fidOf(wallet.address);
  if (fid === 0) {
    // Register new FID
    const tx = await identityRegistry.register();
    await tx.wait();
    fid = await identityRegistry.fidOf(wallet.address);
  }

  // 3. Create account on PDS
  await pds.createAccountWithWallet(wallet.address, fid);

  // 4. Done!
  setFid(fid);
}
```

## What We Need

1. **Identity Registry Contract** - Deploy to Base/Optimism
2. **Update PDS** - Add wallet-based signup endpoint
3. **Update Hub** - Verify signatures from on-chain keys
4. **Update Client** - Wallet connection + signup flow

## Current vs Future

**Current:**
- Email/password signup
- Off-chain identity
- Works without blockchain

**Future:**
- Wallet signup
- On-chain identity (FID)
- Blockchain integration

**The architecture supports both!**

