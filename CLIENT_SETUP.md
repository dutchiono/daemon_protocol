# Client Setup for Server Connection

## Current Status

✅ **Server is running** at `50.21.187.69`
- Hub: `http://50.21.187.69:4001`
- PDS: `http://50.21.187.69:4002`
- Gateway: `http://50.21.187.69:4003`

⚠️ **Client is still configured for localhost**

## Quick Setup

### 1. Configure daemon-client

Create `.env` file in `daemon-client/` directory:

```env
VITE_GATEWAY_URL=http://50.21.187.69:4003
VITE_HUB_URL=http://50.21.187.69:4001
VITE_PDS_URL=http://50.21.187.69:4002
```

### 2. Configure social-client

Create `.env` file in `social-client/` directory:

```env
VITE_GATEWAY_URL=http://50.21.187.69:4003
VITE_HUB_URL=http://50.21.187.69:4001
VITE_PDS_URL=http://50.21.187.69:4002
```

### 3. Restart Client

After creating `.env` files, restart your client dev server:

```bash
cd daemon-client  # or social-client
npm run dev
```

## Username Creation (Ready Now)

You can create a username using the PDS API:

### Option 1: Using curl (Test)

```bash
curl -X POST http://50.21.187.69:4002/xrpc/com.atproto.server.createAccount \
  -H "Content-Type: application/json" \
  -d '{
    "handle": "yourusername",
    "email": "your@email.com",
    "password": "yourpassword123"
  }'
```

### Option 2: From Client (Needs Implementation)

The client needs a signup/signin flow that calls:
- `POST http://50.21.187.69:4002/xrpc/com.atproto.server.createAccount`

## What's Ready

✅ Server nodes (Hub, PDS, Gateway)  
✅ Username creation API endpoint  
✅ Client API client code  
⚠️ Client configuration (needs .env file)  
❌ Client signup UI (needs to be built)

## Next Steps

1. **Create `.env` files** for both clients with server IP
2. **Build signup UI** in client to call PDS signup endpoint
3. **Test username creation** via curl or client UI

