# Installation Guide

## Prerequisites

- **Node.js** v20 or later
- **PostgreSQL** 14+ (optional but recommended)
- **Git**

## Quick Install (All-in-One)

```bash
# 1. Clone repository
git clone https://github.com/dutchiono/daemon_protocol.git
cd daemon

# 2. Setup database (recommended)
./scripts/setup-database.sh

# 3. Install node dependencies
cd daemon-node
npm install
npm run build

# 4. Configure environment
cp .env.example .env
# Edit .env and set DATABASE_URL if you set up database

# 5. Run node
npm start all
```

## Step-by-Step Installation

### 1. Install Node.js

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

**macOS:**
```bash
brew install node@20
```

**Windows:**
Download from: https://nodejs.org/

### 2. Install PostgreSQL (Recommended)

**Quick Setup:**
```bash
./scripts/setup-database.sh
```

**Manual Setup:**
See [DATABASE_SETUP.md](DATABASE_SETUP.md) for detailed instructions.

### 3. Install Node Dependencies

```bash
cd daemon-node
npm install
npm run build
```

### 4. Configure Environment

Create `.env` file in `daemon-node/`:

```env
# Database (optional - node works without it)
DATABASE_URL=postgresql://daemon:daemon_password@localhost:5432/daemon

# RPC URL (for blockchain interactions)
RPC_URL=https://sepolia.base.org

# Contract Addresses (if deployed)
ID_REGISTRY_ADDRESS=0x4e37C9C45579611233A25B691201d50aE8E8175A
KEY_REGISTRY_ADDRESS=0xF23DaA9d31b2A472932f5d44Fb2f0c2281d8A9f0

# Logging (optional)
LOG_LEVEL=info
ENABLE_FILE_LOGGING=true
```

### 5. Start the Node

```bash
# Run all nodes together (recommended)
npm start all

# Or run individually
npm start hub      # Port 4001
npm start pds      # Port 4002
npm start gateway  # Port 4003
```

## Verify Installation

```bash
# Test endpoints
curl http://localhost:4001/health  # Hub
curl http://localhost:4002/health  # PDS
curl http://localhost:4003/health  # Gateway

# Or run test script
node test-endpoints.js
```

## Running in Production

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start npm --name "daemon-node" -- start all
pm2 save
pm2 startup

# View logs
pm2 logs daemon-node

# Restart
pm2 restart daemon-node
```

### Using systemd

Create `/etc/systemd/system/daemon-node.service`:

```ini
[Unit]
Description=Daemon Social Network Node
After=network.target postgresql.service

[Service]
Type=simple
User=daemon
WorkingDirectory=/home/daemon/daemon/daemon-node
Environment="NODE_ENV=production"
ExecStart=/usr/bin/npm start all
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable daemon-node
sudo systemctl start daemon-node
```

## Troubleshooting

### Database Connection Issues

See [DATABASE_SETUP.md](DATABASE_SETUP.md) for troubleshooting database issues.

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :4001
sudo lsof -i :4002
sudo lsof -i :4003

# Kill process
sudo kill -9 <PID>
```

### Permission Denied

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Check file permissions
ls -la scripts/
```

## Next Steps

1. ✅ Installation complete
2. ✅ Database setup (if configured)
3. ✅ Node running
4. 📖 Read [QUICK_START.md](QUICK_START.md) to start using the API
5. 📖 Read [CLIENT_SETUP.md](CLIENT_SETUP.md) to configure clients

