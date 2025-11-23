#!/bin/bash

echo "🔍 Full Nginx Configuration Check"
echo "=================================="
echo ""

NGINX_CONFIG="/etc/nginx/sites-available/daemon.bushleague.xyz"

if [ ! -f "$NGINX_CONFIG" ]; then
  echo "❌ Nginx config not found: $NGINX_CONFIG"
  exit 1
fi

echo "📄 Full Nginx config for daemon.bushleague.xyz:"
echo "================================================"
sudo cat "$NGINX_CONFIG"
echo ""
echo "================================================"
echo ""

echo "🔍 Key sections:"
echo ""
echo "1. Server blocks:"
grep -n "server {" "$NGINX_CONFIG" || echo "   No server blocks found"
echo ""

echo "2. Listen directives:"
grep -n "listen" "$NGINX_CONFIG" || echo "   No listen directives found"
echo ""

echo "3. Root directory:"
grep -n "root" "$NGINX_CONFIG" || echo "   No root directive found"
echo ""

echo "4. Assets location block:"
grep -A 5 -B 2 "location /assets/" "$NGINX_CONFIG" || echo "   ❌ Assets location block NOT FOUND!"
echo ""

echo "5. Redirect rules:"
grep -n "return\|rewrite" "$NGINX_CONFIG" || echo "   No redirect/rewrite rules found"
echo ""

echo "6. Testing Nginx config syntax:"
if sudo nginx -t 2>&1; then
  echo "✅ Nginx config is valid"
else
  echo "❌ Nginx config has errors!"
fi
echo ""

