# Start the Social Network Nodes

## Quick Start (3 Commands)

Open 3 terminals and run:

### Terminal 1: Hub
```bash
cd social-network/hub
npm install
HUB_PORT=4001 DATABASE_URL="postgresql://postgres:password@localhost:5432/daemon" RPC_URL="https://sepolia.base.org" CHAIN_ID=84532 NODE_ID="hub-1" PEERS="" npm run dev
```

### Terminal 2: PDS
```bash
cd social-network/pds
npm install
PDS_PORT=4002 DATABASE_URL="postgresql://postgres:password@localhost:5432/daemon" PDS_ID="pds-1" FEDERATION_PEERS="" IPFS_GATEWAY="https://ipfs.io/ipfs/" npm run dev
```

### Terminal 3: Gateway
```bash
cd social-network/gateway
npm install
GATEWAY_PORT=4003 GATEWAY_ID="gateway-1" HUB_ENDPOINTS="http://localhost:4001" PDS_ENDPOINTS="http://localhost:4002" DATABASE_URL="postgresql://postgres:password@localhost:5432/daemon" REDIS_URL="" X402_SERVICE_URL="http://localhost:3000" npm run dev
```

## Verify They're Running

```bash
# All should return {"status":"ok",...}
curl http://localhost:4001/health  # Hub
curl http://localhost:4002/health  # PDS
curl http://localhost:4003/health  # Gateway
```

## Test Creating a Post

```bash
curl -X POST http://localhost:4002/xrpc/com.atproto.repo.createRecord \
  -H "Content-Type: application/json" \
  -d '{
    "repo": "did:daemon:1",
    "collection": "app.bsky.feed.post",
    "record": {
      "$type": "app.bsky.feed.post",
      "text": "My first post!",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }'
```

## Test Submitting to Hub

```bash
curl -X POST http://localhost:4001/api/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "hash": "0x1234567890abcdef",
    "fid": 1,
    "text": "Hello from hub",
    "timestamp": 1234567890
  }'
```

## Run E2E Test

```bash
cd social-network
chmod +x test-e2e.sh
./test-e2e.sh
```

## What to Expect

1. **Hub**: Stores and relays messages
2. **PDS**: Stores user data and posts (AT Protocol style)
3. **Gateway**: Aggregates data from hub and PDS, returns 402 for payments

The goal is to:
- Create a post → See it in the system
- Submit message to hub → Retrieve it
- Query feed via gateway → Get posts (with payment)

That's it! No contracts needed for this.

