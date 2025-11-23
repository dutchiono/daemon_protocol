#!/bin/bash

echo "🔍 Checking Gateway Routes"
echo "=========================="
echo ""

echo "1️⃣  Gateway logs (errors):"
pm2 logs daemon-gateway --err --lines 30 --nostream
echo ""

echo "2️⃣  Gateway logs (output):"
pm2 logs daemon-gateway --out --lines 30 --nostream
echo ""

echo "3️⃣  Testing all endpoints:"
echo ""
echo "   Health:"
curl -s http://localhost:4003/health
echo ""
echo ""

echo "   Profile GET:"
curl -s http://localhost:4003/api/v1/profile/1
echo ""
echo ""

echo "   Notifications count:"
curl -s "http://localhost:4003/api/v1/notifications/count?fid=1"
echo ""
echo ""

echo "4️⃣  Checking if routes are registered..."
echo "   This will show what routes Express has registered"
echo "   (We need to check the code to see if setupAPI is being called)"
echo ""

echo "=========================="
echo "If routes return 404, Gateway routes aren't being registered."
echo "Check if setupAPI() is being called in the logs above."
echo ""

