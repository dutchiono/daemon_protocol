# Daemon Social Network

**Decentralized social network** combining Farcaster (Snapchain) + Bluesky (AT Protocol).

## Quick Start

### Run Node (One Command!)
```bash
cd daemon-node
npm install
npm run build
npm start all -- --database "postgresql://user:pass@localhost/daemon"
```

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

**Ready for testing!** Works without blockchain.

**For production:** Need Identity Registry contract on Optimism/Base.

See `PRODUCTION_CHECKLIST.md` for details.

## Documentation

- `docs/SNAPCHAIN_OPTIMISM.md` - Understanding the architecture
- `BLOCKCHAIN_NEEDED.md` - What blockchain things are needed
- `PRODUCTION_CHECKLIST.md` - Production readiness
- `GETTING_STARTED.md` - Quick start guide

## Key Insight

**Snapchain = Off-chain P2P network (messages)**
**Optimism = On-chain identity (FID registration)**

Messages work **without blockchain** - you only need Optimism for FID registration!
