# What Did We Build? The Daemon Social Network Node System

## Overview

We built a **hybrid decentralized social network** that combines:
- **Farcaster's Snapchain** (P2P message relay)
- **Bluesky's AT Protocol** (Personal Data Servers)

## The Three Node Types

### 1. Hub (P2P Message Relay) - `social-network/hub/`

**What it does:**
- Receives messages from users/clients
- Validates message signatures
- Stores messages in database
- Propagates messages to other hubs (P2P gossip protocol)
- Syncs with peer hubs to stay up-to-date

**Think of it as:** A decentralized message board that everyone can read/write to

**API:**
- `POST /api/v1/messages` - Submit a message
- `GET /api/v1/messages/:hash` - Get a message by hash
- `GET /api/v1/messages/fid/:fid` - Get all messages from a user
- `GET /api/v1/sync/status` - Check sync status with other hubs

**Files:**
- `src/index.ts` - Main server
- `src/hub-service.ts` - Core hub logic
- `src/message-validator.ts` - Validates messages
- `src/sync-engine.ts` - Syncs with other hubs
- `src/database.ts` - Stores messages

### 2. PDS (Personal Data Server) - `social-network/pds/`

**What it does:**
- Hosts user data (posts, profile, follows)
- Provides AT Protocol-compatible API
- Stores user's posts and data
- Replicates data to other PDS instances (federation)
- Supports account portability (users can migrate between PDS)

**Think of it as:** Your personal cloud storage for social data

**API (AT Protocol style):**
- `POST /xrpc/com.atproto.server.createAccount` - Create account
- `GET /xrpc/com.atproto.repo.getProfile` - Get user profile
- `POST /xrpc/com.atproto.repo.createRecord` - Create post/record
- `GET /xrpc/com.atproto.repo.listRecords` - List user's posts
- `POST /xrpc/com.atproto.server.migrateAccount` - Migrate account

**Files:**
- `src/index.ts` - Main server
- `src/pds-service.ts` - Core PDS logic
- `src/replication-engine.ts` - Replicates data to federation
- `src/database.ts` - Stores user data

### 3. Gateway (HTTP API) - `social-network/gateway/`

**What it does:**
- Aggregates data from hubs and PDS
- Provides unified HTTP API for clients
- Handles x402 payments (HTTP 402 Payment Required)
- Caches data for performance
- Builds feeds (algorithmic and chronological)

**Think of it as:** The front door - clients talk to this, it talks to hubs/PDS

**API:**
- `GET /api/v1/feed` - Get user feed (requires payment)
- `POST /api/v1/posts` - Create post
- `GET /api/v1/posts/:hash` - Get post
- `GET /api/v1/profile/:fid` - Get profile
- `POST /api/v1/follow` - Follow user
- `POST /api/v1/reactions` - Like/repost
- `GET /api/v1/search` - Search posts/users

**Files:**
- `src/index.ts` - Main server
- `src/gateway-service.ts` - Core gateway logic
- `src/aggregation-layer.ts` - Aggregates from hubs/PDS
- `src/x402-middleware.ts` - Handles payments

## How They Work Together

```
User creates post
    ↓
PDS stores it (user's data server)
    ↓
PDS notifies Hub
    ↓
Hub validates and stores message
    ↓
Hub propagates to other hubs (gossip)
    ↓
Gateway queries Hub for feed
    ↓
Gateway returns feed to client (with x402 payment)
```

## What Makes This Different

### From Farcaster:
- **Similar**: Hub-based P2P message relay
- **Different**: Also has PDS for user data (like Bluesky)

### From Bluesky:
- **Similar**: PDS for user data, AT Protocol API
- **Different**: Also has Hub for message relay (like Farcaster)

### The Hybrid:
- **Hub** = Fast message propagation (Farcaster style)
- **PDS** = User data ownership and portability (Bluesky style)
- **Gateway** = Easy client access with payments

## What You Can Do With It

1. **Create Posts**: Via PDS or Gateway
2. **View Feed**: Via Gateway (aggregates from Hub)
3. **Follow Users**: Stored in PDS, synced to Hub
4. **React**: Like/repost posts
5. **Search**: Find posts and users

## Current State

✅ **Built:**
- Hub node (message relay)
- PDS node (user data)
- Gateway node (API aggregation)
- Database schema
- Basic APIs

⚠️ **Needs Work:**
- libp2p integration (for real P2P)
- Message signature verification (Ed25519)
- FID mapping (wallet → FID)
- x402 payment flow (wallet integration)
- Client app (React app needs wallet connection)

## Testing It

See `START_NODES.md` for how to run all three nodes and test them.

The goal: **Create a post → See it in the feed**

That's the core functionality we're testing!

