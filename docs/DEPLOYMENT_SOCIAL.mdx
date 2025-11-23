# Social Network Deployment Guide

## Contracts to Deploy

### New Contract (Required)
1. **SocialNetworkFund** - New contract for fee distribution to network operators
   - Script: `contracts/scripts/deploy-social-network-fund.ts`
   - Requires: DAEMON token address

### Modified Contracts (May Need Updates)

**Note**: If you've already deployed these contracts, you have two options:

#### Option A: Upgrade/Update Existing Contracts
- **DaemonHook** - Add `socialNetworkFund` parameter (upgradeable, can be updated)
- **FeeSplitter** - Add `socialNetworkFund` parameter (NOT upgradeable, needs redeployment or new instance)

#### Option B: Deploy New Versions
- Deploy new FeeSplitter with socialNetworkFund parameter
- Update DaemonHook to use new FeeSplitter
- Update all references

## Deployment Steps

### 1. Deploy SocialNetworkFund

```bash
cd contracts
npx hardhat run scripts/deploy-social-network-fund.ts --network base-sepolia
```

**Required Environment Variables:**
- `DAEMON_TOKEN_ADDRESS` - Address of DAEMON token

### 2. Update FeeSplitter (If Already Deployed)

If FeeSplitter is already deployed, you need to either:

**Option A**: Deploy new FeeSplitter with socialNetworkFund:
```bash
# Update deploy-fee-splitter.ts to include socialNetworkFund parameter
npx hardhat run scripts/deploy-fee-splitter.ts --network base-sepolia
```

**Option B**: Update existing FeeSplitter (if it has setter function):
```bash
# Call setSocialNetworkFund on existing FeeSplitter
```

### 3. Update DaemonHook

Update DaemonHook to set socialNetworkFund address:

```bash
# Use update script or call setSocialNetworkFund directly
```

## Testing the Node System

### Prerequisites

1. **Database Setup**
   ```bash
   # Run database migrations
   psql -U postgres -d daemon -f backend/db/social-schema.sql
   ```

2. **Environment Variables**
   ```bash
   # Hub
   HUB_PORT=4001
   DATABASE_URL=postgresql://user:pass@localhost/daemon
   RPC_URL=https://sepolia.base.org
   CHAIN_ID=84532
   NODE_ID=hub-1
   PEERS=ws://localhost:4002  # Other hub endpoints

   # PDS
   PDS_PORT=4002
   PDS_ID=pds-1
   FEDERATION_PEERS=http://localhost:4003  # Other PDS endpoints
   IPFS_GATEWAY=https://ipfs.io/ipfs/

   # Gateway
   GATEWAY_PORT=4003
   GATEWAY_ID=gateway-1
   HUB_ENDPOINTS=http://localhost:4001
   PDS_ENDPOINTS=http://localhost:4002
   REDIS_URL=redis://localhost:6379
   X402_SERVICE_URL=http://localhost:3000
   ```

### Testing Hub

1. **Start Hub**
   ```bash
   cd social-network/hub
   npm install
   npm run dev
   ```

2. **Test Hub API**
   ```bash
   # Health check
   curl http://localhost:4001/health

   # Submit message
   curl -X POST http://localhost:4001/api/v1/messages \
     -H "Content-Type: application/json" \
     -d '{
       "hash": "0x123...",
       "fid": 1,
       "text": "Hello world",
       "timestamp": 1234567890
     }'

   # Get messages
   curl http://localhost:4001/api/v1/messages/fid/1
   ```

### Testing PDS

1. **Start PDS**
   ```bash
   cd social-network/pds
   npm install
   npm run dev
   ```

2. **Test PDS API**
   ```bash
   # Health check
   curl http://localhost:4002/health

   # Create account
   curl -X POST http://localhost:4002/xrpc/com.atproto.server.createAccount \
     -H "Content-Type: application/json" \
     -d '{
       "handle": "testuser",
       "email": "test@example.com",
       "password": "password123"
     }'

   # Create post
   curl -X POST http://localhost:4002/xrpc/com.atproto.repo.createRecord \
     -H "Content-Type: application/json" \
     -d '{
       "repo": "did:daemon:1",
       "collection": "app.bsky.feed.post",
       "record": {
         "$type": "app.bsky.feed.post",
         "text": "My first post",
         "createdAt": "2024-01-01T00:00:00Z"
       }
     }'
   ```

### Testing Gateway

1. **Start Gateway**
   ```bash
   cd social-network/gateway
   npm install
   npm run dev
   ```

2. **Test Gateway API**
   ```bash
   # Health check
   curl http://localhost:4003/health

   # Get feed (will return 402 Payment Required)
   curl http://localhost:4003/api/v1/feed?fid=1

   # With access token (after payment)
   curl http://localhost:4003/api/v1/feed?fid=1 \
     -H "x-access-token: YOUR_TOKEN"
   ```

### Testing x402 Payments

1. **Start Backend (x402 service)**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Test Payment Flow**
   ```bash
   # Get payment request
   curl http://localhost:3000/api/v1/payments/request?resource=/api/v1/feed

   # Verify payment (after making on-chain payment)
   curl -X POST http://localhost:3000/api/v1/payments/verify \
     -H "Content-Type: application/json" \
     -d '{
       "transactionHash": "0x...",
       "amount": "0.001",
       "currency": "DAEMON"
     }'
   ```

## Testing End-to-End Flow

### 1. Start All Services

```bash
# Terminal 1: Hub
cd social-network/hub && npm run dev

# Terminal 2: PDS
cd social-network/pds && npm run dev

# Terminal 3: Gateway
cd social-network/gateway && npm run dev

# Terminal 4: Backend (x402 service)
cd backend && npm run dev
```

### 2. Test Complete Flow

1. **Create Account on PDS**
2. **Create Post via PDS**
3. **Post propagates to Hub**
4. **Query Feed via Gateway** (requires x402 payment)
5. **View Post in Feed**

## Client Testing

The client (`social-client/`) is a React app but needs:

1. **Build and Run**
   ```bash
   cd social-client
   npm install
   npm run dev
   ```

2. **Configure Gateway URL**
   - Set `VITE_GATEWAY_URL=http://localhost:4003` in `.env`

3. **Connect Wallet**
   - Install MetaMask
   - Connect to Base Sepolia
   - Connect wallet in client

4. **Test Posting**
   - Create post
   - View in feed
   - Like/repost posts

## Troubleshooting

### Hub Issues
- Check database connection
- Verify RPC URL is accessible
- Check peer connections

### PDS Issues
- Verify database schema is applied
- Check federation peer endpoints
- Verify IPFS gateway

### Gateway Issues
- Check hub and PDS endpoints
- Verify Redis connection (if using)
- Check x402 service URL

### x402 Payment Issues
- Verify RPC connection
- Check payment recipient address
- Verify transaction confirmations

