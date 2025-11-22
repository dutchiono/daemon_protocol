# Daemon Social Network

**Decentralized social network** combining Farcaster (Snapchain) + Bluesky (AT Protocol).

## Quick Start

### Run Node (One Command!)

**First Time Setup:**
```bash
# Setup database (optional but recommended)
./scripts/setup-database.sh
# See DATABASE_SETUP.md for manual setup
```

**Run Node:**
```bash
cd daemon-node
npm install
npm run build
npm start all
```

**Note:** Database is optional. Node works without it but with limited features.

### Run Client
```bash
cd daemon-client
npm install
npm run dev
npm run electron:dev
```

## What's Included

### ✅ Node (`daemon-node`)
- Hub (P2P message relay with DHT)
- PDS (Personal Data Server)
- Gateway (API endpoint)
- **One program runs everything!**

### ✅ Client (`daemon-client`)
- Windows Electron app
- Feed, Notifications, Channels, Settings
- Wallet connection
- Farcaster-style UI

### ✅ Tests
- Unit tests
- Integration tests
- E2E tests

## Production Status

**✅ Ready for Beta Testing!**

**Current Server:** `50.21.187.69` (ubuntu)

**Services Running:**
- Hub HTTP API: `http://50.21.187.69:4001`
- PDS AT Protocol: `http://50.21.187.69:4002`
- Gateway REST API: `http://50.21.187.69:4003`
- Hub WebSocket: `ws://50.21.187.69:5001`

**Status:** Core features working. See `PRODUCTION_READY.md` for full status.

## Documentation

### For Users/Developers
- **[API Documentation](API_DOCUMENTATION.md)** - Complete API reference with all endpoints
- **[Client Integration Guide](CLIENT_INTEGRATION_GUIDE.md)** - How to integrate the API in your app
- **[Client Setup](CLIENT_SETUP.md)** - Configure clients to connect to server
- **[Production Ready](PRODUCTION_READY.md)** - Production status and readiness checklist

### For Operators
- **[Production Checklist](PRODUCTION_CHECKLIST.md)** - What's done and what's needed
- **[Bootstrap Setup](BOOTSTRAP_SETUP.md)** - Setting up bootstrap nodes
- **[Peer Discovery](PEER_DISCOVERY.md)** - How nodes discover each other

## Quick Links

- `docs/SNAPCHAIN_OPTIMISM.md` - Understanding the architecture
- `BLOCKCHAIN_NEEDED.md` - What blockchain things are needed
- `PRODUCTION_CHECKLIST.md` - Production readiness
- `GETTING_STARTED.md` - Quick start guide

## Key Insight

**Snapchain = Off-chain P2P network (messages)**
**Optimism = On-chain identity (FID registration)**

Messages work **without blockchain** - you only need Optimism for FID registration!
