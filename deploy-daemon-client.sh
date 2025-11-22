#!/bin/bash

set -e  # Exit on error

echo "🚀 Deploying Daemon Client to daemon.bushleague.xyz"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root for nginx operations
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}⚠️  Some operations require sudo. You'll be prompted when needed.${NC}"
fi

# Step 1: Build Gateway and PDS
echo "1️⃣  Building Gateway and PDS..."
cd ~/daemon
npm run build:gateway
npm run build:pds
echo -e "${GREEN}✅ Build complete${NC}"
echo ""

# Step 2: Start Gateway and PDS with PM2
echo "2️⃣  Starting Gateway and PDS services..."

# Check if they're already running
if pm2 list | grep -q "daemon-gateway"; then
    echo "   Gateway already running, restarting..."
    pm2 restart daemon-gateway
else
    echo "   Starting Gateway..."
    cd social-network/gateway
    pm2 start dist/index.js --name daemon-gateway -- \
        GATEWAY_PORT=4003 \
        GATEWAY_ID="gateway-1" \
        HUB_ENDPOINTS="http://localhost:4001" \
        PDS_ENDPOINTS="http://localhost:4002" \
        DATABASE_URL="${DATABASE_URL:-}" \
        REDIS_URL="${REDIS_URL:-}" \
        X402_SERVICE_URL="http://localhost:3000"
    cd ../..
fi

if pm2 list | grep -q "daemon-pds"; then
    echo "   PDS already running, restarting..."
    pm2 restart daemon-pds
else
    echo "   Starting PDS..."
    cd social-network/pds
    pm2 start dist/index.js --name daemon-pds -- \
        PDS_PORT=4002 \
        PDS_ID="pds-1" \
        DATABASE_URL="${DATABASE_URL:-}" \
        FEDERATION_PEERS="" \
        IPFS_GATEWAY="https://ipfs.io/ipfs/"
    cd ../..
fi

pm2 save
echo -e "${GREEN}✅ Services started${NC}"
echo ""

# Wait a moment for services to start
sleep 2

# Verify services are running
echo "3️⃣  Verifying services..."
if curl -s http://localhost:4003/health > /dev/null; then
    echo -e "${GREEN}   ✅ Gateway is running on port 4003${NC}"
else
    echo -e "${RED}   ❌ Gateway failed to start${NC}"
    echo "   Check logs: pm2 logs daemon-gateway"
fi

if curl -s http://localhost:4002/health > /dev/null; then
    echo -e "${GREEN}   ✅ PDS is running on port 4002${NC}"
else
    echo -e "${RED}   ❌ PDS failed to start${NC}"
    echo "   Check logs: pm2 logs daemon-pds"
fi
echo ""

# Step 3: Build the client
echo "4️⃣  Building client..."
cd ~/daemon/daemon-client

# Update .env with production URLs
if [ ! -f .env ]; then
    echo "   Creating .env file..."
    cat > .env << EOF
VITE_GATEWAY_URL=https://daemon.bushleague.xyz/api
VITE_PDS_URL=https://daemon.bushleague.xyz/xrpc
VITE_ID_REGISTRY_ADDRESS=
VITE_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
EOF
else
    echo "   Updating .env file..."
    # Update URLs if they exist, otherwise add them
    if grep -q "VITE_GATEWAY_URL" .env; then
        sed -i 's|VITE_GATEWAY_URL=.*|VITE_GATEWAY_URL=https://daemon.bushleague.xyz/api|' .env
    else
        echo "VITE_GATEWAY_URL=https://daemon.bushleague.xyz/api" >> .env
    fi
    
    if grep -q "VITE_PDS_URL" .env; then
        sed -i 's|VITE_PDS_URL=.*|VITE_PDS_URL=https://daemon.bushleague.xyz/xrpc|' .env
    else
        echo "VITE_PDS_URL=https://daemon.bushleague.xyz/xrpc" >> .env
    fi
fi

npm run build
echo -e "${GREEN}✅ Client built${NC}"
echo ""

# Step 4: Create web directory
echo "5️⃣  Setting up web directory..."
CLIENT_DIR="/var/www/daemon-client"
sudo mkdir -p $CLIENT_DIR
sudo cp -r dist/* $CLIENT_DIR/
sudo chown -R www-data:www-data $CLIENT_DIR
echo -e "${GREEN}✅ Files copied to $CLIENT_DIR${NC}"
echo ""

# Step 5: Create nginx config
echo "6️⃣  Creating nginx configuration..."
NGINX_CONFIG="/etc/nginx/sites-available/daemon.bushleague.xyz"

sudo tee $NGINX_CONFIG > /dev/null << 'EOF'
# Daemon Client - daemon.bushleague.xyz
server {
    listen 80;
    server_name daemon.bushleague.xyz;

    # Redirect HTTP to HTTPS (will be handled by certbot)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name daemon.bushleague.xyz;

    ssl_certificate /etc/letsencrypt/live/bushleague.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bushleague.xyz/privkey.pem;

    root /var/www/daemon-client;
    index index.html;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Serve static files (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Gateway
    location /api/ {
        proxy_pass http://localhost:4003/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy PDS/XRPC requests
    location /xrpc/ {
        proxy_pass http://localhost:4002/xrpc/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:4003/health;
        proxy_set_header Host $host;
    }
}
EOF

echo -e "${GREEN}✅ Nginx config created${NC}"
echo ""

# Step 6: Enable site
echo "7️⃣  Enabling nginx site..."
sudo ln -sf $NGINX_CONFIG /etc/nginx/sites-enabled/
echo -e "${GREEN}✅ Site enabled${NC}"
echo ""

# Step 7: Test nginx config
echo "8️⃣  Testing nginx configuration..."
if sudo nginx -t; then
    echo -e "${GREEN}✅ Nginx config is valid${NC}"
    echo ""
    echo "9️⃣  Reloading nginx..."
    sudo systemctl reload nginx
    echo -e "${GREEN}✅ Nginx reloaded${NC}"
else
    echo -e "${RED}❌ Nginx config has errors${NC}"
    echo "   Fix the config and run: sudo nginx -t"
    exit 1
fi
echo ""

# Step 8: SSL Certificate (if needed)
echo "🔟 Setting up SSL certificate..."
if [ ! -f "/etc/letsencrypt/live/bushleague.xyz/fullchain.pem" ]; then
    echo -e "${YELLOW}⚠️  SSL certificate not found for bushleague.xyz${NC}"
    echo "   Run: sudo certbot --nginx -d daemon.bushleague.xyz"
else
    echo "   Using existing SSL certificate for bushleague.xyz"
    # Certbot should handle the subdomain automatically, but let's check
    if ! grep -q "daemon.bushleague.xyz" /etc/letsencrypt/live/bushleague.xyz/fullchain.pem 2>/dev/null; then
        echo "   Adding subdomain to certificate..."
        sudo certbot --nginx -d daemon.bushleague.xyz --expand
    fi
fi
echo ""

echo "=================================================="
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "🌐 Your client should be available at:"
echo "   https://daemon.bushleague.xyz"
echo ""
echo "📊 Check service status:"
echo "   pm2 list"
echo "   pm2 logs daemon-gateway"
echo "   pm2 logs daemon-pds"
echo ""
echo "🔍 Test endpoints:"
echo "   curl https://daemon.bushleague.xyz/health"
echo "   curl https://daemon.bushleague.xyz/api/v1/profile/1"
echo ""

