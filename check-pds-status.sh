#!/bin/bash
# Check PDS service status and connectivity

echo "🔍 Checking PDS Service Status..."
echo ""

# Check if PDS is running via PM2
echo "1️⃣  PM2 Status:"
pm2 list | grep daemon-pds || echo "   ❌ PDS not found in PM2"

echo ""
echo "2️⃣  PDS Process:"
ps aux | grep "daemon-pds\|node.*pds" | grep -v grep || echo "   ❌ No PDS process found"

echo ""
echo "3️⃣  Port 4002:"
if lsof -i :4002 > /dev/null 2>&1; then
    echo "   ✅ Port 4002 is in use:"
    lsof -i :4002
else
    echo "   ❌ Port 4002 is NOT in use"
fi

echo ""
echo "4️⃣  Direct PDS Health Check:"
curl -s http://localhost:4002/health || echo "   ❌ Cannot reach PDS on localhost:4002"

echo ""
echo "5️⃣  Direct PDS XRPC Endpoint:"
curl -s http://localhost:4002/xrpc/com.atproto.server.describeServer || echo "   ❌ Cannot reach PDS XRPC endpoint"

echo ""
echo "6️⃣  PM2 Logs (last 20 lines):"
pm2 logs daemon-pds --lines 20 --nostream || echo "   ❌ Cannot get PM2 logs"

echo ""
echo "7️⃣  Environment Variables:"
pm2 env daemon-pds | grep -E "PORT|PDS_PORT|DATABASE_URL|ID_REGISTRY" || echo "   ⚠️  Could not get env vars"

