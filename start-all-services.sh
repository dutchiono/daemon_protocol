#!/bin/bash

echo "🚀 Starting All Services"
echo "=========================="
echo ""

# Source .env file if it exists
if [ -f .env ]; then
  echo "📄 Loading environment variables from .env file..."
  set -a
  source .env
  set +a
  echo "✅ Environment variables loaded"
  echo ""
fi

echo "1️⃣  Stopping all services and freeing ports..."
# Stop all PM2 processes
pm2 stop all 2>/dev/null || true
sleep 2
pm2 delete all 2>/dev/null || true
pm2 save --force 2>/dev/null || true
sleep 2

# Kill any processes on ports 4001, 4002, 4003
for port in 4001 4002 4003; do
  for i in 1 2 3; do
    PIDS=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$PIDS" ]; then
      echo "   Port $port: Killing processes (attempt $i): $PIDS"
      echo "$PIDS" | xargs kill -9 2>/dev/null || true
      sleep 2
    else
      echo "   ✅ Port $port is free"
      break
    fi
  done
done

# Final verification
for port in 4001 4002 4003; do
  if lsof -ti:$port >/dev/null 2>&1; then
    echo "   ⚠️  Port $port still in use, final kill..."
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
    sleep 3
  fi
done
echo ""

echo "2️⃣  Pulling latest changes..."
cd ~/daemon
git pull
echo ""

echo "3️⃣  Rebuilding services..."
# Build Hub
echo "   Building Hub..."
cd ~/daemon/social-network/hub
rm -rf dist node_modules
npm install --silent
npm run build
if [ $? -ne 0 ]; then
  echo "   ❌ Hub build failed!"
  exit 1
fi
echo "   ✅ Hub built"

# Build PDS
echo "   Building PDS..."
cd ~/daemon/social-network/pds
rm -rf dist
npm run build
if [ $? -ne 0 ]; then
  echo "   ❌ PDS build failed!"
  exit 1
fi
echo "   ✅ PDS built"

# Build Gateway
echo "   Building Gateway..."
cd ~/daemon/social-network/gateway
rm -rf dist
npm run build
if [ $? -ne 0 ]; then
  echo "   ❌ Gateway build failed!"
  exit 1
fi
echo "   ✅ Gateway built"
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
export ID_REGISTRY_ADDRESS="${ID_REGISTRY_ADDRESS:-}"
export KEY_REGISTRY_ADDRESS="${KEY_REGISTRY_ADDRESS:-}"
export BOOTSTRAP_NODES="${BOOTSTRAP_NODES:-}"
export HUB_PORT="${HUB_PORT:-4001}"
export NODE_ID="${NODE_ID:-}"
export ENABLE_DHT="${ENABLE_DHT:-true}"
echo ""

echo "5️⃣  Starting services..."
cd ~/daemon

# Start Hub
echo "   Starting Hub..."
pm2 start social-network/hub/dist/index.js --name daemon-hub --update-env \
  --env DATABASE_URL="$DATABASE_URL" \
  --env HUB_PORT="$HUB_PORT" \
  --env NODE_ID="$NODE_ID" \
  --env RPC_URL="$RPC_URL" \
  --env ID_REGISTRY_ADDRESS="$ID_REGISTRY_ADDRESS" \
  --env KEY_REGISTRY_ADDRESS="$KEY_REGISTRY_ADDRESS" \
  --env BOOTSTRAP_NODES="$BOOTSTRAP_NODES" \
  --env ENABLE_DHT="$ENABLE_DHT"
sleep 3

# Start PDS
echo "   Starting PDS..."
pm2 start social-network/pds/dist/index.js --name daemon-pds --update-env \
  --env DATABASE_URL="$DATABASE_URL" \
  --env PDS_PORT="$PDS_PORT" \
  --env PDS_ID="$PDS_ID" \
  --env RPC_URL="$RPC_URL" \
  --env ID_REGISTRY_ADDRESS="$ID_REGISTRY_ADDRESS" \
  --env ID_REGISTRY_ADDRESS="$ID_REGISTRY_ADDRESS"
sleep 3

# Start Gateway
echo "   Starting Gateway..."
pm2 start social-network/gateway/dist/index.js --name daemon-gateway --update-env \
  --env DATABASE_URL="$DATABASE_URL" \
  --env GATEWAY_PORT="$GATEWAY_PORT" \
  --env GATEWAY_ID="$GATEWAY_ID" \
  --env HUB_ENDPOINTS="$HUB_ENDPOINTS" \
  --env PDS_ENDPOINTS="$PDS_ENDPOINTS" \
  --env REDIS_URL="$REDIS_URL" \
  --env X402_SERVICE_URL="$X402_SERVICE_URL" \
  --env RPC_URL="$RPC_URL"
sleep 3

echo ""

echo "6️⃣  Service status:"
pm2 list
echo ""

echo "7️⃣  Testing services..."
sleep 5

# Test Hub
echo "   Testing Hub..."
if curl -s http://localhost:4001/health > /dev/null 2>&1; then
  echo "   ✅ Hub is responding"
  curl -s http://localhost:4001/health | head -1
else
  echo "   ❌ Hub not responding"
fi
echo ""

# Test PDS
echo "   Testing PDS..."
if curl -s http://localhost:4002/health > /dev/null 2>&1; then
  echo "   ✅ PDS is responding"
  curl -s http://localhost:4002/health | head -1
else
  echo "   ❌ PDS not responding"
fi
echo ""

# Test Gateway
echo "   Testing Gateway..."
if curl -s http://localhost:4003/health > /dev/null 2>&1; then
  echo "   ✅ Gateway is responding"
  curl -s http://localhost:4003/health | head -1
else
  echo "   ❌ Gateway not responding"
fi
echo ""

echo "=========================="
echo "✅ All services started!"
echo ""
echo "📊 View logs:"
echo "   pm2 logs"
echo "   pm2 logs daemon-hub"
echo "   pm2 logs daemon-pds"
echo "   pm2 logs daemon-gateway"
echo ""
echo "📊 View status:"
echo "   pm2 status"
echo ""

