#!/bin/bash

echo "🔍 Checking PDS Configuration"
echo "============================="
echo ""

echo "1️⃣  Checking if PDS is running..."
if pm2 list | grep -q "daemon-pds.*online"; then
    echo "   ✅ PDS is running"
    pm2 list | grep daemon-pds
else
    echo "   ❌ PDS is NOT running"
fi
echo ""

echo "2️⃣  Testing PDS health endpoint..."
if curl -s http://localhost:4002/health > /dev/null; then
    echo "   ✅ PDS is responding on port 4002"
    curl -s http://localhost:4002/health
else
    echo "   ❌ PDS is not responding"
fi
echo ""

echo "3️⃣  Checking Gateway environment variables..."
pm2 env daemon-gateway | grep -E "PDS|GATEWAY" || echo "   No PDS env vars found"
echo ""

echo "4️⃣  Checking what PDS endpoints Gateway has..."
echo "   Gateway should have PDS_ENDPOINTS=http://localhost:4002"
echo ""

echo "5️⃣  Testing PDS createRecord endpoint..."
curl -X POST http://localhost:4002/xrpc/com.atproto.repo.createRecord \
  -H "Content-Type: application/json" \
  -d '{
    "repo": "did:daemon:1",
    "collection": "app.bsky.feed.post",
    "record": {
      "$type": "app.bsky.feed.post",
      "text": "test",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }' 2>&1 | head -20
echo ""

echo "============================="
echo "If PDS is not running, start it:"
echo "  cd ~/daemon/social-network/pds"
echo "  pm2 start dist/index.js --name daemon-pds -- DATABASE_URL=\"postgresql://daemon:daemon_password@localhost:5432/daemon\" PDS_PORT=4002"
echo ""

