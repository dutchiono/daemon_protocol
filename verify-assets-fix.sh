#!/bin/bash

echo "🔍 Verifying Nginx Assets Fix"
echo "=============================="
echo ""

NGINX_CONFIG="/etc/nginx/sites-available/daemon.bushleague.xyz"

echo "1️⃣  Checking Nginx config alias path..."
if grep -q "alias /var/www/daemon-client/assets/" "$NGINX_CONFIG"; then
  echo "✅ Alias path is CORRECT: /var/www/daemon-client/assets/"
elif grep -q "alias /var/www/daemon-client/dist/assets/" "$NGINX_CONFIG"; then
  echo "❌ Alias path is still WRONG: /var/www/daemon-client/dist/assets/"
  echo "   Run: ./fix-nginx-assets.sh"
else
  echo "⚠️  Could not find assets location block"
fi
echo ""

echo "2️⃣  Testing asset file access via Nginx..."
echo "   Testing: curl -I http://localhost/assets/index-Cn0al3d2.js"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/assets/index-Cn0al3d2.js)
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Assets are accessible via Nginx (HTTP $HTTP_CODE)"
else
  echo "❌ Assets NOT accessible (HTTP $HTTP_CODE)"
  echo "   Check Nginx error logs: sudo tail -20 /var/log/nginx/error.log"
fi
echo ""

echo "3️⃣  Checking if files exist in correct location..."
if [ -f "/var/www/daemon-client/assets/index-Cn0al3d2.js" ]; then
  echo "✅ Asset file exists: /var/www/daemon-client/assets/index-Cn0al3d2.js"
  echo "   Size: $(ls -lh /var/www/daemon-client/assets/index-Cn0al3d2.js | awk '{print $5}')"
else
  echo "❌ Asset file NOT found!"
  echo "   Run: cd daemon-client && npm run build"
  echo "   Then: sudo cp -r dist/* /var/www/daemon-client/"
fi
echo ""

echo "=============================="
if [ "$HTTP_CODE" = "200" ] && [ -f "/var/www/daemon-client/assets/index-Cn0al3d2.js" ]; then
  echo "✅ Everything looks good! Assets should be loading."
else
  echo "⚠️  Issues detected. Check the output above."
fi
echo ""

