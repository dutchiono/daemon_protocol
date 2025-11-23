#!/bin/bash

set -e

echo "🚀 Daemon - Complete Start Script"
echo "==================================="
echo ""

# Source .env file if it exists
if [ -f .env ]; then
  echo "📄 Loading environment variables..."
  set -a
  source .env
  set +a
fi

# Stop everything
echo "1️⃣  Stopping all services..."
pm2 stop all 2>/dev/null || true
sleep 2
pm2 delete all 2>/dev/null || true
pm2 save --force 2>/dev/null || true
sleep 2

# Kill ports
echo "2️⃣  Freeing ports..."
for port in 4001 4002 4003 5001; do
  PIDS=$(lsof -ti:$port 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    echo "$PIDS" | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
done
echo "   ✅ Ports free"
echo ""

# Pull latest
echo "3️⃣  Pulling latest code..."
git pull
echo ""

# Build services
echo "4️⃣  Building services..."
cd social-network/hub && npm run build && cd ../..
cd social-network/pds && npm run build && cd ../..
cd social-network/gateway && npm run build && cd ../..
echo "   ✅ Services built"
echo ""

# Build and deploy client
echo "5️⃣  Building and deploying client..."
cd daemon-client
npm run build
sudo cp -r dist/* /var/www/daemon-client/ 2>/dev/null || cp -r dist/* /var/www/daemon-client/
sudo chown -R www-data:www-data /var/www/daemon-client/ 2>/dev/null || chown -R $USER:$USER /var/www/daemon-client/
sudo systemctl reload nginx 2>/dev/null || true
cd ..
echo "   ✅ Client deployed"
echo ""

# Set env vars
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

# Start services
echo "6️⃣  Starting services..."
pm2 start social-network/hub/dist/index.js --name daemon-hub --update-env \
  --env DATABASE_URL="$DATABASE_URL" \
  --env HUB_PORT="$HUB_PORT" \
  --env NODE_ID="$NODE_ID" \
  --env RPC_URL="$RPC_URL" \
  --env ID_REGISTRY_ADDRESS="$ID_REGISTRY_ADDRESS" \
  --env KEY_REGISTRY_ADDRESS="$KEY_REGISTRY_ADDRESS" \
  --env BOOTSTRAP_NODES="$BOOTSTRAP_NODES" \
  --env ENABLE_DHT="$ENABLE_DHT"

pm2 start social-network/pds/dist/index.js --name daemon-pds --update-env \
  --env DATABASE_URL="$DATABASE_URL" \
  --env PDS_PORT="$PDS_PORT" \
  --env PDS_ID="$PDS_ID" \
  --env RPC_URL="$RPC_URL" \
  --env ID_REGISTRY_ADDRESS="$ID_REGISTRY_ADDRESS"

pm2 start social-network/gateway/dist/index.js --name daemon-gateway --update-env \
  --env DATABASE_URL="$DATABASE_URL" \
  --env GATEWAY_PORT="$GATEWAY_PORT" \
  --env GATEWAY_ID="$GATEWAY_ID" \
  --env HUB_ENDPOINTS="$HUB_ENDPOINTS" \
  --env PDS_ENDPOINTS="$PDS_ENDPOINTS" \
  --env REDIS_URL="$REDIS_URL" \
  --env X402_SERVICE_URL="$X402_SERVICE_URL" \
  --env RPC_URL="$RPC_URL"

sleep 5
pm2 save
echo ""

# Test
echo "7️⃣  Testing services..."
curl -s http://localhost:4001/health > /dev/null && echo "   ✅ Hub" || echo "   ❌ Hub"
curl -s http://localhost:4002/health > /dev/null && echo "   ✅ PDS" || echo "   ❌ PDS"
curl -s http://localhost:4003/health > /dev/null && echo "   ✅ Gateway" || echo "   ❌ Gateway"
echo ""

echo "✅ Done! Use 'pm2 logs' to view logs"

