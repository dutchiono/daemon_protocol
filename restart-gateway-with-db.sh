#!/bin/bash

echo "🔄 Restarting Gateway with Database Configuration"
echo "=================================================="
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

# Start Gateway with DATABASE_URL
echo "3️⃣  Starting Gateway with DATABASE_URL..."
cd social-network/gateway
pm2 start dist/index.js --name daemon-gateway --update-env -- \
    GATEWAY_PORT=4003 \
    GATEWAY_ID="gateway-1" \
    HUB_ENDPOINTS="http://localhost:4001" \
    PDS_ENDPOINTS="http://localhost:4002" \
    DATABASE_URL="postgresql://daemon:daemon_password@localhost:5432/daemon" \
    REDIS_URL="" \
    X402_SERVICE_URL="http://localhost:3000"

pm2 save
echo "   ✅ Gateway started"
echo ""

# Wait a moment
sleep 2

# Check status
echo "4️⃣  Checking Gateway status..."
pm2 list | grep daemon-gateway
echo ""

# Test health endpoint
echo "5️⃣  Testing Gateway..."
if curl -s http://localhost:4003/health > /dev/null; then
    echo "   ✅ Gateway is responding"
    curl -s http://localhost:4003/health | jq . || curl -s http://localhost:4003/health
else
    echo "   ❌ Gateway is not responding"
    echo "   Check logs: pm2 logs daemon-gateway"
fi
echo ""

echo "=================================================="
echo "✅ Gateway Restarted!"
echo ""
echo "📊 View logs: pm2 logs daemon-gateway"
echo ""

