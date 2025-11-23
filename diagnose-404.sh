#!/bin/bash

echo "🔍 Diagnosing 404 Errors"
echo "========================="
echo ""

echo "1️⃣  Checking Gateway status..."
pm2 list | grep daemon-gateway || echo "   ❌ Gateway not found in PM2"
echo ""

echo "2️⃣  Testing Gateway directly (bypassing nginx)..."
echo "   Health endpoint:"
curl -v http://localhost:4003/health 2>&1 | head -15
echo ""
echo "   Profile endpoint:"
curl -v http://localhost:4003/api/v1/profile/1 2>&1 | head -15
echo ""
echo "   Notifications count:"
curl -v "http://localhost:4003/api/v1/notifications/count?fid=1" 2>&1 | head -15
echo ""

echo "3️⃣  Testing through nginx..."
echo "   Health endpoint:"
curl -v https://daemon.bushleague.xyz/health 2>&1 | head -15
echo ""
echo "   Profile endpoint:"
curl -v https://daemon.bushleague.xyz/api/v1/profile/1 2>&1 | head -15
echo ""

echo "4️⃣  Checking nginx proxy config..."
sudo cat /etc/nginx/sites-available/daemon.bushleague.xyz | grep -A 10 "location /api"
echo ""

echo "5️⃣  Checking if Gateway is listening on port 4003..."
sudo ss -tlnp | grep 4003 || sudo netstat -tlnp | grep 4003 || echo "   Nothing listening on 4003"
echo ""

echo "========================="
echo "If Gateway responds on localhost:4003 but not through nginx,"
echo "the nginx proxy config is wrong."
echo ""

