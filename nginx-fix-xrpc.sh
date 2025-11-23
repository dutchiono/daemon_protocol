#!/bin/bash
# Fix Nginx /xrpc/ proxy configuration

NGINX_CONFIG="/etc/nginx/sites-available/daemon.bushleague.xyz"

echo "Fixing Nginx /xrpc/ proxy configuration..."

# Backup current config
sudo cp "$NGINX_CONFIG" "$NGINX_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"

# Fix the proxy_pass to include /xrpc/ path
sudo sed -i 's|proxy_pass http://localhost:4002;|proxy_pass http://localhost:4002/xrpc/;|g' "$NGINX_CONFIG"

echo "✅ Updated proxy_pass to include /xrpc/ path"
echo ""
echo "Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Nginx configuration is valid"
    echo "Reloading Nginx..."
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded"
    echo ""
    echo "Test the proxy with:"
    echo "  curl https://daemon.bushleague.xyz/xrpc/com.atproto.server.describeServer"
else
    echo "❌ Nginx configuration test failed. Restore backup if needed."
    exit 1
fi

