#!/bin/bash

echo "🔧 Complete Hub Fix"
echo "=========================="
echo ""

echo "1️⃣  Stopping Hub and freeing port 4001..."
# Stop and delete PM2 process
pm2 stop daemon-hub 2>/dev/null || true
pm2 delete daemon-hub 2>/dev/null || true
pm2 save 2>/dev/null || true

# Kill any process using port 4001
PIDS=$(lsof -ti:4001 2>/dev/null || true)
if [ -n "$PIDS" ]; then
  echo "   Killing processes on port 4001: $PIDS"
  kill -9 $PIDS 2>/dev/null || true
else
  echo "   Port 4001 is free"
fi
sleep 2

# Verify port is free
if lsof -ti:4001 >/dev/null 2>&1; then
  echo "   ⚠️  Port 4001 still in use, force killing..."
  lsof -ti:4001 | xargs kill -9 2>/dev/null || true
  sleep 1
fi
echo ""

echo "2️⃣  Pulling latest changes..."
cd ~/daemon
git pull
echo ""

echo "3️⃣  Cleaning and rebuilding Hub..."
cd ~/daemon/social-network/hub

# Clean everything
rm -rf dist
rm -rf node_modules
rm -rf src/*.js 2>/dev/null || true
rm -rf src/*.js.map 2>/dev/null || true
echo "   Cleaned old builds and node_modules"
echo ""

# Reinstall dependencies
echo "   Installing dependencies..."
npm install
echo ""

# Rebuild from TypeScript
echo "   Building from TypeScript..."
npm run build

if [ $? -ne 0 ]; then
  echo "   ❌ Build failed!"
  exit 1
fi

echo "   ✅ Build complete"
echo ""

echo "4️⃣  Verifying all required files exist..."
REQUIRED_FILES=("dist/index.js" "dist/logger.js")
MISSING=0
for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "   ✅ $file exists"
  else
    echo "   ❌ $file MISSING!"
    MISSING=1
  fi
done

if [ $MISSING -eq 1 ]; then
  echo "   ❌ Required files are missing!"
  exit 1
fi
echo ""

echo "5️⃣  Verifying logger service in dist/index.js..."
if grep -q "logger:" dist/index.js 2>/dev/null && grep -q "services:" dist/index.js 2>/dev/null; then
  echo "   ✅ Logger service found"
  echo "   Showing services section:"
  grep -A 20 "services:" dist/index.js | head -25
else
  echo "   ❌ Logger service NOT found!"
  echo "   Showing libp2pConfig:"
  grep -A 30 "libp2pConfig" dist/index.js | head -35
  exit 1
fi
echo ""

echo "6️⃣  Verifying logger import..."
if grep -q "import.*logger" dist/index.js 2>/dev/null; then
  echo "   ✅ Logger import found"
  grep "import.*logger" dist/index.js
else
  echo "   ❌ Logger import NOT found!"
  head -20 dist/index.js | grep -E "import"
  exit 1
fi
echo ""

echo "7️⃣  Starting Hub..."
cd ~/daemon
export DATABASE_URL="${DATABASE_URL:-postgresql://daemon:daemon_password@localhost:5432/daemon}"
pm2 start social-network/hub/dist/index.js --name daemon-hub --update-env
sleep 5
echo ""

echo "8️⃣  Checking Hub status..."
pm2 list | grep daemon-hub
echo ""

echo "9️⃣  Testing Hub health endpoint..."
sleep 2
if curl -s http://localhost:4001/health > /dev/null 2>&1; then
  echo "   ✅ Hub is responding!"
  curl -s http://localhost:4001/health
  echo ""
else
  echo "   ❌ Hub not responding"
  echo ""
  echo "   Recent error logs:"
  pm2 logs daemon-hub --err --lines 10 --nostream
fi
echo ""

echo "=========================="
echo "✅ Hub fix complete!"
echo ""

