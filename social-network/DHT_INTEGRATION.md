# Adding DHT for True Decentralization

## What is DHT?

**DHT (Distributed Hash Table)** = How nodes find each other automatically
- Like BitTorrent's DHT
- Like IPFS's DHT
- No central registry needed

## Current Problem

Right now, nodes need explicit peer lists:
```bash
PEERS="ws://node1.com,ws://node2.com"  # Manual configuration
```

This is **federated** (like email), not **decentralized**.

## Solution: Add libp2p DHT

### Step 1: Install DHT Module

```bash
cd social-network/hub
npm install @libp2p/kad-dht
```

### Step 2: Update Hub Configuration

```typescript
// social-network/hub/src/index.ts
import { kadDHT } from '@libp2p/kad-dht';
import { bootstrap } from '@libp2p/bootstrap';

const node = await createLibP2P({
  addresses: {
    listen: [`/ip4/0.0.0.0/tcp/${config.port}`]
  },
  transports: [webSockets()],
  connectionEncryption: [noise()],

  // Add DHT
  dht: kadDHT(),

  // Add bootstrap nodes (initial connection points)
  peerDiscovery: [
    bootstrap({
      list: [
        '/dns4/bootstrap.daemon.social/tcp/4001/ws',
        '/dns4/bootstrap2.daemon.social/tcp/4001/ws',
        // Add more bootstrap nodes
      ]
    })
  ],
});
```

### Step 3: Bootstrap Nodes

**Bootstrap nodes** = Initial connection points (like Bitcoin seed nodes)

You need to run at least one public bootstrap hub that others can connect to.

### Step 4: Node Discovery

With DHT, nodes will:
1. Connect to bootstrap node
2. Discover other nodes via DHT
3. Connect to discovered nodes
4. Share messages via gossip

## Implementation Plan

### Phase 1: Basic DHT
- Add DHT to hub
- Configure bootstrap nodes
- Test node discovery

### Phase 2: Content Addressing
- Use DHT to find content (posts by hash)
- Like IPFS content addressing

### Phase 3: Full Decentralization
- No central bootstrap needed
- Nodes discover each other organically

## Bootstrap Node Setup

Run a public bootstrap hub:

```bash
# Public bootstrap hub
HUB_PORT=4001
NODE_ID=bootstrap-1
# No PEERS needed - others connect to this one
```

Others connect to bootstrap → discover more nodes via DHT.

## Testing DHT

1. Start bootstrap hub (public)
2. Start regular hub (connects to bootstrap)
3. Start another hub (connects to bootstrap)
4. Verify hubs discover each other via DHT
5. Test message propagation

## Current Status

**DHT:** Not implemented yet (needs libp2p DHT module)
**Bootstrap:** Not set up yet
**Discovery:** Manual peer lists only

**But:** The architecture supports it - just needs DHT integration!

