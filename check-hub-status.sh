#!/bin/bash

echo "🔍 Checking Hub Status"
echo "=========================="
echo ""

echo "1️⃣  PM2 Status:"
pm2 list | grep daemon-hub
echo ""

echo "2️⃣  Recent error logs (last 20 lines):"
pm2 logs daemon-hub --err --lines 20 --nostream
echo ""

echo "3️⃣  Recent output logs (last 20 lines):"
pm2 logs daemon-hub --out --lines 20 --nostream
echo ""

echo "4️⃣  Checking if port 4001 is in use:"
lsof -i:4001 || echo "   Port 4001 is free"
echo ""

echo "5️⃣  Checking compiled JS file for logger service:"
if [ -f "social-network/hub/dist/index.js" ]; then
  if grep -q "services.*logger" social-network/hub/dist/index.js 2>/dev/null; then
    echo "   ✅ Logger service found in compiled code"
  else
    echo "   ❌ Logger service NOT found in compiled code"
    echo "   Showing libp2pConfig section:"
    grep -A 20 "libp2pConfig" social-network/hub/dist/index.js | head -25
  fi
else
  echo "   ❌ Compiled file not found at social-network/hub/dist/index.js"
fi
echo ""

echo "=========================="
echo ""

