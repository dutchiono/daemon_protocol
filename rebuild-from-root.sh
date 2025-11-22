#!/bin/bash

echo "🔨 Rebuilding Client from Root Directory"
echo "========================================="
echo ""

# Make sure we're in the daemon root
if [ ! -d "daemon-client" ]; then
    echo "❌ daemon-client directory not found"
    echo "   Run this from the daemon root directory"
    exit 1
fi

cd daemon-client

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found, creating default..."
    cat > .env << 'EOF'
VITE_GATEWAY_URL=https://daemon.bushleague.xyz/api
VITE_PDS_URL=https://daemon.bushleague.xyz/xrpc
VITE_ID_REGISTRY_ADDRESS=
VITE_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
EOF
fi

echo "1️⃣  Current .env:"
cat .env
echo ""

echo "2️⃣  Building client..."
npm run build

if [ $? -eq 0 ]; then
    echo "   ✅ Build successful"
else
    echo "   ❌ Build failed"
    exit 1
fi
echo ""

echo "3️⃣  Deploying to web directory..."
sudo cp -r dist/* /var/www/daemon-client/
sudo chown -R www-data:www-data /var/www/daemon-client
echo "   ✅ Deployed"
echo ""

echo "✅ Done! Hard refresh your browser (Ctrl+Shift+R)"

