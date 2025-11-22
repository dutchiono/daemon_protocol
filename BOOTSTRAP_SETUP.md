# Bootstrap Node Setup

## YES - You Need a Bootstrap Node

**Your first node becomes the bootstrap.** Here's how:

## Step 1: Start Your First Node

```powershell
cd daemon-node
npm run dev all
```

This node (port 4001) is now your bootstrap node.

## Step 2: Get Your Node's Multiaddress

After it starts, you'll see something like:
```
Listening on: /ip4/0.0.0.0/tcp/4001/ws
```

For other nodes to connect, they need your **actual IP**:
- **Local network**: `192.168.1.X` (your local IP)
- **Internet**: Your public IP address

## Step 3: Configure Other Nodes

In `.env` file (root directory):
```env
BOOTSTRAP_PEERS=/ip4/YOUR_IP/tcp/4001/ws
```

**Example for local testing (same machine):**
```env
BOOTSTRAP_PEERS=/ip4/127.0.0.1/tcp/4001/ws
```

**Example for same network:**
```env
BOOTSTRAP_PEERS=/ip4/192.168.1.100/tcp/4001/ws
```

**Example for internet:**
```env
BOOTSTRAP_PEERS=/ip4/203.0.113.1/tcp/4001/ws
```

## Step 4: Start Additional Nodes

Other nodes will:
1. Connect to your bootstrap node
2. Discover other peers via DHT
3. Connect to all discovered peers

## How It Works

- **First node** = Bootstrap (no bootstrap needed, it IS the bootstrap)
- **Second node** = Connects to first node → Discovers it via DHT
- **Third node** = Connects to bootstrap → Discovers both nodes
- **Network grows** = All nodes find each other through DHT

## For Production

1. Deploy bootstrap node on VPS/cloud with public IP
2. Share bootstrap address with others
3. They add it to their `.env`
4. DHT network spreads automatically
