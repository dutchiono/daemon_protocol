#!/bin/bash

echo "🔧 Setting Up PDS for Post Creation"
echo "===================================="
echo ""

# Check if PDS is running
echo "1️⃣  Checking PDS status..."
if pm2 list | grep -q "daemon-pds.*online"; then
    echo "   ✅ PDS is running"
else
    echo "   ❌ PDS is NOT running - starting it..."
    cd ~/daemon
    
    # Rebuild PDS if needed
    npm run build:pds
    
    # Start PDS
    cd social-network/pds
    pm2 start dist/index.js --name daemon-pds --update-env -- \
        PDS_PORT=4002 \
        PDS_ID="pds-1" \
        DATABASE_URL="postgresql://daemon:daemon_password@localhost:5432/daemon" \
        FEDERATION_PEERS="" \
        IPFS_GATEWAY="https://ipfs.io/ipfs/"
    pm2 save
    echo "   ✅ PDS started"
fi
echo ""

# Wait a moment
sleep 2

# Test PDS
echo "2️⃣  Testing PDS..."
if curl -s http://localhost:4002/health > /dev/null; then
    echo "   ✅ PDS is responding"
    curl -s http://localhost:4002/health
else
    echo "   ❌ PDS is not responding"
    echo "   Check logs: pm2 logs daemon-pds"
fi
echo ""

# Check Gateway has PDS_ENDPOINTS
echo "3️⃣  Checking Gateway PDS configuration..."
GATEWAY_ENV=$(pm2 env daemon-gateway 2>/dev/null | grep PDS_ENDPOINTS || echo "")
if [ -z "$GATEWAY_ENV" ]; then
    echo "   ⚠️  Gateway doesn't have PDS_ENDPOINTS set"
    echo "   Restarting Gateway with PDS_ENDPOINTS..."
    
    # Stop Gateway
    pm2 stop daemon-gateway
    pm2 delete daemon-gateway
    
    # Export env vars including PDS
    export GATEWAY_PORT=4003
    export GATEWAY_ID="gateway-1"
    export HUB_ENDPOINTS="http://localhost:4001"
    export PDS_ENDPOINTS="http://localhost:4002"
    export DATABASE_URL="postgresql://daemon:daemon_password@localhost:5432/daemon"
    export REDIS_URL=""
    export X402_SERVICE_URL="http://localhost:3000"
    
    # Start Gateway
    cd ~/daemon/social-network/gateway
    pm2 start dist/index.js --name daemon-gateway --update-env
    pm2 save
    
    echo "   ✅ Gateway restarted with PDS_ENDPOINTS"
else
    echo "   ✅ Gateway has PDS_ENDPOINTS: $GATEWAY_ENV"
fi
echo ""

# Wait a moment
sleep 2

# Test Gateway
echo "4️⃣  Testing Gateway..."
if curl -s http://localhost:4003/health > /dev/null; then
    echo "   ✅ Gateway is responding"
else
    echo "   ❌ Gateway is not responding"
    echo "   Check logs: pm2 logs daemon-gateway"
fi
echo ""

echo "===================================="
echo "✅ PDS Setup Complete!"
echo ""
echo "📊 Check status:"
echo "   pm2 list"
echo "   pm2 logs daemon-pds"
echo "   pm2 logs daemon-gateway"
echo ""

