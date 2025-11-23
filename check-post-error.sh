#!/bin/bash

echo "🔍 Checking Post Creation Error"
echo "==============================="
echo ""

echo "1️⃣  Gateway logs (last 30 lines):"
pm2 logs daemon-gateway --lines 30 --nostream
echo ""

echo "2️⃣  Testing PDS directly..."
echo "   Testing createRecord endpoint:"
curl -X POST http://localhost:4002/xrpc/com.atproto.repo.createRecord \
  -H "Content-Type: application/json" \
  -d '{
    "repo": "did:daemon:1",
    "collection": "app.bsky.feed.post",
    "record": {
      "$type": "app.bsky.feed.post",
      "text": "test post",
      "createdAt": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
    }
  }' 2>&1
echo ""
echo ""

echo "3️⃣  Testing Gateway post endpoint directly:"
curl -X POST http://localhost:4003/api/v1/posts \
  -H "Content-Type: application/json" \
  -d '{
    "fid": 1,
    "text": "test post from curl"
  }' 2>&1
echo ""
echo ""

echo "4️⃣  Checking Gateway environment:"
pm2 env daemon-gateway | grep -E "PDS|GATEWAY|DATABASE" | head -10
echo ""

echo "==============================="
echo "Share the output above to debug the issue"
echo ""

