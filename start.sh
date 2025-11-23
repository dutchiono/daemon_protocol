#!/bin/bash

set -e

echo "🔧 UNFUCK EVERYTHING - Complete Reset & Deploy"
echo "================================================"
echo ""

# Source .env
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

# 1. NUCLEAR OPTION - Kill everything
echo "1️⃣  NUCLEAR: Stopping and killing everything..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
sleep 3

# Kill all ports aggressively
for port in 4001 4002 4003 5001; do
  for i in 1 2 3; do
    lsof -ti:$port 2>/dev/null | xargs kill -9 2>/dev/null || true
    sleep 1
  done
done
echo "   ✅ Everything killed"
echo ""

# 2. Clean builds
echo "2️⃣  Cleaning old builds..."
cd social-network/hub && rm -rf dist node_modules && cd ../..
cd social-network/pds && rm -rf dist && cd ../..
cd social-network/gateway && rm -rf dist && cd ../..
cd daemon-client && rm -rf dist node_modules && cd ..
echo "   ✅ Cleaned"
echo ""

# 3. Pull latest
echo "3️⃣  Pulling latest code..."
git pull
echo ""

# 4. Install dependencies
echo "4️⃣  Installing dependencies..."
cd social-network/hub && npm install --silent && cd ../..
cd social-network/pds && npm install --silent && cd ../..
cd social-network/gateway && npm install --silent && cd ../..
cd daemon-client && npm install --silent && cd ..
echo "   ✅ Dependencies installed"
echo ""

# 5. Build services
echo "5️⃣  Building services..."
cd social-network/hub && npm run build && cd ../..
cd social-network/pds && npm run build && cd ../..
cd social-network/gateway && npm run build && cd ../..
echo "   ✅ Services built"
echo ""

# 6. Build and deploy client
echo "6️⃣  Building and deploying client..."
cd daemon-client
npm run build
sudo rm -rf /var/www/daemon-client/* 2>/dev/null || rm -rf /var/www/daemon-client/* 2>/dev/null || true
sudo cp -r dist/* /var/www/daemon-client/ 2>/dev/null || cp -r dist/* /var/www/daemon-client/
sudo chown -R www-data:www-data /var/www/daemon-client/ 2>/dev/null || chown -R $USER:$USER /var/www/daemon-client/ 2>/dev/null || true
sudo chmod -R 755 /var/www/daemon-client/ 2>/dev/null || chmod -R 755 /var/www/daemon-client/ 2>/dev/null || true
sudo systemctl reload nginx 2>/dev/null || true
cd ..
echo "   ✅ Client deployed"
echo ""

# 7. Set env vars
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

# 8. Start everything
echo "7️⃣  Starting all services..."
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

pm2 save
sleep 8
echo ""

# 9. Test everything
echo "8️⃣  Testing services..."
HUB_OK=$(curl -s http://localhost:4001/health > /dev/null && echo "✅" || echo "❌")
PDS_OK=$(curl -s http://localhost:4002/health > /dev/null && echo "✅" || echo "❌")
GATEWAY_OK=$(curl -s http://localhost:4003/health > /dev/null && echo "✅" || echo "❌")

echo "   Hub: $HUB_OK"
echo "   PDS: $PDS_OK"
echo "   Gateway: $GATEWAY_OK"
echo ""

# 10. Show status
echo "9️⃣  Final status:"
pm2 list
echo ""

echo "================================================"
echo "✅ UNFUCK COMPLETE"
echo ""
echo "View logs: pm2 logs"
echo "View status: pm2 status"
echo ""
