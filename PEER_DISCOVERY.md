# How Nodes Talk to Each Other (No Ngrok Needed!)

## Current Setup

Your nodes use **libp2p DHT** for peer discovery - no ngrok or port forwarding needed for local testing!

## How It Works

### 1. **Local Network (Same Computer)**
When running multiple nodes on the same machine:
- Nodes connect via `localhost` or `127.0.0.1`
- No external setup needed
- Just use different ports (4001, 4002, 4003, etc.)

### 2. **Same Network (Different Computers)**
If you have nodes on different computers on the same WiFi/LAN:
- Use the computer's local IP address (e.g., `192.168.1.100`)
- Nodes can discover each other via DHT
- No port forwarding needed

### 3. **Internet (Different Networks)**
For nodes on different networks/internet:
- **Option A: Bootstrap Nodes** (Recommended)
  - Set up public bootstrap nodes
  - Other nodes connect to bootstrap nodes
  - DHT helps them find each other

- **Option B: Direct Connection**
  - One node needs a public IP or port forwarding
  - Other nodes connect directly to that IP
  - Works like a seed node

## Current Configuration

Your nodes are configured with:
- **DHT enabled** - Automatic peer discovery
- **Bootstrap nodes** - Optional, for initial connections
- **WebSocket transport** - Works over HTTP/HTTPS

## Testing Locally

Right now, all your nodes are on the same machine:
- Hub: `http://localhost:4001`
- PDS: `http://localhost:4002`
- Gateway: `http://localhost:4003`

They automatically connect to each other via `localhost`.

## Connecting to Other Nodes

### Method 1: Bootstrap Nodes (Best for Production)

1. Set up a public bootstrap node (one node with public IP)
2. Add it to your `.env`:
   ```
   BOOTSTRAP_PEERS=/ip4/your-public-ip/tcp/4001/ws
   ```
3. Other nodes will discover peers through the bootstrap node

### Method 2: Direct Peer List

Add peers manually in `.env`:
```
HUB_PEERS=/ip4/192.168.1.100/tcp/4001/ws,/ip4/192.168.1.101/tcp/4001/ws
```

### Method 3: DHT Discovery (Automatic)

With DHT enabled, nodes will:
1. Connect to bootstrap nodes (if configured)
2. Use DHT to discover other peers
3. Automatically connect to discovered peers

## No Ngrok Needed!

You don't need ngrok because:
- ✅ DHT handles peer discovery automatically
- ✅ Bootstrap nodes provide initial connections
- ✅ WebSocket transport works over standard HTTP ports
- ✅ Nodes can connect directly via IP addresses

## Next Steps

1. **Fix the transport error** (we're working on this)
2. **Test local connections** - All nodes on same machine
3. **Add bootstrap nodes** - For internet-wide discovery
4. **Deploy public nodes** - For others to connect to

