#!/bin/bash

echo "🔪 Killing processes on port 4003"
echo "=========================="
echo ""

echo "1️⃣  Finding processes on port 4003..."
PIDS=$(lsof -ti:4003 2>/dev/null || true)

if [ -z "$PIDS" ]; then
  echo "   ✅ No processes found on port 4003"
  exit 0
fi

echo "   Found processes: $PIDS"
echo ""

echo "2️⃣  Stopping PM2 Gateway..."
pm2 stop daemon-gateway 2>/dev/null || true
pm2 delete daemon-gateway 2>/dev/null || true
sleep 1
echo ""

echo "3️⃣  Killing processes..."
for PID in $PIDS; do
  echo "   Killing PID $PID..."
  kill -9 $PID 2>/dev/null || true
done

sleep 2

echo ""
echo "4️⃣  Verifying port is free..."
if lsof -ti:4003 >/dev/null 2>&1; then
  echo "   ⚠️  Port 4003 is still in use!"
  echo "   Trying force kill..."
  lsof -ti:4003 | xargs kill -9 2>/dev/null || true
  sleep 1
fi

if lsof -ti:4003 >/dev/null 2>&1; then
  echo "   ❌ Port 4003 is still in use after kill attempts"
  echo "   You may need to manually investigate:"
  echo "   sudo lsof -i:4003"
  exit 1
else
  echo "   ✅ Port 4003 is now free"
fi

echo ""
echo "=========================="
echo "✅ Done! Port 4003 is free."
echo ""

