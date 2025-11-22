# Getting Started with Daemon Social Network

## For Users: Run a Node

**One command to run everything:**

```bash
cd daemon-node
npm install
npm run build
npm start all -- --database "postgresql://user:pass@localhost/daemon"
```

That's it! You're now running:
- Hub (message relay with DHT)
- PDS (user data server)
- Gateway (API for clients)

## For Users: Use the Client

**Windows Electron app:**

```bash
cd daemon-client
npm install
npm run dev
npm run electron:dev
```

Or build installer:
```bash
npm run build
npm run dist
```

## What You Get

### Node (`daemon-node`)
- One program runs everything
- DHT enabled (automatic peer discovery)
- No need to know about Hub/PDS/Gateway

### Client (`daemon-client`)
- Full-featured Windows app
- Feed, notifications, channels, settings
- Wallet connection
- Post creation
- Farcaster-style UI

## Quick Test

1. **Start node:**
   ```bash
   cd daemon-node
   npm start all
   ```

2. **Start client:**
   ```bash
   cd daemon-client
   npm run electron:dev
   ```

3. **Connect wallet** → **Create post** → **See it in feed!**

That's the goal - make it work end-to-end!

