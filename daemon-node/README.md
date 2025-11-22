# Daemon Social Network Node

**One program to run everything!**

## Quick Start

```bash
cd daemon-node
npm install
npm run build

# Run all nodes together
npm start all -- --database "postgresql://user:pass@localhost/daemon"
```

That's it! One command runs Hub + PDS + Gateway.

## What It Does

- **Hub**: Message relay with DHT (automatic peer discovery)
- **PDS**: Personal Data Server (user accounts)
- **Gateway**: API for clients

## Commands

```bash
# Run everything (recommended)
npm start all

# Or run individually
npm start hub
npm start pds
npm start gateway
```

## With DHT (Bootstrap Nodes)

```bash
npm start all -- \
  --database "postgresql://user:pass@localhost/daemon" \
  --bootstrap "/dns4/bootstrap.daemon.social/tcp/4001/ws"
```

## Environment Variables

```bash
DATABASE_URL=postgresql://user:pass@localhost/daemon
RPC_URL=https://sepolia.base.org
```

## For Users

Users just run:
```bash
daemon-node all
```

And they're hosting a node! No need to know about Hub/PDS/Gateway - it's all automatic.
