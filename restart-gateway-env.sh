#!/bin/bash

echo "🔄 Restarting Gateway with Environment Variables"
echo "================================================"
echo ""

# Rebuild Gateway
echo "1️⃣  Rebuilding Gateway..."
cd ~/daemon
npm run build:gateway
echo "   ✅ Build complete"
echo ""

# Stop existing Gateway
echo "2️⃣  Stopping Gateway..."
pm2 stop daemon-gateway 2>/dev/null || true
pm2 delete daemon-gateway 2>/dev/null || true
echo "   ✅ Stopped"
echo ""

# Export environment variables
echo "3️⃣  Setting environment variables..."
export GATEWAY_PORT=4003
export GATEWAY_ID="gateway-1"
export HUB_ENDPOINTS="http://localhost:4001"
export PDS_ENDPOINTS="http://localhost:4002"
export DATABASE_URL="postgresql://daemon:daemon_password@localhost:5432/daemon"
export REDIS_URL=""
export X402_SERVICE_URL="http://localhost:3000"

echo "   DATABASE_URL is set"
echo ""

# Start Gateway
echo "4️⃣  Starting Gateway..."
cd social-network/gateway
pm2 start dist/index.js --name daemon-gateway --update-env

pm2 save
echo "   ✅ Gateway started"
echo ""

# Wait a moment
sleep 3

# Check status
echo "5️⃣  Checking Gateway status..."
pm2 list | grep daemon-gateway
echo ""

# Test health endpoint
echo "6️⃣  Testing Gateway..."
if curl -s http://localhost:4003/health > /dev/null; then
    echo "   ✅ Gateway is responding"
    curl -s http://localhost:4003/health
else
    echo "   ❌ Gateway is not responding"
    echo "   Check logs: pm2 logs daemon-gateway --lines 20"
fi
echo ""

echo "=================================================="
echo "✅ Done!"
echo ""
echo "📊 View logs: pm2 logs daemon-gateway"
echo ""

