#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting Deployment..."

# 1. Install Node.js 20
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js is already installed"
fi

# 2. Install PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
else
    echo "✅ PM2 is already installed"
fi

# 3. Clone/Update Repo
REPO_DIR="daemon"
if [ -d "$REPO_DIR" ]; then
    echo "🔄 Updating repository..."
    cd $REPO_DIR
    git pull
else
    echo "📥 Cloning repository..."
    # NOTE: Using HTTPS for easier cloning without SSH keys on server
    git clone https://github.com/dutchiono/daemon_protocol.git $REPO_DIR 
    cd $REPO_DIR
fi

# 4. Setup Daemon Node
echo "⚙️  Setting up Daemon Node..."
cd daemon-node

# Create .env if missing
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    # Get Public IP
    PUBLIC_IP=$(curl -s ifconfig.me)
    echo "BOOTSTRAP_PEERS=/ip4/$PUBLIC_IP/tcp/4001/ws" > .env
    echo "PORT=4001" >> .env
    echo "RPC_PORT=5001" >> .env
fi

# Install & Build
echo "📦 Installing dependencies..."
npm install
echo "🔨 Building..."
npm run build

# 5. Start with PM2
echo "🚀 Starting Node..."
pm2 delete farcaster-node 2>/dev/null || true
pm2 start dist/index.js --name "farcaster-node"

echo "✅ Deployment Complete!"
echo "   Public IP: $(curl -s ifconfig.me)"
echo "   Monitor logs with: pm2 logs farcaster-node"
