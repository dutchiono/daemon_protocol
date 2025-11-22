#!/bin/bash

echo "🔧 Fixing API Proxy Configuration"
echo "=================================="
echo ""

# Check if Gateway is running
echo "1️⃣  Checking if Gateway is running..."
if pm2 list | grep -q "daemon-gateway.*online"; then
    echo "   ✅ Gateway is running"
    pm2 list | grep daemon-gateway
else
    echo "   ❌ Gateway is NOT running"
    echo "   Starting Gateway..."
    cd ~/daemon/social-network/gateway
    pm2 start dist/index.js --name daemon-gateway -- \
        GATEWAY_PORT=4003 \
        GATEWAY_ID="gateway-1" \
        HUB_ENDPOINTS="http://localhost:4001" \
        PDS_ENDPOINTS="http://localhost:4002" \
        DATABASE_URL="${DATABASE_URL:-}" \
        REDIS_URL="${REDIS_URL:-}" \
        X402_SERVICE_URL="http://localhost:3000"
    pm2 save
    echo "   ✅ Gateway started"
fi
echo ""

# Check if PDS is running
echo "2️⃣  Checking if PDS is running..."
if pm2 list | grep -q "daemon-pds.*online"; then
    echo "   ✅ PDS is running"
    pm2 list | grep daemon-pds
else
    echo "   ❌ PDS is NOT running"
    echo "   Starting PDS..."
    cd ~/daemon/social-network/pds
    pm2 start dist/index.js --name daemon-pds -- \
        PDS_PORT=4002 \
        PDS_ID="pds-1" \
        DATABASE_URL="${DATABASE_URL:-}" \
        FEDERATION_PEERS="" \
        IPFS_GATEWAY="https://ipfs.io/ipfs/"
    pm2 save
    echo "   ✅ PDS started"
fi
echo ""

# Wait a moment for services to start
sleep 2

# Test if services are responding
echo "3️⃣  Testing services..."
if curl -s http://localhost:4003/health > /dev/null; then
    echo "   ✅ Gateway is responding on port 4003"
else
    echo "   ❌ Gateway is not responding"
    echo "   Check logs: pm2 logs daemon-gateway"
fi

if curl -s http://localhost:4002/health > /dev/null; then
    echo "   ✅ PDS is responding on port 4002"
else
    echo "   ❌ PDS is not responding"
    echo "   Check logs: pm2 logs daemon-pds"
fi
echo ""

# Check nginx proxy config
echo "4️⃣  Checking nginx proxy configuration..."
NGINX_CONFIG="/etc/nginx/sites-available/daemon.bushleague.xyz"

# Fix the proxy_pass - remove /api/ from proxy_pass since location already has it
echo "   Updating nginx config..."
sudo sed -i 's|proxy_pass http://localhost:4003/api/;|proxy_pass http://localhost:4003;|' $NGINX_CONFIG

# Also fix xrpc proxy
sudo sed -i 's|proxy_pass http://localhost:4002/xrpc/;|proxy_pass http://localhost:4002;|' $NGINX_CONFIG

echo "   ✅ Nginx config updated"
echo ""

# Test nginx config
echo "5️⃣  Testing nginx configuration..."
if sudo nginx -t; then
    echo "   ✅ Nginx config is valid"
    echo ""
    echo "6️⃣  Reloading nginx..."
    sudo systemctl reload nginx
    echo "   ✅ Nginx reloaded"
else
    echo "   ❌ Nginx config has errors"
    exit 1
fi
echo ""

echo "=========================================="
echo "✅ API Proxy Fixed!"
echo ""
echo "🔍 Test endpoints:"
echo "   curl https://daemon.bushleague.xyz/health"
echo "   curl https://daemon.bushleague.xyz/api/v1/profile/1"
echo "   curl https://daemon.bushleague.xyz/api/v1/notifications/count?fid=1"
echo ""

