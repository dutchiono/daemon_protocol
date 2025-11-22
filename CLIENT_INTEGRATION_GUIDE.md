# Client Integration Guide

## Quick Start

### 1. Configure Environment

Create `.env` file in your client directory:

```env
VITE_GATEWAY_URL=http://50.21.187.69:4003
VITE_HUB_URL=http://50.21.187.69:4001
VITE_PDS_URL=http://50.21.187.69:4002
```

### 2. Install Dependencies

```bash
npm install axios  # or your preferred HTTP client
```

### 3. Use the API Client

See `API_DOCUMENTATION.md` for full endpoint details.

---

## Integration Examples

### TypeScript/JavaScript Client

```typescript
// api/client.ts
import axios from 'axios';

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'http://50.21.187.69:4003';
const PDS_URL = import.meta.env.VITE_PDS_URL || 'http://50.21.187.69:4002';

// Create account
export async function createAccount(handle: string, email: string, password: string) {
  const response = await axios.post(`${PDS_URL}/xrpc/com.atproto.server.createAccount`, {
    handle,
    email,
    password
  });
  return response.data;
}

// Create post
export async function createPost(fid: number, text: string, parentHash?: string) {
  const response = await axios.post(`${GATEWAY_URL}/api/v1/posts`, {
    fid,
    text,
    parentHash
  });
  return response.data;
}

// Get feed
export async function getFeed(fid?: number, type: string = 'algorithmic', limit: number = 50) {
  const params: any = { type, limit };
  if (fid) params.fid = fid;
  
  const response = await axios.get(`${GATEWAY_URL}/api/v1/feed`, { params });
  return response.data;
}

// Get post
export async function getPost(hash: string) {
  const response = await axios.get(`${GATEWAY_URL}/api/v1/posts/${hash}`);
  return response.data;
}
```

### React Hook Example

```typescript
// hooks/useDaemon.ts
import { useState, useEffect } from 'react';
import { getFeed, createPost } from '../api/client';

export function useFeed(fid?: number) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadFeed() {
      try {
        setLoading(true);
        const data = await getFeed(fid);
        setPosts(data.posts || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadFeed();
  }, [fid]);

  const submitPost = async (text: string) => {
    try {
      const post = await createPost(fid!, text);
      setPosts([post, ...posts]);
      return post;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return { posts, loading, error, submitPost };
}
```

### React Component Example

```tsx
// components/PostComposer.tsx
import { useState } from 'react';
import { useFeed } from '../hooks/useDaemon';

export function PostComposer({ fid }: { fid: number }) {
  const [text, setText] = useState('');
  const { submitPost } = useFeed(fid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      await submitPost(text);
      setText('');
    } catch (error) {
      console.error('Failed to post:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What's on your mind?"
        rows={4}
      />
      <button type="submit">Post</button>
    </form>
  );
}
```

---

## Account Creation Flow

### Step 1: Create Account on PDS

```typescript
const account = await createAccount(
  'myusername',
  'my@email.com',
  'securepassword123'
);
// Returns: { did: 'did:daemon:myusername', handle: 'myusername' }
```

### Step 2: Store User Session

```typescript
localStorage.setItem('userDID', account.did);
localStorage.setItem('userHandle', account.handle);
```

### Step 3: Use Account for Posts

```typescript
// Map DID to FID (if needed)
// For now, you may use a placeholder FID or handle directly
const fid = 1; // Get from your user system

const post = await createPost(fid, 'Hello, Daemon network!');
```

---

## Error Handling

```typescript
try {
  const account = await createAccount(handle, email, password);
} catch (error: any) {
  if (error.response?.status === 409) {
    console.error('Handle already taken');
  } else if (error.response?.status === 400) {
    console.error('Invalid input:', error.response.data.error);
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

---

## Server Endpoints Summary

| Service | URL | Purpose |
|---------|-----|---------|
| Gateway | `http://50.21.187.69:4003` | Main API for clients |
| PDS | `http://50.21.187.69:4002` | Account management (AT Protocol) |
| Hub | `http://50.21.187.69:4001` | Message relay and peer discovery |
| Hub WS | `ws://50.21.187.69:5001` | libp2p WebSocket (for advanced users) |

---

## Best Practices

1. **Always use environment variables** for API URLs
2. **Handle errors gracefully** - show user-friendly messages
3. **Validate input** before sending to API
4. **Use loading states** for better UX
5. **Cache responses** when appropriate
6. **Implement retry logic** for network errors

---

## Troubleshooting

### Connection Issues

- Check that `.env` file has correct server IP
- Verify server is running: `curl http://50.21.187.69:4003/health`
- Check browser console for CORS errors

### Authentication Issues

- Most endpoints are currently public (no auth required)
- Future versions will require authentication

### Rate Limiting

- Currently no rate limiting
- Implement client-side throttling if needed

---

## Next Steps

1. Read `API_DOCUMENTATION.md` for complete API reference
2. Check `PRODUCTION_CHECKLIST.md` for production readiness
3. Review `CLIENT_SETUP.md` for detailed setup instructions

