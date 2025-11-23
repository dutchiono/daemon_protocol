#!/bin/bash

echo "🔧 Fixing Gateway Routes"
echo "=========================="
echo ""

echo "1️⃣  Stopping Gateway..."
pm2 stop daemon-gateway
pm2 delete daemon-gateway
echo ""

echo "2️⃣  Checking for processes on port 4003..."
lsof -ti:4003 | xargs -r kill -9 2>/dev/null || echo "   No processes found on port 4003"
echo ""

echo "3️⃣  Rebuilding Gateway..."
cd ~/daemon/social-network/gateway
npm run build
echo ""

echo "4️⃣  Starting Gateway with environment variables..."
export DATABASE_URL="${DATABASE_URL:-postgresql://daemon:daemon_password@localhost:5432/daemon}"
export GATEWAY_PORT="${GATEWAY_PORT:-4003}"
export GATEWAY_ID="${GATEWAY_ID:-gateway-1}"
export HUB_ENDPOINTS="${HUB_ENDPOINTS:-http://localhost:4001}"
export PDS_ENDPOINTS="${PDS_ENDPOINTS:-http://localhost:4002}"
export REDIS_URL="${REDIS_URL:-}"
export X402_SERVICE_URL="${X402_SERVICE_URL:-http://localhost:3000}"

cd ~/daemon
pm2 start social-network/gateway/dist/index.js --name daemon-gateway
echo ""

echo "5️⃣  Waiting for Gateway to start..."
sleep 3
echo ""

echo "6️⃣  Testing routes..."
echo ""
echo "   Health:"
curl -s http://localhost:4003/health | jq . || curl -s http://localhost:4003/health
echo ""
echo ""

echo "   Profile:"
curl -s http://localhost:4003/api/v1/profile/1 | jq . || curl -s http://localhost:4003/api/v1/profile/1
echo ""
echo ""

echo "   Notifications:"
curl -s "http://localhost:4003/api/v1/notifications/count?fid=1" | jq . || curl -s "http://localhost:4003/api/v1/notifications/count?fid=1"
echo ""
echo ""

echo "7️⃣  Gateway status:"
pm2 list | grep daemon-gateway
echo ""

echo "=========================="
echo "✅ Gateway restarted!"
echo "📊 View logs: pm2 logs daemon-gateway"
echo ""

