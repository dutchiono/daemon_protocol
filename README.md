# Daemon Protocol

A production-grade decentralized social networking protocol combining P2P mesh networking (libp2p), AT Protocol compatibility, and Farcaster-inspired identity primitives.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Gateway       │────▶│      PDS        │────▶│      Hub        │
│   (GraphQL)     │     │  (AT Protocol)  │     │   (libp2p P2P)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                        │
        ├───────────────────────┴────────────────────────┘
        │
┌───────▼──────────────────────────────────────────────────┐
│                    PostgreSQL Database                    │
│  - Users, Messages, Reactions, Follows                   │
│  - Trending Algorithm, Feed Generation                   │
└───────────────────────────────────────────────────────────┘
```

### Components

#### Hub Service (Rust + libp2p)
P2P message propagation layer:
- **Kademlia DHT** for peer discovery
- **GossipSub** for pub/sub messaging with topic routing
- **QUIC transport** with TLS 1.3 for performance and security
- **Ed25519 signatures** for message authentication
- **Token bucket rate limiting** for spam protection
- **Prometheus metrics** for observability

#### PDS (Personal Data Server - Rust)
AT Protocol-compatible data repository:
- **DID:plc** identity resolution
- **Repository storage** with Merkle clock (CAR format)
- **XRPC API** endpoints for record operations
- **OAuth 2.0 + DPoP** authentication
- **Blob storage** with IPFS pinning
- **Event streaming** firehose for real-time sync

#### Gateway (Node.js + TypeScript)
GraphQL API aggregation layer:
- **Apollo Server 4** with federation support
- **WebSocket subscriptions** for real-time updates
- **Redis caching** with intelligent invalidation
- **DataLoader** for N+1 query optimization
- **Rate limiting** per API key
- **REST fallback** endpoints

#### Smart Contract (Solidity 0.8.20)
On-chain identity registry on Base L2:
- **FID registration** with collision-free assignment
- **Ed25519 key management** for signing operations
- **Transfer & recovery** mechanisms
- **Pause/emergency** controls
- **Foundry test suite** with 100% coverage

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- Rust 1.75+
- PostgreSQL 16
- Redis 7

### Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/iono-such-things/daemon_protocol.git
cd daemon_protocol
```

2. **Start infrastructure**
```bash
docker-compose up -d postgres redis
```

3. **Initialize database**
```bash
psql postgres://daemon:daemon_pass@localhost:5432/daemon_protocol < database/schema.sql
```

4. **Run services**

**Hub (P2P Node):**
```bash
cd services/hub
cargo run --release
```

**PDS (Data Server):**
```bash
cd services/pds
cargo run --release
```

**Gateway (GraphQL):**
```bash
cd services/gateway
npm install
npm run dev
```

5. **Access services**
- Gateway GraphQL Playground: http://localhost:4000/graphql
- Hub Metrics: http://localhost:9090/metrics
- PDS API: http://localhost:3000
- Grafana Dashboard: http://localhost:3001

### Production Deployment

```bash
docker-compose up -d
```

All services will start with:
- Prometheus metrics on `:9091`
- Grafana dashboards on `:3001`
- Jaeger tracing UI on `:16686`

## API Examples

### GraphQL Queries

**Get user feed:**
```graphql
query {
  feed(algorithm: "following", limit: 50) {
    messages {
      hash
      content {
        text
        mentions
      }
      author {
        username
        displayName
      }
      reactionCount
      createdAt
    }
    hasMore
    cursor
  }
}
```

**Create a message:**
```graphql
mutation {
  createMessage(
    text: "Hello decentralized world!"
    mentions: ["123", "456"]
  ) {
    hash
    createdAt
  }
}
```

**Subscribe to live feed:**
```graphql
subscription {
  messageFeed {
    hash
    author {
      username
    }
    content {
      text
    }
  }
}
```

### REST API

**Get user by FID:**
```bash
curl http://localhost:4000/api/user/123
```

**Upload blob:**
```bash
curl -X POST http://localhost:3000/xrpc/com.atproto.blob.upload \
  -H "Content-Type: image/png" \
  --data-binary @avatar.png
```

## Development

### Running Tests

**Rust:**
```bash
cd services/hub && cargo test
cd services/pds && cargo test
```

**TypeScript:**
```bash
cd services/gateway && npm test
```

**Solidity:**
```bash
cd contracts && forge test
```

### Code Quality

**Rust linting:**
```bash
cargo clippy -- -D warnings
cargo fmt --check
```

**TypeScript linting:**
```bash
npm run lint
npm run type-check
```

### Monitoring

- **Prometheus**: Scrapes metrics from all services
- **Grafana**: Pre-configured dashboards for system health
- **Jaeger**: Distributed tracing for request flows

Access Grafana at http://localhost:3001 (admin/admin)

## Security

- **Authentication**: OAuth 2.0 with JWT + DPoP tokens
- **Authorization**: Role-based access control (RBAC)
- **Rate Limiting**: Token bucket algorithm per peer/API key
- **Input Validation**: Zod schemas for runtime type checking
- **SQL Injection**: Prepared statements with parameterized queries
- **Key Storage**: Hardware security module (HSM) support for production

## Performance

- **Connection Pooling**: PostgreSQL max 20 connections
- **Redis Caching**: 5-minute TTL for hot data
- **DataLoader Batching**: Automatic N+1 query optimization
- **QUIC Transport**: 0-RTT connection establishment
- **Prepared Statements**: Query plan caching

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details

## Acknowledgments

- AT Protocol specification
- Farcaster protocol design
- libp2p networking stack
- Apollo GraphQL ecosystem
