# Quick Start Guide

## For Users - Get Started in 5 Minutes

### 1. Create an Account

```bash
curl -X POST http://50.21.187.69:4002/xrpc/com.atproto.server.createAccount \
  -H "Content-Type: application/json" \
  -d '{
    "handle": "myusername",
    "email": "my@email.com",
    "password": "securepassword123"
  }'
```

**Response:**
```json
{
  "did": "did:daemon:myusername",
  "handle": "myusername"
}
```

### 2. Create Your First Post

```bash
curl -X POST http://50.21.187.69:4003/api/v1/posts \
  -H "Content-Type: application/json" \
  -d '{
    "fid": 1,
    "text": "Hello, Daemon network! This is my first post."
  }'
```

**Response:**
```json
{
  "hash": "0x1234567890abcdef...",
  "fid": 1,
  "text": "Hello, Daemon network! This is my first post.",
  "timestamp": 1234567890
}
```

### 3. View Feed

```bash
curl "http://50.21.187.69:4003/api/v1/feed?limit=10"
```

**Response:**
```json
{
  "posts": [
    {
      "hash": "0x123...",
      "fid": 1,
      "text": "Hello, Daemon network!",
      "timestamp": 1234567890
    }
  ],
  "count": 1
}
```

---

## For Developers - Integrate the API

### 1. Configure Client

Create `.env` file:
```env
VITE_GATEWAY_URL=http://50.21.187.69:4003
VITE_PDS_URL=http://50.21.187.69:4002
VITE_HUB_URL=http://50.21.187.69:4001
```

### 2. Install Dependencies

```bash
npm install axios
```

### 3. Use the API

```typescript
import axios from 'axios';

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'http://50.21.187.69:4003';
const PDS_URL = import.meta.env.VITE_PDS_URL || 'http://50.21.187.69:4002';

// Create account
async function createAccount(handle: string, email: string, password: string) {
  const response = await axios.post(`${PDS_URL}/xrpc/com.atproto.server.createAccount`, {
    handle,
    email,
    password
  });
  return response.data;
}

// Create post
async function createPost(fid: number, text: string) {
  const response = await axios.post(`${GATEWAY_URL}/api/v1/posts`, {
    fid,
    text
  });
  return response.data;
}

// Get feed
async function getFeed(limit: number = 50) {
  const response = await axios.get(`${GATEWAY_URL}/api/v1/feed`, {
    params: { limit }
  });
  return response.data;
}
```

**See [CLIENT_INTEGRATION_GUIDE.md](CLIENT_INTEGRATION_GUIDE.md) for more examples.**

---

## Server Endpoints

| Service | URL | Purpose |
|---------|-----|---------|
| **Gateway** | `http://50.21.187.69:4003` | Main API (posts, feed) |
| **PDS** | `http://50.21.187.69:4002` | Account management |
| **Hub** | `http://50.21.187.69:4001` | Message relay |
| **Hub WS** | `ws://50.21.187.69:5001` | libp2p WebSocket |

**See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete reference.**

---

## Next Steps

1. **Read API Docs** - [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
2. **Integrate Client** - [CLIENT_INTEGRATION_GUIDE.md](CLIENT_INTEGRATION_GUIDE.md)
3. **Check Production Status** - [PRODUCTION_READY.md](PRODUCTION_READY.md)
4. **Setup Client** - [CLIENT_SETUP.md](CLIENT_SETUP.md)

---

## Support

- **API Reference:** [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **Integration Guide:** [CLIENT_INTEGRATION_GUIDE.md](CLIENT_INTEGRATION_GUIDE.md)
- **Production Status:** [PRODUCTION_READY.md](PRODUCTION_READY.md)

