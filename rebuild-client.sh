#!/bin/bash

echo "🔨 Rebuilding Client with Environment Variables"
echo "================================================"
echo ""

cd ~/daemon/daemon-client

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found in daemon-client/"
    echo "   Creating default .env..."
    cat > .env << 'EOF'
VITE_GATEWAY_URL=https://daemon.bushleague.xyz/api
VITE_PDS_URL=https://daemon.bushleague.xyz/xrpc
VITE_ID_REGISTRY_ADDRESS=
VITE_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
EOF
fi

echo "1️⃣  Current .env file:"
cat .env
echo ""

echo "2️⃣  Rebuilding client (this bakes env vars into the build)..."
npm run build

if [ $? -eq 0 ]; then
    echo "   ✅ Build successful"
else
    echo "   ❌ Build failed"
    exit 1
fi
echo ""

echo "3️⃣  Copying built files to web directory..."
sudo cp -r dist/* /var/www/daemon-client/
sudo chown -R www-data:www-data /var/www/daemon-client
echo "   ✅ Files deployed"
echo ""

echo "================================================"
echo "✅ Client Rebuilt and Deployed!"
echo ""
echo "🔄 Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)"
echo "   to clear cache and see the changes."
echo ""

