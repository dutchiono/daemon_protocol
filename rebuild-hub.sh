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
echo ""

echo "3️⃣  Rebuilding Hub..."
npm run build
echo ""

if [ $? -eq 0 ]; then
  echo "✅ Build successful!"
  echo ""
  echo "4️⃣  Verifying logger service in compiled code..."
  if grep -q "services.*logger" dist/index.js 2>/dev/null; then
    echo "   ✅ Logger service found in compiled code"
  else
    echo "   ⚠️  Logger service NOT found in compiled code"
    echo "   The build may have failed silently"
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

