#!/bin/bash

echo "🔍 Checking Gateway Logs and Status"
echo "====================================="
echo ""

echo "1️⃣  PM2 Status:"
pm2 list | grep daemon-gateway
echo ""

echo "2️⃣  Recent Gateway Logs (last 50 lines):"
pm2 logs daemon-gateway --lines 50 --nostream
echo ""

echo "3️⃣  Checking if port 4003 is listening:"
sudo netstat -tulpn | grep 4003 || echo "   ❌ Nothing listening on port 4003"
echo ""

echo "4️⃣  Testing Gateway directly:"
curl -v http://localhost:4003/health 2>&1 | head -20
echo ""

echo "5️⃣  Checking Gateway process:"
ps aux | grep "gateway" | grep -v grep
echo ""

echo "====================================="
echo "If Gateway crashed, check the error above"
echo "Common issues:"
echo "- Database connection failed"
echo "- Missing environment variables"
echo "- Port already in use"
echo ""

