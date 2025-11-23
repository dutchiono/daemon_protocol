#!/bin/bash

echo "🔍 Diagnosing Asset Issues"
echo "=========================="
echo ""

echo "1️⃣  Checking if assets exist in dist folder..."
if [ -d "daemon-client/dist/assets" ]; then
  echo "✅ Assets exist in dist folder"
  ls -la daemon-client/dist/assets/ | head -5
  echo ""
else
  echo "❌ Assets NOT found in dist folder!"
  echo "   Run: cd daemon-client && npm run build"
  exit 1
fi

echo "2️⃣  Checking if assets were copied to Nginx directory..."
if [ -d "/var/www/daemon-client/assets" ]; then
  echo "✅ Assets exist in /var/www/daemon-client/assets/"
  ls -la /var/www/daemon-client/assets/ | head -5
  echo ""
else
  echo "❌ Assets NOT found in /var/www/daemon-client/assets/"
  echo "   Run: sudo cp -r daemon-client/dist/* /var/www/daemon-client/"
  echo ""
fi

echo "3️⃣  Checking Nginx config..."
NGINX_CONFIG="/etc/nginx/sites-available/daemon.bushleague.xyz"
if [ -f "$NGINX_CONFIG" ]; then
  echo "✅ Nginx config found: $NGINX_CONFIG"
  echo ""
  echo "   Root directory:"
  grep "root " "$NGINX_CONFIG" | head -1
  echo ""
  echo "   Assets location block:"
  grep -A 5 "location /assets/" "$NGINX_CONFIG" || echo "   ❌ Assets location block NOT FOUND!"
  echo ""
else
  echo "❌ Nginx config not found!"
fi

echo "4️⃣  Testing if Nginx can access the files..."
if [ -f "/var/www/daemon-client/assets/index-Cn0al3d2.js" ]; then
  echo "✅ File exists: /var/www/daemon-client/assets/index-Cn0al3d2.js"
  echo "   File size: $(ls -lh /var/www/daemon-client/assets/index-Cn0al3d2.js | awk '{print $5}')"
  echo "   Permissions: $(ls -l /var/www/daemon-client/assets/index-Cn0al3d2.js | awk '{print $1, $3, $4}')"
else
  echo "❌ File NOT found: /var/www/daemon-client/assets/index-Cn0al3d2.js"
fi
echo ""

echo "5️⃣  Checking Nginx error logs..."
echo "   Recent errors:"
sudo tail -20 /var/log/nginx/error.log | grep -i "assets\|404" | tail -5 || echo "   No recent asset errors"
echo ""

echo "6️⃣  Testing direct file access..."
if [ -f "/var/www/daemon-client/assets/index-Cn0al3d2.js" ]; then
  echo "   Testing: curl -I http://localhost/assets/index-Cn0al3d2.js"
  curl -I http://localhost/assets/index-Cn0al3d2.js 2>&1 | head -3
else
  echo "   Cannot test - file doesn't exist"
fi
echo ""

echo "=========================="
echo "Summary:"
echo "  - Dist assets: $([ -d "daemon-client/dist/assets" ] && echo "✅" || echo "❌")"
echo "  - Nginx assets: $([ -d "/var/www/daemon-client/assets" ] && echo "✅" || echo "❌")"
echo "  - Nginx config: $([ -f "$NGINX_CONFIG" ] && echo "✅" || echo "❌")"
echo ""

