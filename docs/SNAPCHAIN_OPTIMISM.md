# Snapchain & Optimism: What's the Connection?

## The Key Insight: Snapchain is NOT Optimism

**Snapchain** = Farcaster's P2P message relay network (off-chain)
**Optimism** = Ethereum L2 blockchain (on-chain)

They're **separate but complementary**:

## How They Work Together

### 1. **Identity on Optimism (On-Chain)**
- User registers FID (Farcaster ID) on Optimism
- Contract: `IdRegistry` on Optimism
- Maps wallet address → FID number
- This is the **only** on-chain part

### 2. **Messages on Snapchain (Off-Chain)**
- All posts, follows, reactions are **off-chain**
- Stored in Hub nodes (PostgreSQL databases)
- Propagated via P2P (libp2p)
- **No blockchain needed for messages!**

## The Flow

```
1. User connects wallet (Optimism)
   ↓
2. Get FID from IdRegistry contract (on Optimism)
   ↓
3. Create post (off-chain, stored in Hub)
   ↓
4. Hub validates: "Does this FID exist on Optimism?"
   ↓
5. If yes → Store message, propagate to network
   ↓
6. Message lives in Hub databases (not on blockchain!)
```

## Why This Design?

**Benefits:**
- ✅ Fast (no gas fees for posts)
- ✅ Cheap (only pay once for FID registration)
- ✅ Scalable (millions of posts, no blockchain bloat)
- ✅ Decentralized (Hubs are independent)

**Trade-offs:**
- ⚠️ Messages are off-chain (but replicated across Hubs)
- ⚠️ Need Hub operators (but incentivized by fees)

## What We Need on Optimism

### Required Contract: Identity Registry

```solidity
contract IdentityRegistry {
    uint256 public nextFID = 1;
    mapping(address => uint256) public fidOf; // wallet → FID
    mapping(uint256 => address) public ownerOf; // FID → wallet

    function register() external returns (uint256) {
        require(fidOf[msg.sender] == 0, "Already registered");
        uint256 fid = nextFID++;
        fidOf[msg.sender] = fid;
        ownerOf[fid] = msg.sender;
        emit FIDRegistered(msg.sender, fid);
        return fid;
    }
}
```

**That's it!** Just identity. Everything else is off-chain.

## Our Implementation

### Current State:
- ✅ Hub (off-chain message relay)
- ✅ PDS (off-chain user data)
- ✅ Gateway (off-chain API)
- ❌ Identity Registry (needs Base Sepolia contract - ready to deploy!)

### What We Need:
1. **Deploy Identity Registry to Base Sepolia** (testnet)
2. **Update Hub to verify FIDs from contract**
3. **Update PDS to link FIDs to accounts**

**But messages work NOW without blockchain!**

**Deployment ready:** See `contracts/README.md` for deployment instructions.

## Summary

- **Snapchain** = Off-chain P2P network (messages)
- **Optimism** = On-chain identity (FID registration)
- **Connection** = Hub verifies FID exists on Optimism, then stores message off-chain

**You don't need Optimism to test!** Messages work without it. You only need it for:
- FID registration (one-time)
- FID verification (Hub checks if FID exists)

For testing, you can use **off-chain FIDs** (just numbers) and add Optimism later!

