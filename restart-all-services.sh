#!/bin/bash

echo "🔄 Restarting All Services with Proper Configuration"
echo "====================================================="
echo ""

cd ~/daemon

# Rebuild everything
echo "1️⃣  Rebuilding services..."
npm run build:pds
npm run build:gateway
echo "   ✅ Build complete"
echo ""

# Stop all services
echo "2️⃣  Stopping services..."
pm2 stop daemon-pds daemon-gateway 2>/dev/null || true
pm2 delete daemon-pds daemon-gateway 2>/dev/null || true
echo "   ✅ Stopped"
echo ""

# Export environment variables
echo "3️⃣  Setting environment variables..."
export DATABASE_URL="postgresql://daemon:daemon_password@localhost:5432/daemon"
export PDS_PORT=4002
export PDS_ID="pds-1"
export FEDERATION_PEERS=""
export IPFS_GATEWAY="https://ipfs.io/ipfs/"
export GATEWAY_PORT=4003
export GATEWAY_ID="gateway-1"
export HUB_ENDPOINTS="http://localhost:4001"
export PDS_ENDPOINTS="http://localhost:4002"
export REDIS_URL=""
export X402_SERVICE_URL="http://localhost:3000"

echo "   Environment variables set"
echo ""

# Start PDS
echo "4️⃣  Starting PDS..."
cd social-network/pds
pm2 start dist/index.js --name daemon-pds --update-env
pm2 save
echo "   ✅ PDS started"
echo ""

# Wait a moment
sleep 2

# Test PDS
echo "5️⃣  Testing PDS..."
if curl -s http://localhost:4002/health > /dev/null; then
    echo "   ✅ PDS is responding"
else
    echo "   ❌ PDS is not responding"
    echo "   Check logs: pm2 logs daemon-pds --lines 20"
fi
echo ""

# Start Gateway
echo "6️⃣  Starting Gateway..."
cd ../gateway
pm2 start dist/index.js --name daemon-gateway --update-env
pm2 save
echo "   ✅ Gateway started"
echo ""

# Wait a moment
sleep 2

# Test Gateway
echo "7️⃣  Testing Gateway..."
if curl -s http://localhost:4003/health > /dev/null; then
    echo "   ✅ Gateway is responding"
    curl -s http://localhost:4003/health
else
    echo "   ❌ Gateway is not responding"
    echo "   Check logs: pm2 logs daemon-gateway --lines 20"
fi
echo ""

echo "====================================================="
echo "✅ All Services Restarted!"
echo ""
echo "📊 Check status:"
echo "   pm2 list"
echo ""
echo "📋 View logs:"
echo "   pm2 logs daemon-pds"
echo "   pm2 logs daemon-gateway"
echo ""

