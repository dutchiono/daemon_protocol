# Daemon Social Network Architecture

## Overview

The Daemon Social Network uses a hybrid architecture combining:
- **Snapchain-style hubs** for P2P message relay
- **AT Protocol-style PDS** for personal data storage
- **Gateways** for client API access
- **Fee-funded infrastructure** via Daemon Protocol

## Node Types

### 1. Hub (Message Relay)

#### Purpose
- P2P message propagation
- Message validation
- Network synchronization
- Message history storage

#### Responsibilities
- Receive messages from users/clients
- Validate message signatures
- Propagate messages to other hubs
- Sync with peer hubs
- Store message history
- Serve message queries

#### Architecture
```
Hub Node
├── Message Validator
├── Gossip Protocol
├── Sync Engine
├── Message Store (PostgreSQL/IPFS)
└── API Server (gRPC/HTTP)
```

#### Sync Protocol
- **Gossip**: Broadcast new messages to connected hubs
- **Sync Requests**: Request missing messages from peers
- **Checkpoints**: Periodic state snapshots for fast sync
- **Merkle Trees**: Efficient proof of message existence

#### Message Flow
```
User → Hub A → [Gossip] → Hub B, Hub C → [Sync] → Hub D
```

### 2. Personal Data Server (PDS)

#### Purpose
- Host user data (posts, profile, follows)
- Provide user API access
- Enable account portability
- Replicate data across instances

#### Responsibilities
- Store user's posts and data
- Serve user's data via API
- Handle account creation/migration
- Replicate data to other PDS instances
- Validate user operations

#### Architecture
```
PDS Node
├── User Data Store
├── API Server (AT Protocol compatible)
├── Replication Engine
├── Migration Handler
└── Access Control
```

#### Federation
- PDS instances federate with each other
- Cross-PDS data replication
- Account migration between PDS
- Data integrity verification

#### Account Portability
- Users can migrate between PDS
- Data follows user
- No vendor lock-in
- Seamless migration process

### 3. Gateway (API Access)

#### Purpose
- HTTP API for clients
- Data aggregation
- x402 payment integration
- Rate limiting and access control

#### Responsibilities
- Aggregate data from hubs and PDS
- Provide unified API for clients
- Handle x402 payments
- Rate limiting
- Caching and optimization

#### Architecture
```
Gateway Node
├── API Server (REST/GraphQL)
├── Aggregation Layer
├── x402 Payment Handler
├── Rate Limiter
├── Cache Layer
└── Load Balancer
```

#### API Endpoints
- `/api/v1/feed` - User feed
- `/api/v1/posts` - Post operations
- `/api/v1/profile` - User profiles
- `/api/v1/follows` - Follow operations
- `/api/v1/search` - Search functionality

## Network Topology

### Hub Network
```
        Hub A
       /  |  \
   Hub B  Hub C  Hub D
    |      |      |
  Hub E  Hub F  Hub G
```

- Fully connected graph (all hubs connect to all hubs)
- Or structured topology (hierarchical, ring, etc.)
- Automatic peer discovery
- Health monitoring and failover

### PDS Federation
```
PDS 1 ←→ PDS 2 ←→ PDS 3
  ↓        ↓        ↓
User A   User B   User C
```

- Federated network of PDS instances
- Users choose their PDS
- Data replicated across federation
- Account migration supported

### Gateway Layer
```
Client → Gateway → [Hub Network + PDS Federation]
```

- Gateways sit in front of hubs and PDS
- Provide unified API
- Handle payments and access control
- Scale horizontally

## Message Flow

### Post Creation
```
1. User creates post → Signs with Ed25519 key
2. Post sent to user's PDS
3. PDS validates and stores post
4. PDS notifies connected hubs
5. Hubs propagate to network
6. Other hubs sync message
7. Gateways aggregate for feed queries
```

### Feed Query
```
1. Client requests feed from Gateway
2. Gateway queries user's PDS for follows
3. Gateway queries hubs for followed users' posts
4. Gateway aggregates and ranks posts
5. Gateway returns feed to client
```

### Follow Operation
```
1. User follows another user
2. Follow stored in user's PDS
3. PDS replicates to federation
4. Hubs sync follow relationship
5. Feed algorithm updates
```

## Data Storage

### Hub Storage
- **Messages**: All validated messages
- **Message Index**: Hash → Message mapping
- **Sync State**: Last sync checkpoints
- **Peer State**: Connected hub information

### PDS Storage
- **User Posts**: All posts by hosted users
- **User Profile**: Profile data
- **Follows**: Follow relationships
- **Settings**: User preferences

### Storage Backends
- **PostgreSQL**: Relational data (messages, profiles, follows)
- **IPFS**: Media files, large content
- **Redis**: Caching, real-time data
- **S3/Compatible**: Backup and archival

## Network Economics

### Fee Distribution
- **Source**: Daemon Protocol swap fees
- **Recipients**: Hub operators, PDS operators, Gateway operators
- **Distribution**: Based on performance metrics
  - Uptime
  - Message throughput
  - User count (for PDS)
  - API requests served (for Gateways)

### Operator Requirements
- **Staking**: Operators stake DAEMON tokens
- **Performance**: Must meet minimum performance thresholds
- **Reputation**: Tracked on-chain
- **Slashing**: Penalties for misbehavior

## Scalability

### Horizontal Scaling
- Add more hubs for message throughput
- Add more PDS for user capacity
- Add more gateways for API capacity
- Load balancing across nodes

### Vertical Scaling
- Optimize database queries
- Implement caching layers
- Use CDN for static content
- Optimize message propagation

### Sharding (Future)
- Shard by FID ranges
- Geographic sharding
- Topic-based sharding

## Reliability

### Redundancy
- Multiple hubs for message relay
- PDS data replication
- Gateway load balancing
- Database replication

### Failover
- Automatic hub failover
- PDS migration on failure
- Gateway health checks
- Database backup and recovery

### Monitoring
- Node health monitoring
- Performance metrics
- Error tracking
- Alerting system

## Security

### Network Security
- TLS for all connections
- Message signature verification
- Rate limiting
- DDoS protection

### Data Security
- Encrypted storage
- Access control
- Audit logging
- Backup encryption

## Deployment

### Hub Deployment
- Docker containers
- Kubernetes orchestration
- Auto-scaling based on load
- Health checks and restarts

### PDS Deployment
- Per-user or shared instances
- Resource allocation
- Migration support
- Backup and recovery

### Gateway Deployment
- Load-balanced instances
- CDN integration
- Auto-scaling
- Geographic distribution

