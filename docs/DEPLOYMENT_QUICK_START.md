# Quick Start: What Contracts Go to Testnet

## Answer: Only ONE New Contract Needs Deployment

### ✅ Deploy This:
1. **SocialNetworkFund** - NEW contract
   ```bash
   cd contracts
   npx hardhat run scripts/deploy-social-network-fund.ts --network base-sepolia
   ```

### ⚠️ Update These (If Already Deployed):

If you've already deployed DaemonHook and FeeSplitter:

1. **FeeSplitter** - Needs redeployment with `socialNetworkFund` parameter
   - Option A: Deploy new FeeSplitter (if nothing depends on old address)
   - Option B: Use `setSocialNetworkFund()` function (if contract has it)

2. **DaemonHook** - Can be updated via `setSocialNetworkFund()` function
   - No redeployment needed (it's upgradeable)

## Deployment Order

```bash
# 1. Deploy SocialNetworkFund (NEW)
npx hardhat run scripts/deploy-social-network-fund.ts --network base-sepolia

# 2. If FeeSplitter not deployed yet, deploy it with socialNetworkFund
npx hardhat run scripts/deploy-fee-splitter.ts --network base-sepolia

# 3. Update DaemonHook to set socialNetworkFund
# (Use upgrade script or call setSocialNetworkFund directly)
```

## Testing Node System (No Client Needed)

### Step 1: Setup Database
```bash
psql -U postgres -d daemon -f backend/db/social-schema.sql
```

### Step 2: Start Nodes (3 terminals)

**Terminal 1 - Hub:**
```bash
cd social-network/hub
npm install
HUB_PORT=4001 \
DATABASE_URL=postgresql://user:pass@localhost/daemon \
RPC_URL=https://sepolia.base.org \
CHAIN_ID=84532 \
NODE_ID=hub-1 \
PEERS= \
npm run dev
```

**Terminal 2 - PDS:**
```bash
cd social-network/pds
npm install
PDS_PORT=4002 \
DATABASE_URL=postgresql://user:pass@localhost/daemon \
PDS_ID=pds-1 \
FEDERATION_PEERS= \
IPFS_GATEWAY=https://ipfs.io/ipfs/ \
npm run dev
```

**Terminal 3 - Gateway:**
```bash
cd social-network/gateway
npm install
GATEWAY_PORT=4003 \
GATEWAY_ID=gateway-1 \
HUB_ENDPOINTS=http://localhost:4001 \
PDS_ENDPOINTS=http://localhost:4002 \
DATABASE_URL=postgresql://user:pass@localhost/daemon \
REDIS_URL= \
X402_SERVICE_URL=http://localhost:3000 \
npm run dev
```

### Step 3: Test with curl (No Client Needed)

```bash
# Test Hub
curl http://localhost:4001/health

# Test PDS
curl http://localhost:4002/health

# Test Gateway
curl http://localhost:4003/health

# Test creating a post (via PDS)
curl -X POST http://localhost:4002/xrpc/com.atproto.repo.createRecord \
  -H "Content-Type: application/json" \
  -d '{
    "repo": "did:daemon:1",
    "collection": "app.bsky.feed.post",
    "record": {
      "$type": "app.bsky.feed.post",
      "text": "Test post",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }'

# Test getting feed (will return 402 - that's expected!)
curl http://localhost:4003/api/v1/feed?fid=1
```

## About the Client

The client (`social-client/`) exists but needs:
- Wallet connection working
- FID mapping from wallet address
- x402 payment flow implemented

For now, you can test everything via curl/API calls without the client.

## Summary

**Contracts to Deploy:**
- ✅ SocialNetworkFund (new)
- ⚠️ FeeSplitter (if not deployed, or redeploy with socialNetworkFund)
- ⚠️ DaemonHook (just update, no redeploy needed)

**Testing:**
- Use curl commands to test nodes
- No client needed for basic testing
- See `social-network/TESTING.md` for detailed test scripts

