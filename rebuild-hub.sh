#!/bin/bash

echo "🔨 Rebuilding Hub"
echo "=========================="
echo ""

echo "1️⃣  Stopping Hub..."
pm2 stop daemon-hub 2>/dev/null || true
echo ""

echo "2️⃣  Cleaning old build..."
cd ~/daemon/social-network/hub
rm -rf dist
rm -rf node_modules/.cache 2>/dev/null || true
echo ""

echo "3️⃣  Rebuilding Hub..."
npm run build
echo ""

if [ $? -eq 0 ]; then
  echo "✅ Build successful!"
  echo ""
  echo "4️⃣  Verifying logger service in compiled code..."
  if grep -q "services" dist/index.js 2>/dev/null && grep -q "logger" dist/index.js 2>/dev/null; then
    echo "   ✅ Logger service found in compiled code"
  elif grep -q "identify" dist/index.js 2>/dev/null; then
    echo "   ⚠️  Identify found but logger might be missing"
    echo "   Checking for services object..."
    if grep -A 5 "services" dist/index.js 2>/dev/null | grep -q "logger"; then
      echo "   ✅ Logger service found in services object"
    else
      echo "   ❌ Logger service NOT found - showing libp2pConfig:"
      grep -A 10 "libp2pConfig" dist/index.js | head -15
    fi
  else
    echo "   ❌ Logger service NOT found in compiled code"
    echo "   Showing libp2pConfig from compiled code:"
    grep -A 10 "libp2pConfig" dist/index.js | head -15
  fi
  echo ""

  echo "5️⃣  Starting Hub..."
  cd ~/daemon
  export DATABASE_URL="${DATABASE_URL:-postgresql://daemon:daemon_password@localhost:5432/daemon}"
  pm2 start social-network/hub/dist/index.js --name daemon-hub --update-env
  sleep 2
  echo ""

  echo "6️⃣  Testing Hub..."
  sleep 2
  curl -s http://localhost:4001/health && echo "" || echo "   ❌ Hub not responding"
  echo ""

  echo "7️⃣  Hub status:"
  pm2 list | grep daemon-hub
  echo ""
else
  echo "❌ Build failed!"
  exit 1
fi

echo "=========================="
echo "✅ Hub rebuild complete!"
echo ""

