#!/bin/bash
# Update Nginx configuration to allow iframe embedding

NGINX_CONFIG="/etc/nginx/sites-available/daemon.bushleague.xyz"

if [ ! -f "$NGINX_CONFIG" ]; then
  echo "❌ Nginx config file not found at $NGINX_CONFIG"
  echo "Please provide the correct path to your Nginx configuration file"
  exit 1
fi

# Backup the original config
sudo cp "$NGINX_CONFIG" "${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"

# Check if X-Frame-Options is already set
if grep -q "X-Frame-Options" "$NGINX_CONFIG"; then
  echo "⚠️  X-Frame-Options found, updating..."
  # Remove or comment out X-Frame-Options
  sudo sed -i 's/^[[:space:]]*add_header X-Frame-Options.*$/# Allow iframe embedding\n        add_header X-Frame-Options "ALLOWALL" always;/' "$NGINX_CONFIG"
else
  echo "➕ Adding X-Frame-Options header to allow iframe embedding..."
  # Add after the server_name line or in the location block
  if grep -q "server_name.*daemon.bushleague.xyz" "$NGINX_CONFIG"; then
    # Add after server_name line
    sudo sed -i '/server_name.*daemon.bushleague.xyz/a\        # Allow iframe embedding\n        add_header X-Frame-Options "ALLOWALL" always;' "$NGINX_CONFIG"
  else
    # Add in the main location / block
    sudo sed -i '/location \/ {/a\        # Allow iframe embedding\n        add_header X-Frame-Options "ALLOWALL" always;' "$NGINX_CONFIG"
  fi
fi

# Check and update Content-Security-Policy
if grep -q "Content-Security-Policy" "$NGINX_CONFIG"; then
  echo "⚠️  Content-Security-Policy found, updating..."
  # Update CSP to allow frame-ancestors
  sudo sed -i 's/add_header Content-Security-Policy.*$/add_header Content-Security-Policy "frame-ancestors *;" always;/' "$NGINX_CONFIG"
else
  echo "➕ Adding Content-Security-Policy header to allow iframe embedding..."
  if grep -q "server_name.*daemon.bushleague.xyz" "$NGINX_CONFIG"; then
    sudo sed -i '/server_name.*daemon.bushleague.xyz/a\        # Allow iframe embedding\n        add_header Content-Security-Policy "frame-ancestors *;" always;' "$NGINX_CONFIG"
  else
    sudo sed -i '/location \/ {/a\        # Allow iframe embedding\n        add_header Content-Security-Policy "frame-ancestors *;" always;' "$NGINX_CONFIG"
  fi
fi

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
if sudo nginx -t; then
  echo "✅ Nginx configuration is valid"
  echo "🔄 Reloading Nginx..."
  sudo systemctl reload nginx
  echo "✅ Nginx reloaded - iframe embedding should now work"
else
  echo "❌ Nginx configuration test failed!"
  echo "Restoring backup..."
  sudo cp "${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)" "$NGINX_CONFIG"
  exit 1
fi

echo ""
echo "✅ Done! The site should now be embeddable in iframes."
echo "📝 Configuration changes:"
echo "   - X-Frame-Options: ALLOWALL"
echo "   - Content-Security-Policy: frame-ancestors *"

