#!/bin/bash

echo "🔧 Fixing Hub Immediately"
echo "=========================="
echo ""

echo "1️⃣  Stopping Hub..."
pm2 stop daemon-hub 2>/dev/null || true
echo ""

echo "2️⃣  Pulling latest changes..."
cd ~/daemon
git pull
echo ""

echo "3️⃣  Copying fixed source to dist..."
cd ~/daemon/social-network/hub

# Ensure dist directory exists
mkdir -p dist

# Copy the fixed index.js to dist
if [ -f "src/index.js" ]; then
  cp src/index.js dist/index.js
  echo "   ✅ Copied fixed index.js to dist/"
else
  echo "   ❌ src/index.js not found!"
  exit 1
fi
echo ""

echo "4️⃣  Verifying logger service in dist/index.js..."
if grep -q "services.*logger" dist/index.js 2>/dev/null; then
  echo "   ✅ Logger service found in dist/index.js"
else
  echo "   ❌ Logger service NOT found!"
  echo "   Showing libp2pConfig:"
  grep -A 25 "libp2pConfig" dist/index.js | head -30
  exit 1
fi
echo ""

echo "5️⃣  Starting Hub..."
cd ~/daemon
export DATABASE_URL="${DATABASE_URL:-postgresql://daemon:daemon_password@localhost:5432/daemon}"
pm2 start social-network/hub/dist/index.js --name daemon-hub --update-env
sleep 3
echo ""

echo "6️⃣  Testing Hub..."
curl -s http://localhost:4001/health && echo "" || echo "   ❌ Hub not responding"
echo ""

echo "7️⃣  Hub status:"
pm2 list | grep daemon-hub
echo ""

echo "=========================="
echo "✅ Hub fix applied!"
echo ""

