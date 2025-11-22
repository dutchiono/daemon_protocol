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

Set gateway URL in `.env`:
```
VITE_GATEWAY_URL=http://localhost:4003
```

## UI/UX

Designed to match Farcaster's interface:
- Dark theme
- Sidebar navigation
- Feed layout
- Post composer
- Profile pages
