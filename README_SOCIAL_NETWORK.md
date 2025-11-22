# Daemon Social Network - Quick Reference

## The Big Picture

**You're building a decentralized social network** that works like:
- **Farcaster** (hub-based message relay)
- **Bluesky** (PDS for user data)
- **Combined** = Best of both worlds

## Key Insight: No Contracts Required!

The social network works **completely off-chain**:
- ✅ Posts, feeds, follows work without blockchain
- ✅ Nodes communicate via HTTP/WebSocket
- ✅ Contracts are optional (for funding/identity)

## The 3 Node Types

1. **Hub** - Message relay (like Farcaster)
2. **PDS** - User data storage (like Bluesky)
3. **Gateway** - API for clients

## How to Test

1. **Start nodes** (see `social-network/START_NODES.md`)
2. **Start monitor** (see `monitoring/README.md`)
3. **Create post** via PDS API
4. **View feed** via Gateway API

## Decentralization Status

**Current:** Federated (nodes connect to known peers)
**Future:** Fully decentralized (DHT for discovery)

**Ready for wild?** Almost - needs:
- Better node discovery
- Identity system (optional)
- Content addressing (IPFS)

But core functionality works NOW!

## Monitoring

Run the monitor to see all nodes:
```bash
cd monitoring
npm start
# Open http://localhost:4000
```

## What You Don't Need

- ❌ Blockchain deployment (for basic functionality)
- ❌ Contracts (for basic functionality)
- ❌ Optimism/Base (it's off-chain!)
- ❌ Central server (nodes are independent)

## What You Do Need

- ✅ PostgreSQL database
- ✅ Node.js
- ✅ Three terminals (or PM2)
- ✅ That's it!

The network is **ready to test** - just start the nodes!

