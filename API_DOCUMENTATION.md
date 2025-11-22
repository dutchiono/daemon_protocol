# Daemon Social Network - API Documentation

## Server Information

**Current Server:** `50.21.187.69`  
**Hostname:** `ubuntu`

---

## Hub API (Port 4001)

**Base URL:** `http://50.21.187.69:4001`

### Endpoints

#### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "nodeId": "hub-4001"
}
```

#### Submit Message
```http
POST /api/v1/messages
Content-Type: application/json
```

**Request Body:**
```json
{
  "hash": "0x1234567890abcdef...",
  "fid": 1,
  "text": "Hello, world!",
  "timestamp": 1234567890
}
```

**Response:**
```json
{
  "hash": "0x1234567890abcdef...",
  "status": "submitted"
}
```

#### Get Message
```http
GET /api/v1/messages/:hash
```

**Response:**
```json
{
  "hash": "0x1234567890abcdef...",
  "fid": 1,
  "text": "Hello, world!",
  "timestamp": 1234567890
}
```

#### Get Peers
```http
GET /api/v1/peers
```

**Response:**
```json
{
  "peers": [
    {
      "id": "12D3KooW...",
      "addresses": ["/ip4/192.168.1.100/tcp/4001/ws"]
    }
  ],
  "count": 1
}
```

### libp2p WebSocket Endpoint

**WebSocket URL:** `ws://50.21.187.69:5001`  
**Protocol:** libp2p WebSocket transport  
**Purpose:** Peer-to-peer communication, DHT queries

---

## PDS API (Port 4002) - AT Protocol Compatible

**Base URL:** `http://50.21.187.69:4002`

### Endpoints

#### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "pdsId": "pds-4002"
}
```

#### Describe Server
```http
GET /xrpc/com.atproto.server.describeServer
```

**Response:**
```json
{
  "availableUserDomains": ["pds-4002"],
  "inviteCodeRequired": false
}
```

#### Create Account
```http
POST /xrpc/com.atproto.server.createAccount
Content-Type: application/json
```

**Request Body:**
```json
{
  "handle": "username",
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "did": "did:daemon:username",
  "handle": "username"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid handle or email format
- `409 Conflict` - Handle already taken

#### Create Record
```http
POST /xrpc/com.atproto.repo.createRecord
Content-Type: application/json
```

**Request Body:**
```json
{
  "repo": "did:daemon:username",
  "collection": "app.bsky.feed.post",
  "record": {
    "$type": "app.bsky.feed.post",
    "text": "My first post!",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Response:**
```json
{
  "uri": "at://did:daemon:username/app.bsky.feed.post/abc123",
  "cid": "bafybeiabc123..."
}
```

#### List Records
```http
GET /xrpc/com.atproto.repo.listRecords
```

**Query Parameters:**
- `repo` (required) - Repository DID
- `collection` (required) - Collection name (e.g., `app.bsky.feed.post`)
- `limit` (optional, default: 50) - Number of records to return
- `cursor` (optional) - Pagination cursor

**Response:**
```json
{
  "records": [
    {
      "uri": "at://did:daemon:username/app.bsky.feed.post/abc123",
      "cid": "bafybeiabc123...",
      "value": {
        "text": "My first post!",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    }
  ],
  "cursor": "next-page-cursor"
}
```

---

## Gateway API (Port 4003)

**Base URL:** `http://50.21.187.69:4003`

### Endpoints

#### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "gatewayId": "gateway-4003"
}
```

#### Get Feed
```http
GET /api/v1/feed
```

**Query Parameters:**
- `fid` (optional) - Filter by FID (Farcaster ID)
- `type` (optional, default: `algorithmic`) - Feed type: `algorithmic`, `chronological`
- `limit` (optional, default: 50) - Number of posts to return

**Example:**
```http
GET /api/v1/feed?fid=1&type=algorithmic&limit=50
```

**Response:**
```json
{
  "posts": [
    {
      "hash": "0x123...",
      "fid": 1,
      "text": "Hello, world!",
      "timestamp": 1234567890,
      "author": {
        "fid": 1,
        "handle": "username",
        "avatar": "https://..."
      }
    }
  ],
  "count": 1
}
```

**Special Response:**
- `402 Payment Required` - For premium feed access (if x402 is enabled)

#### Create Post
```http
POST /api/v1/posts
Content-Type: application/json
```

**Request Body:**
```json
{
  "fid": 1,
  "text": "My post content",
  "parentHash": "0xabc..." // optional, for replies
}
```

**Response:**
```json
{
  "hash": "0x1234567890abcdef...",
  "fid": 1,
  "text": "My post content",
  "timestamp": 1234567890
}
```

#### Get Post
```http
GET /api/v1/posts/:hash
```

**Response:**
```json
{
  "hash": "0x1234567890abcdef...",
  "fid": 1,
  "text": "My post content",
  "timestamp": 1234567890,
  "author": {
    "fid": 1,
    "handle": "username"
  },
  "reactions": {
    "likes": 10,
    "reposts": 2
  }
}
```

---

## Error Responses

All endpoints may return standard HTTP error codes:

- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required
- `402 Payment Required` - Payment needed for premium features
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., handle taken)
- `500 Internal Server Error` - Server error

**Error Response Format:**
```json
{
  "error": "Error message description"
}
```

---

## Client Configuration

### Environment Variables

Create `.env` file in your client:

```env
VITE_GATEWAY_URL=http://50.21.187.69:4003
VITE_HUB_URL=http://50.21.187.69:4001
VITE_PDS_URL=http://50.21.187.69:4002
```

### Example: Create Account

```typescript
const response = await fetch('http://50.21.187.69:4002/xrpc/com.atproto.server.createAccount', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    handle: 'myusername',
    email: 'my@email.com',
    password: 'securepassword123'
  })
});

const account = await response.json();
console.log('Account created:', account);
```

### Example: Create Post

```typescript
const response = await fetch('http://50.21.187.69:4003/api/v1/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    fid: 1,
    text: 'Hello from the Daemon network!'
  })
});

const post = await response.json();
console.log('Post created:', post);
```

### Example: Get Feed

```typescript
const response = await fetch('http://50.21.187.69:4003/api/v1/feed?fid=1&limit=50');
const feed = await response.json();
console.log('Feed:', feed.posts);
```

---

## Rate Limiting

Currently, no rate limiting is enforced. This will be added in future updates.

## Authentication

Most endpoints are currently public. Authentication will be added for protected operations.

## CORS

CORS is enabled on Gateway endpoints. Other endpoints may require CORS configuration for web clients.

---

## Support

For issues or questions:
- Check `CLIENT_SETUP.md` for client setup instructions
- Check `PRODUCTION_CHECKLIST.md` for deployment status
- Review server logs for debugging

