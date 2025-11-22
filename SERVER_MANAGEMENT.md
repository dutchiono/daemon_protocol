# Server Management Guide

## Quick Commands

### Update Server (Recommended)

```bash
# Pull latest code, check dependencies, restart service
./scripts/update-server.sh
```

This script:
1. ✅ Pulls latest code from git
2. ✅ Checks and updates database if needed
3. ✅ Installs/updates npm dependencies
4. ✅ Builds the project if needed
5. ✅ Restarts the service (PM2 or systemd)

### Start Server

```bash
# First-time setup and start
./scripts/start-server.sh
```

### Restart Server

```bash
# Quick restart (no updates)
./scripts/restart-server.sh
```

### Check Server Status

```bash
# View status of all services
./scripts/server-status.sh
```

## Manual Update Flow

If you prefer to update manually:

```bash
# 1. Pull latest code
git pull

# 2. Update database (if schema changed)
./scripts/setup-database.sh

# 3. Install dependencies (if package.json changed)
cd daemon-node
npm install

# 4. Build (if source code changed)
npm run build

# 5. Restart service
./scripts/restart-server.sh
```

## Using PM2

### Setup PM2 (First Time)

```bash
# Install PM2 globally
npm install -g pm2

# Start server with PM2
cd daemon-node
pm2 start npm --name daemon-node -- start all

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions it prints
```

### PM2 Commands

```bash
# View status
pm2 status

# View logs
pm2 logs daemon-node
pm2 logs daemon-node --lines 100

# Restart
pm2 restart daemon-node

# Stop
pm2 stop daemon-node

# Stop and remove
pm2 delete daemon-node

# Monitor
pm2 monit
```

## Using systemd

Create service file at `/etc/systemd/system/daemon-node.service`:

```ini
[Unit]
Description=Daemon Social Network Node
After=network.target postgresql.service

[Service]
Type=simple
User=daemon
WorkingDirectory=/home/daemon/daemon/daemon-node
Environment="NODE_ENV=production"
Environment="DATABASE_URL=postgresql://daemon:password@localhost:5432/daemon"
ExecStart=/usr/bin/npm start all
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Then:

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service
sudo systemctl enable daemon-node

# Start service
sudo systemctl start daemon-node

# View logs
sudo journalctl -u daemon-node -f

# Restart
sudo systemctl restart daemon-node
```

## Environment Variables

Make sure your `.env` file is in the `daemon-node/` directory:

```env
DATABASE_URL=postgresql://daemon:password@localhost:5432/daemon
RPC_URL=https://sepolia.base.org
LOG_LEVEL=info
ENABLE_FILE_LOGGING=true
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
pm2 logs daemon-node
# OR
sudo journalctl -u daemon-node -n 50

# Check if ports are in use
sudo ss -tlnp | grep -E ':(4001|4002|4003)'

# Check Node.js version
node --version  # Should be v20+
```

### Port Already in Use

```bash
# Find what's using the port
sudo lsof -i :4001
sudo lsof -i :4002
sudo lsof -i :4003

# Kill the process
sudo kill -9 <PID>
```

### Database Connection Failed

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check database exists
psql -U postgres -l | grep daemon

# Test connection
psql -U daemon -d daemon -h localhost -c "SELECT 1;"
```

## One-Line Update

For quick updates, you can create an alias:

```bash
# Add to ~/.bashrc or ~/.zshrc
alias daemon-update='cd ~/daemon && ./scripts/update-server.sh'

# Then just run:
daemon-update
```

