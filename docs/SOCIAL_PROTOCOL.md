# Daemon Social Protocol Specification

## Overview

The Daemon Social Protocol is a hybrid decentralized social network that combines the best features of Farcaster's Snapchain and Bluesky's AT Protocol, integrated with the Daemon Protocol for fee-based network funding.

## Core Principles

1. **Hybrid Architecture**: Combines Snapchain's P2P networking with AT Protocol's federated data servers
2. **On-Chain Identity**: User identities anchored on Ethereum/Base blockchain
3. **Off-Chain Content**: Messages, posts, and media stored off-chain for scalability
4. **Fee-Funded Network**: Network infrastructure funded by Daemon Protocol swap fees
5. **Account Portability**: Users can migrate between Personal Data Servers (PDS)
6. **Composable Data**: Structured data that can be composed and extended

## Protocol Components

### 1. Identity System

#### On-Chain Identity
- **FID (Farcaster ID)**: Unique identifier minted on-chain
- **Key Pairs**: Ed25519 signing keys for message authentication
- **Recovery**: Social recovery or multi-sig for account recovery
- **Storage**: Identity registry contract on Ethereum/Base

#### Identity Registry Contract
```solidity
struct Identity {
    uint256 fid;                    // Farcaster ID
    address recovery;               // Recovery address
    uint256 keyCount;                // Number of signing keys
    uint256 createdAt;              // Creation timestamp
    bool active;                     // Active status
}
```

### 2. Message Types

#### Cast (Farcaster-style)
- Short-form messages (280 characters)
- Can include mentions, hashtags, embeds
- Supports replies and threads

```typescript
interface Cast {
  hash: string;                     // Message hash
  fid: number;                      // Farcaster ID
  text: string;                      // Message content (max 280 chars)
  mentions?: number[];              // Mentioned FIDs
  mentionsPositions?: number[];     // Positions of mentions
  embeds?: Embed[];                 // Embedded content
  parentHash?: string;              // Parent cast hash (for replies)
  rootParentHash?: string;          // Root cast hash (for threads)
  timestamp: number;                // Unix timestamp
  deleted?: boolean;                // Deletion flag
}
```

#### Post (AT Protocol-style)
- Long-form content
- Rich media support
- Composable data structures

```typescript
interface Post {
  uri: string;                      // AT URI (did:at:...)
  cid: string;                      // Content ID (IPFS)
  author: string;                   // DID (Decentralized Identifier)
  text: string;                     // Post content
  createdAt: string;                // ISO 8601 timestamp
  replyTo?: string;                 // Parent post URI
  embed?: Embed;                    // Embedded content
  facets?: Facet[];                 // Rich text facets
  langs?: string[];                 // Language tags
}
```

#### Reaction
- Like, repost, quote reactions
- On-chain or off-chain depending on type

```typescript
interface Reaction {
  type: 'like' | 'repost' | 'quote';
  targetHash: string;               // Target message hash
  fid: number;                      // Reactor FID
  timestamp: number;
}
```

#### Follow
- Follow/unfollow relationships
- Stored in PDS, synced across network

```typescript
interface Follow {
  fid: number;                      // Follower FID
  targetFid: number;                // Followed FID
  timestamp: number;
  active: boolean;                  // Follow/unfollow flag
}
```

### 3. Data Structures

#### User Profile
```typescript
interface Profile {
  fid: number;                      // Farcaster ID
  username?: string;                 // Optional username
  displayName?: string;              // Display name
  bio?: string;                      // Bio text
  avatar?: string;                  // Avatar URL/CID
  banner?: string;                  // Banner URL/CID
  location?: string;                // Location
  website?: string;                 // Website URL
  verified: boolean;                // Verification status
  createdAt: number;                // Profile creation timestamp
  updatedAt: number;                // Last update timestamp
}
```

#### Embed
```typescript
interface Embed {
  type: 'url' | 'cast' | 'image' | 'video' | 'audio';
  url?: string;                     // URL for URL embeds
  castHash?: string;                // Cast hash for cast embeds
  metadata?: {
    title?: string;
    description?: string;
    image?: string;
  };
}
```

#### Facet (AT Protocol-style rich text)
```typescript
interface Facet {
  index: {
    byteStart: number;
    byteEnd: number;
  };
  features: Array<{
    type: 'mention' | 'link' | 'tag' | 'bold' | 'italic';
    did?: string;                   // For mentions
    uri?: string;                   // For links
    tag?: string;                  // For hashtags
  }>;
}
```

### 4. Network Architecture

#### Hub (Snapchain-style)
- P2P message relay nodes
- Validates and propagates messages
- Syncs with other hubs
- Stores message history

#### Personal Data Server (PDS) - AT Protocol-style
- Hosts user data (posts, follows, profile)
- Provides API for user's own data
- Supports account portability
- Replicates data across PDS instances

#### Gateway
- HTTP API for clients
- Aggregates data from hubs and PDS
- x402 payment integration
- Rate limiting and access control

### 5. Message Validation

#### Signature Scheme
- **Algorithm**: Ed25519
- **Format**: Compact signature (64 bytes)
- **Signing**: All messages must be signed by user's key

#### Validation Rules
1. FID must exist on-chain
2. Signing key must be registered for FID
3. Message hash must be unique
4. Timestamp must be recent (within 24 hours)
5. Content must meet protocol rules (length, format)

### 6. Sync Protocol

#### Hub-to-Hub Sync
- Gossip protocol for message propagation
- Merkle trees for efficient sync
- Checkpoint-based sync for new hubs
- Conflict resolution via timestamp + hash

#### PDS Federation
- AT Protocol-style federation
- Cross-PDS data replication
- Account migration support
- Data integrity verification

### 7. Feed Algorithms

#### Chronological Feed
- Simple time-ordered feed
- Based on follows
- Real-time updates

#### Algorithmic Feed
- Engagement-based ranking
- Time decay factor
- Personalization based on interactions

### 8. Storage

#### On-Chain
- Identity registry (FIDs)
- Key management
- Critical metadata

#### Off-Chain
- Message content
- User profiles
- Media files (IPFS)
- Follow graphs

### 9. Integration with Daemon Protocol

#### Fee Collection
- Portion of swap fees routed to Social Network Fund
- Fees distributed to node operators (hubs, PDS, gateways)
- Operator performance tracking

#### Token Integration
- DAEMON token for staking
- Fee distribution in DAEMON or ETH
- Governance participation

## Protocol Versioning

- **Version**: 1.0.0
- **Compatibility**: Backward compatible message format
- **Upgrades**: On-chain governance for protocol changes

## Security Considerations

1. **Message Validation**: All messages cryptographically signed
2. **Spam Prevention**: Rate limiting and reputation system
3. **Sybil Resistance**: On-chain identity requirements
4. **Data Integrity**: Cryptographic verification of all data
5. **Privacy**: Optional encryption for private messages

## Future Extensions

- Private messaging
- Group chats
- Media galleries
- NFT integration
- Token-gated content
- Decentralized moderation

