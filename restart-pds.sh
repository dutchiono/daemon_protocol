#!/bin/bash

echo "🔧 Restarting PDS"
echo "=========================="
echo ""

echo "1️⃣  Stopping PDS..."
pm2 stop daemon-pds
pm2 delete daemon-pds
echo ""

echo "2️⃣  Checking for processes on port 4002..."
lsof -ti:4002 | xargs -r kill -9 2>/dev/null || echo "   No processes found on port 4002"
echo ""

echo "3️⃣  Rebuilding PDS..."
cd ~/daemon/social-network/pds
npm run build
echo ""

echo "4️⃣  Starting PDS with environment variables..."
export PDS_PORT="${PDS_PORT:-4002}"
export PDS_ID="${PDS_ID:-pds-1}"
export DATABASE_URL="${DATABASE_URL:-postgresql://daemon:daemon_password@localhost:5432/daemon}"

cd ~/daemon
pm2 start social-network/pds/dist/index.js --name daemon-pds
echo ""

echo "5️⃣  Waiting for PDS to start..."
sleep 3
echo ""

echo "6️⃣  Testing PDS..."
echo ""
echo "   Health:"
curl -s http://localhost:4002/health || echo "   PDS not responding"
echo ""
echo ""

echo "7️⃣  PDS status:"
pm2 list | grep daemon-pds
echo ""

echo "=========================="
echo "✅ PDS restarted!"
echo "📊 View logs: pm2 logs daemon-pds"
echo ""

