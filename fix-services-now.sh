#!/bin/bash

echo "🔧 Fixing Service Issues"
echo "========================"
echo ""

# Source .env if it exists
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

echo "1️⃣  Stopping all PM2 processes..."
pm2 stop all 2>/dev/null || true
sleep 2
pm2 delete all 2>/dev/null || true
pm2 save --force 2>/dev/null || true
sleep 2

echo ""
echo "2️⃣  Killing processes on ports 4001, 4002, 4003..."
for port in 4001 4002 4003; do
  PIDS=$(lsof -ti:$port 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    echo "   Killing processes on port $port: $PIDS"
    echo "$PIDS" | xargs kill -9 2>/dev/null || true
    sleep 2
  fi
done

# Extra aggressive cleanup for port 4001 (Hub)
echo ""
echo "3️⃣  Extra cleanup for port 4001 (Hub)..."
for i in 1 2 3; do
  PIDS=$(lsof -ti:4001 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    echo "   Attempt $i: Killing $PIDS"
    echo "$PIDS" | xargs kill -9 2>/dev/null || true
    sleep 2
  else
    echo "   ✅ Port 4001 is free"
    break
  fi
done

# Also check for libp2p port (5001)
PIDS=$(lsof -ti:5001 2>/dev/null || true)
if [ -n "$PIDS" ]; then
  echo "   Killing processes on libp2p port 5001: $PIDS"
  echo "$PIDS" | xargs kill -9 2>/dev/null || true
fi

echo ""
echo "4️⃣  Verifying ports are free..."
for port in 4001 4002 4003 5001; do
  if lsof -ti:$port >/dev/null 2>&1; then
    echo "   ❌ Port $port still in use!"
    lsof -i:$port || true
  else
    echo "   ✅ Port $port is free"
  fi
done

echo ""
echo "5️⃣  Checking environment variables..."
echo "   RPC_URL: ${RPC_URL:-❌ NOT SET}"
echo "   ID_REGISTRY_ADDRESS: ${ID_REGISTRY_ADDRESS:-❌ NOT SET}"
echo "   KEY_REGISTRY_ADDRESS: ${KEY_REGISTRY_ADDRESS:-❌ NOT SET}"
echo "   DATABASE_URL: ${DATABASE_URL:+✅ SET (hidden)}"

if [ -z "$RPC_URL" ]; then
  echo ""
  echo "⚠️  WARNING: RPC_URL is not set!"
  echo "   Gateway needs RPC_URL to connect to the blockchain."
  echo "   Add it to your .env file: RPC_URL=https://sepolia.base.org"
fi

echo ""
echo "6️⃣  Rebuilding services..."
cd "$(dirname "$0")"

echo "   Building Hub..."
cd social-network/hub
npm run build
if [ $? -ne 0 ]; then
  echo "   ❌ Hub build failed!"
  exit 1
fi
cd ../..

echo "   Building PDS..."
cd social-network/pds
npm run build
if [ $? -ne 0 ]; then
  echo "   ❌ PDS build failed!"
  exit 1
fi
cd ../..

echo "   Building Gateway..."
cd social-network/gateway
npm run build
if [ $? -ne 0 ]; then
  echo "   ❌ Gateway build failed!"
  exit 1
fi
cd ../..

echo ""
echo "7️⃣  Starting services with start-all-services.sh..."
echo "   (This will start all services with proper environment variables)"
echo ""
./start-all-services.sh

echo ""
echo "✅ Done! Check service status with: pm2 status"
echo "   View logs with: pm2 logs"

