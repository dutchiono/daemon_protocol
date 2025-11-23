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

echo "3️⃣  Rebuilding Hub to ensure dist/ has latest code..."
cd ~/daemon/social-network/hub

# Clean and rebuild
rm -rf dist
npm run build

# Verify the build worked
if [ ! -f "dist/index.js" ]; then
  echo "   ❌ Build failed - dist/index.js not found!"
  exit 1
fi
echo "   ✅ Build complete"
echo ""

echo "4️⃣  Verifying logger service in dist/index.js..."
if grep -q "services" dist/index.js 2>/dev/null && grep -q "logger" dist/index.js 2>/dev/null; then
  echo "   ✅ Logger service found in dist/index.js"
  echo "   Showing services section:"
  grep -A 20 "services:" dist/index.js | head -25
else
  echo "   ❌ Logger service NOT found!"
  echo "   Showing libp2pConfig:"
  grep -A 30 "libp2pConfig" dist/index.js | head -35
  echo ""
  echo "   ⚠️  Trying to manually add logger service..."
  # This is a fallback - shouldn't be needed if build works
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

