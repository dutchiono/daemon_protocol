#!/bin/bash

echo "🔍 Checking PDS Logs"
echo "=========================="
echo ""

echo "1️⃣  Recent error logs (last 50 lines):"
pm2 logs daemon-pds --err --lines 50 --nostream
echo ""

echo "2️⃣  Recent output logs (last 50 lines):"
pm2 logs daemon-pds --out --lines 50 --nostream
echo ""

echo "3️⃣  Testing PDS endpoints:"
echo ""
echo "   Health check:"
curl -s http://localhost:4002/health || echo "   PDS not responding"
echo ""
echo ""

echo "4️⃣  Checking if port 4002 is in use:"
lsof -i:4002 || echo "   Port 4002 is free"
echo ""

echo "5️⃣  PDS status:"
pm2 describe daemon-pds
echo ""

echo "=========================="
echo "Review the error logs above to identify the issue."
echo ""

