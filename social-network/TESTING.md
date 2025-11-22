# Node System Testing Guide

## Quick Start Testing

### 1. Minimal Test Setup (Single Node Each)

Test with one hub, one PDS, and one gateway:

```bash
# Terminal 1: Hub
cd social-network/hub
HUB_PORT=4001 \
DATABASE_URL=postgresql://user:pass@localhost/daemon \
RPC_URL=https://sepolia.base.org \
CHAIN_ID=84532 \
NODE_ID=hub-1 \
PEERS= \
npm run dev

# Terminal 2: PDS
cd social-network/pds
PDS_PORT=4002 \
DATABASE_URL=postgresql://user:pass@localhost/daemon \
PDS_ID=pds-1 \
FEDERATION_PEERS= \
IPFS_GATEWAY=https://ipfs.io/ipfs/ \
npm run dev

# Terminal 3: Gateway
cd social-network/gateway
GATEWAY_PORT=4003 \
GATEWAY_ID=gateway-1 \
HUB_ENDPOINTS=http://localhost:4001 \
PDS_ENDPOINTS=http://localhost:4002 \
DATABASE_URL=postgresql://user:pass@localhost/daemon \
REDIS_URL= \
X402_SERVICE_URL=http://localhost:3000 \
npm run dev
```

### 2. Test Hub

```bash
# Health check
curl http://localhost:4001/health

# Should return: {"status":"ok","nodeId":"..."}

# Get sync status
curl http://localhost:4001/api/v1/sync/status

# Get peers
curl http://localhost:4001/api/v1/peers
```

### 3. Test PDS

```bash
# Health check
curl http://localhost:4002/health

# Describe server (AT Protocol)
curl http://localhost:4002/xrpc/com.atproto.server.describeServer
```

### 4. Test Gateway

```bash
# Health check
curl http://localhost:4003/health

# Try to get feed (will get 402 without payment)
curl http://localhost:4003/api/v1/feed?fid=1
```

## Manual Testing Script

Create a test script to verify the system:

```bash
#!/bin/bash
# test-nodes.sh

echo "Testing Hub..."
curl -s http://localhost:4001/health | jq .
echo ""

echo "Testing PDS..."
curl -s http://localhost:4002/health | jq .
echo ""

echo "Testing Gateway..."
curl -s http://localhost:4003/health | jq .
echo ""

echo "Testing Gateway Feed (expect 402)..."
curl -s http://localhost:4003/api/v1/feed?fid=1 | jq .
```

## Integration Test

Test the full flow without client:

```bash
# 1. Create a test message manually
MESSAGE_HASH=$(echo -n "test-$(date +%s)" | sha256sum | cut -d' ' -f1)

# 2. Submit to hub
curl -X POST http://localhost:4001/api/v1/messages \
  -H "Content-Type: application/json" \
  -d "{
    \"hash\": \"0x$MESSAGE_HASH\",
    \"fid\": 1,
    \"text\": \"Test message\",
    \"timestamp\": $(date +%s)
  }"

# 3. Query from hub
curl http://localhost:4001/api/v1/messages/0x$MESSAGE_HASH

# 4. Query via gateway (will need payment)
curl http://localhost:4003/api/v1/posts/0x$MESSAGE_HASH
```

## Database Verification

Check that data is being stored:

```sql
-- Check messages
SELECT * FROM messages LIMIT 10;

-- Check network nodes
SELECT * FROM network_nodes;

-- Check x402 payments
SELECT * FROM x402_payments LIMIT 10;
```

## Common Issues

### Hub won't start
- Check database connection string
- Verify RPC URL is accessible
- Check port isn't already in use

### PDS won't start
- Verify database schema is applied
- Check IPFS gateway is accessible

### Gateway returns 500
- Check hub and PDS are running
- Verify database connection
- Check Redis if configured

### x402 payments fail
- Verify backend service is running
- Check RPC connection
- Verify payment recipient address

