# Daemon Social Client

**Windows Electron client** - Full-featured social network app (Farcaster-style).

## Features

- ✅ **Home** - Main feed
- ✅ **Feed** - All posts
- ✅ **Notifications** - Activity feed
- ✅ **Channels** - Topic-based channels
- ✅ **Profile** - User profiles
- ✅ **Settings** - App configuration
- ✅ **Compose** - Create posts
- ✅ **Wallet** - Connect MetaMask

## Development

```bash
npm install
npm run dev
```

Then in another terminal:
```bash
npm run electron:dev
```

## Build for Windows

```bash
npm run build
npm run dist
```

Creates Windows installer in `dist/` folder.

## Usage

1. **Connect Wallet** - Click "Connect Wallet" in top bar
2. **View Feed** - See posts from followed users
3. **Create Post** - Click "Compose" button
4. **Browse Channels** - Join topic-based channels
5. **Check Notifications** - See likes, reposts, replies

## Configuration

Create `.env` file in the project root:

```env
VITE_GATEWAY_URL=http://50.21.187.69:4003
VITE_HUB_URL=http://50.21.187.69:4001
VITE_PDS_URL=http://50.21.187.69:4002
```

## Server Endpoints

**Current Server:** `50.21.187.69`

### Gateway API (Main Client API)
- Base URL: `http://50.21.187.69:4003`
- Health: `GET /health`
- Feed: `GET /api/v1/feed?fid=<fid>&type=algorithmic&limit=50`
- Create Post: `POST /api/v1/posts`
- Get Post: `GET /api/v1/posts/:hash`

### PDS API (Account Management)
- Base URL: `http://50.21.187.69:4002`
- Health: `GET /health`
- Create Account: `POST /xrpc/com.atproto.server.createAccount`
- Describe Server: `GET /xrpc/com.atproto.server.describeServer`
- Create Record: `POST /xrpc/com.atproto.repo.createRecord`
- List Records: `GET /xrpc/com.atproto.repo.listRecords`

### Hub API (Message Relay)
- Base URL: `http://50.21.187.69:4001`
- Health: `GET /health`
- Submit Message: `POST /api/v1/messages`
- Get Message: `GET /api/v1/messages/:hash`
- Get Peers: `GET /api/v1/peers`

**See `API_DOCUMENTATION.md` for complete API reference.**

**See `CLIENT_INTEGRATION_GUIDE.md` for integration examples.**

## UI/UX

Designed to match Farcaster's interface:
- Dark theme
- Sidebar navigation
- Feed layout
- Post composer
- Profile pages
