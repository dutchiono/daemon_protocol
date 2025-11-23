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

# 2. Clean builds - AGGRESSIVE CLEAN
echo "2️⃣  Cleaning old builds..."
# Remove all .d.ts files from src directories FIRST (before anything else)
find social-network -path "*/src/*.d.ts" -type f -delete 2>/dev/null || true
find social-network -path "*/src/*.d.ts.map" -type f -delete 2>/dev/null || true
# Now clean each service
cd social-network/hub && rm -rf dist node_modules .tsbuildinfo && cd ../..
cd social-network/pds && rm -rf dist node_modules .tsbuildinfo && cd ../..
cd social-network/gateway && rm -rf dist node_modules .tsbuildinfo && cd ../..
cd daemon-client && rm -rf dist node_modules && cd ..
# Double-check dist is gone
find social-network -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
# Final pass - remove any remaining .d.ts files
find social-network -path "*/src/*.d.ts" -type f -delete 2>/dev/null || true
echo "   ✅ Cleaned"
echo ""

# 3. Pull latest
echo "3️⃣  Pulling latest code..."
git pull
echo ""

# 3.5. Run database migrations
echo "3.5️⃣  Running database migrations..."
run_migration() {
  local migration_file=$1
  if [ -f "$migration_file" ]; then
    if [ -n "$DATABASE_URL" ]; then
      psql "$DATABASE_URL" -f "$migration_file" 2>/dev/null || \
      psql -U daemon -d daemon -f "$migration_file" 2>/dev/null || \
      echo "   ⚠️  Migration $migration_file skipped (may already be applied or DB not accessible)"
    else
      psql -U daemon -d daemon -f "$migration_file" 2>/dev/null || \
      echo "   ⚠️  Migration $migration_file skipped (DATABASE_URL not set or DB not accessible)"
    fi
  else
    echo "   ⚠️  Migration file $migration_file not found, skipping"
  fi
}

# Run FID to DID migration
run_migration "backend/db/migrate-fid-to-did.sql"

# Run votes table migration (for Reddit-style voting system)
# Use absolute path from repo root to ensure it's found
MIGRATION_FILE="backend/db/migrations/add-votes-table.sql"
if [ -f "$MIGRATION_FILE" ]; then
  run_migration "$MIGRATION_FILE"
else
  # Try alternative path
  run_migration "$(pwd)/backend/db/migrations/add-votes-table.sql"
fi

echo "   ✅ Migration check complete"
echo ""

# 4. Install dependencies
echo "4️⃣  Installing dependencies..."
cd social-network/hub && npm install --silent && cd ../..
cd social-network/pds && npm install --silent && cd ../..
cd social-network/gateway && npm install --silent && cd ../..
cd daemon-client && npm install --silent && cd ..
echo "   ✅ Dependencies installed"
echo ""

# 5. Build services - VERIFY BUILD SUCCESS
echo "5️⃣  Building services..."
cd social-network/hub && npm run build
if [ ! -f dist/index.js ]; then
  echo "   ❌ Hub build failed - dist/index.js not found"
  exit 1
fi
cd ../..

cd social-network/pds && npm run build
if [ ! -f dist/index.js ]; then
  echo "   ❌ PDS build failed - dist/index.js not found"
  exit 1
fi
# Verify the critical database.js file has the correct INSERT
if ! grep -q "INSERT INTO profiles (fid, did" dist/database.js; then
  echo "   ❌ PDS database.js missing did column in INSERT - build may be stale"
  echo "   Forcing rebuild..."
  rm -rf dist
  npm run build
fi
cd ../..

cd social-network/gateway
# CRITICAL: Remove any .d.ts files in src before building
find src -name "*.d.ts" -type f -delete 2>/dev/null || true
find src -name "*.d.ts.map" -type f -delete 2>/dev/null || true
# Verify types.ts has Vote export BEFORE building
if ! grep -q "export interface Vote" src/types.ts; then
  echo "   ❌ Vote interface missing from types.ts - this should not happen!"
  echo "   Checking types.ts content:"
  head -50 src/types.ts | tail -20
  exit 1
fi
# Now build
npm run build
if [ ! -f dist/index.js ]; then
  echo "   ❌ Gateway build failed - dist/index.js not found"
  echo "   Checking for stale .d.ts files:"
  find src -name "*.d.ts" -type f
  echo "   Removing any found and retrying..."
  find src -name "*.d.ts" -type f -delete 2>/dev/null || true
  rm -rf dist .tsbuildinfo
  npm run build
  if [ ! -f dist/index.js ]; then
    echo "   ❌ Gateway build still failed after cleanup"
    exit 1
  fi
fi
# Verify Gateway routes use :did not :fid
if grep -q "/api/v1/profile/:fid" dist/index.js; then
  echo "   ❌ Gateway still using old :fid routes - forcing rebuild..."
  rm -rf dist
  npm run build
fi
cd ../..
echo "   ✅ Services built and verified"
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
export DISABLE_X402="${DISABLE_X402:-true}"  # Disable payment middleware for development
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
  --env DISABLE_X402="$DISABLE_X402" \
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
