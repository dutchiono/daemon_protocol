#!/bin/bash

echo "🔄 Restarting All Services"
echo "=========================="
echo ""

echo "1️⃣  Stopping ALL services..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
echo ""

echo "2️⃣  Killing processes on ports 4001, 4002, 4003..."
for port in 4001 4002 4003; do
  PIDS=$(lsof -ti:$port 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    echo "   Killing processes on port $port: $PIDS"
    kill -9 $PIDS 2>/dev/null || true
  else
    echo "   Port $port is free"
  fi
done
sleep 2
echo ""

echo "3️⃣  Verifying ports are free..."
for port in 4001 4002 4003; do
  if lsof -ti:$port >/dev/null 2>&1; then
    echo "   ⚠️  Port $port is still in use, force killing..."
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
done
echo ""

echo "4️⃣  Setting environment variables..."
export DATABASE_URL="${DATABASE_URL:-postgresql://daemon:daemon_password@localhost:5432/daemon}"
export GATEWAY_PORT="${GATEWAY_PORT:-4003}"
export GATEWAY_ID="${GATEWAY_ID:-gateway-1}"
export HUB_ENDPOINTS="${HUB_ENDPOINTS:-http://localhost:4001}"
export PDS_ENDPOINTS="${PDS_ENDPOINTS:-http://localhost:4002}"
export PDS_PORT="${PDS_PORT:-4002}"
export PDS_ID="${PDS_ID:-pds-1}"
export RPC_URL="${RPC_URL:-https://sepolia.base.org}"
export REDIS_URL="${REDIS_URL:-}"
export X402_SERVICE_URL="${X402_SERVICE_URL:-http://localhost:3000}"

if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL is required!"
  exit 1
fi
echo ""

echo "5️⃣  Rebuilding services..."
cd ~/daemon

echo "   Building Hub..."
cd social-network/hub
npm run build
cd ../..

echo "   Building PDS..."
cd social-network/pds
npm run build
cd ../..

echo "   Building Gateway..."
cd social-network/gateway
npm run build
cd ../..
echo ""

echo "6️⃣  Starting services..."
echo ""

echo "   Starting Hub..."
pm2 start social-network/hub/dist/index.js --name daemon-hub --update-env
sleep 2

echo "   Starting PDS..."
pm2 start social-network/pds/dist/index.js --name daemon-pds --update-env
sleep 2

echo "   Starting Gateway..."
pm2 start social-network/gateway/dist/index.js --name daemon-gateway --update-env
sleep 3
echo ""

echo "7️⃣  Service status:"
pm2 list
echo ""

echo "8️⃣  Testing services..."
echo ""
echo "   Hub health:"
curl -s http://localhost:4001/health || echo "   ❌ Hub not responding"
echo ""
echo ""

echo "   PDS health:"
curl -s http://localhost:4002/health || echo "   ❌ PDS not responding"
echo ""
echo ""

echo "   Gateway health:"
curl -s http://localhost:4003/health || echo "   ❌ Gateway not responding"
echo ""
echo ""

echo "=========================="
echo "✅ All services restarted!"
echo ""
echo "📊 View logs:"
echo "   pm2 logs daemon-hub"
echo "   pm2 logs daemon-pds"
echo "   pm2 logs daemon-gateway"
echo ""
echo "📊 View all logs:"
echo "   pm2 logs"
echo ""
