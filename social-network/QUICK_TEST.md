# Quick Test: Get Social Network Nodes Running

## Goal: Test Posting and Viewing Posts

Forget contracts for now. Let's just get the nodes working.

## Step 1: Database Setup

```bash
# Make sure you have PostgreSQL running
# Run the social network schema
psql -U postgres -d daemon -f ../../backend/db/social-schema.sql
```

## Step 2: Install Dependencies

```bash
# Hub
cd social-network/hub
npm install

# PDS
cd ../pds
npm install

# Gateway
cd ../gateway
npm install
```

## Step 3: Start Nodes (3 Terminals)

### Terminal 1: Hub
```bash
cd social-network/hub

# Minimal config - just get it running
export HUB_PORT=4001
export DATABASE_URL="postgresql://postgres:password@localhost:5432/daemon"
export RPC_URL="https://sepolia.base.org"
export CHAIN_ID=84532
export NODE_ID="hub-1"
export PEERS=""

npm run dev
```

### Terminal 2: PDS
```bash
cd social-network/pds

export PDS_PORT=4002
export DATABASE_URL="postgresql://postgres:password@localhost:5432/daemon"
export PDS_ID="pds-1"
export FEDERATION_PEERS=""
export IPFS_GATEWAY="https://ipfs.io/ipfs/"

npm run dev
```

### Terminal 3: Gateway
```bash
cd social-network/gateway

export GATEWAY_PORT=4003
export GATEWAY_ID="gateway-1"
export HUB_ENDPOINTS="http://localhost:4001"
export PDS_ENDPOINTS="http://localhost:4002"
export DATABASE_URL="postgresql://postgres:password@localhost:5432/daemon"
export REDIS_URL=""
export X402_SERVICE_URL="http://localhost:3000"

npm run dev
```

## Step 4: Test Basic Functionality

### Test 1: Health Checks
```bash
# All should return {"status":"ok",...}
curl http://localhost:4001/health  # Hub
curl http://localhost:4002/health  # PDS
curl http://localhost:4003/health  # Gateway
```

### Test 2: Create a Post (via PDS)
```bash
curl -X POST http://localhost:4002/xrpc/com.atproto.repo.createRecord \
  -H "Content-Type: application/json" \
  -d '{
    "repo": "did:daemon:1",
    "collection": "app.bsky.feed.post",
    "record": {
      "$type": "app.bsky.feed.post",
      "text": "Hello from Daemon Social!",
      "createdAt": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
    }
  }'
```

### Test 3: Submit Message to Hub
```bash
# Create a message hash (simplified)
MESSAGE="Hello from hub test"
HASH=$(echo -n "$MESSAGE" | sha256sum | cut -d' ' -f1)

curl -X POST http://localhost:4001/api/v1/messages \
  -H "Content-Type: application/json" \
  -d "{
    \"hash\": \"0x$HASH\",
    \"fid\": 1,
    \"text\": \"$MESSAGE\",
    \"timestamp\": $(date +%s)
  }"
```

### Test 4: Get Message from Hub
```bash
# Use the hash from Test 3
curl http://localhost:4001/api/v1/messages/0x$HASH
```

### Test 5: Get Feed via Gateway
```bash
# This will return 402 Payment Required (expected!)
# But it shows the gateway is working
curl http://localhost:4003/api/v1/feed?fid=1
```

## Step 5: Check Database

```bash
psql -U postgres -d daemon

# Check messages
SELECT * FROM messages LIMIT 5;

# Check PDS records
SELECT * FROM pds_records LIMIT 5;

# Check profiles
SELECT * FROM profiles LIMIT 5;
```

## Troubleshooting

### Hub won't start
- Check: Database connection string correct?
- Check: Port 4001 available?
- Check: RPC_URL accessible?

### PDS won't start
- Check: Database schema applied?
- Check: Port 4002 available?

### Gateway returns errors
- Check: Hub and PDS running?
- Check: Endpoints correct in env vars?

### Database errors
- Check: Schema applied? Run `social-schema.sql`
- Check: User has permissions?

## Next: Make It Work End-to-End

Once nodes are running:
1. Create post via PDS
2. Post propagates to Hub
3. Query via Gateway
4. See post in feed

That's the goal - forget contracts, just get the social network working!

