#!/bin/bash

# Fix Nginx configuration to serve static assets correctly
# This ensures /assets/ and other static files are served before routing to the app

echo "🔧 Fixing Nginx configuration for static assets..."

# Find the Nginx config file for daemon.bushleague.xyz
NGINX_CONFIG="/etc/nginx/sites-available/daemon.bushleague.xyz"

if [ ! -f "$NGINX_CONFIG" ]; then
  # Try to find it
  NGINX_CONFIG=$(sudo find /etc/nginx -name "*daemon*" -o -name "*bushleague*" 2>/dev/null | head -1)
fi

if [ -z "$NGINX_CONFIG" ] || [ ! -f "$NGINX_CONFIG" ]; then
  echo "❌ Could not find Nginx config file"
  echo "Please provide the path to your Nginx config file"
  exit 1
fi

echo "📄 Found config: $NGINX_CONFIG"

# Create backup
sudo cp "$NGINX_CONFIG" "${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Backup created"

# Check if assets location block exists
if grep -q "location /assets/" "$NGINX_CONFIG"; then
  echo "✅ Assets location block already exists"
else
  echo "➕ Adding assets location block..."
  
  # Add assets location block before the main location / block
  # This ensures static assets are served before routing to the app
  sudo sed -i '/location \/api\//i\
    # Serve static assets\
    location /assets/ {\
        alias /var/www/daemon-client/dist/assets/;\
        expires 1y;\
        add_header Cache-Control "public, immutable";\
    }\
' "$NGINX_CONFIG"
  
  echo "✅ Assets location block added"
fi

# Test Nginx config
echo "🧪 Testing Nginx configuration..."
if sudo nginx -t; then
  echo "✅ Nginx config is valid"
  echo "🔄 Reloading Nginx..."
  sudo systemctl reload nginx
  echo "✅ Nginx reloaded"
else
  echo "❌ Nginx config test failed!"
  echo "Restoring backup..."
  sudo cp "${NGINX_CONFIG}.backup"* "$NGINX_CONFIG" 2>/dev/null || true
  exit 1
fi

echo ""
echo "✅ Done! Static assets should now be served correctly."
echo ""
echo "Next steps:"
echo "1. Rebuild the client with base: '/' (already fixed in vite.config.ts)"
echo "2. Copy the new dist folder to /var/www/daemon-client/"
echo "3. Test the site"

