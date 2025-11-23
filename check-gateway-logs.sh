#!/bin/bash

echo "🔍 Checking Gateway Logs"
echo "=========================="
echo ""

echo "1️⃣  Recent error logs (last 50 lines):"
pm2 logs daemon-gateway --err --lines 50 --nostream
echo ""

echo "2️⃣  Recent output logs (last 50 lines):"
pm2 logs daemon-gateway --out --lines 50 --nostream
echo ""

echo "3️⃣  Testing Gateway endpoints:"
echo ""
echo "   Health:"
curl -s http://localhost:4003/health
echo ""
echo ""

echo "   Profile:"
curl -s http://localhost:4003/api/v1/profile/1
echo ""
echo ""

echo "   Notifications:"
curl -s "http://localhost:4003/api/v1/notifications/count?fid=1"
echo ""
echo ""

echo "4️⃣  Checking if port 4003 is in use:"
lsof -i:4003 || echo "   Port 4003 is free"
echo ""

echo "=========================="
echo "If Gateway keeps restarting, check the error logs above."
echo ""
