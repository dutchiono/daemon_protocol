#!/bin/bash

echo "🔧 Quick Fix: Restart Gateway and Check Routes"
echo "==============================================="
echo ""

# Check if Gateway is running
if ! pm2 list | grep -q "daemon-gateway.*online"; then
    echo "❌ Gateway is not running"
    echo "   Starting Gateway..."
    cd ~/daemon
    
    # Rebuild
    npm run build:gateway
    
    # Export env vars
    export DATABASE_URL="postgresql://daemon:daemon_password@localhost:5432/daemon"
    export GATEWAY_PORT=4003
    export GATEWAY_ID="gateway-1"
    export HUB_ENDPOINTS="http://localhost:4001"
    export PDS_ENDPOINTS="http://localhost:4002"
    export REDIS_URL=""
    export X402_SERVICE_URL="http://localhost:3000"
    
    # Start
    cd social-network/gateway
    pm2 start dist/index.js --name daemon-gateway --update-env
    pm2 save
    
    sleep 3
else
    echo "✅ Gateway is running"
    echo "   Restarting to pick up changes..."
    pm2 restart daemon-gateway
    sleep 2
fi

echo ""
echo "Testing endpoints..."
echo ""

# Test profile endpoint
echo "1. Profile GET:"
curl -s http://localhost:4003/api/v1/profile/1 | head -5
echo ""
echo ""

# Test notifications count
echo "2. Notifications count:"
curl -s "http://localhost:4003/api/v1/notifications/count?fid=1"
echo ""
echo ""

# Test health
echo "3. Health:"
curl -s http://localhost:4003/health
echo ""
echo ""

echo "✅ Done! If endpoints return data, Gateway is working."
echo "   If you see errors, check: pm2 logs daemon-gateway"

