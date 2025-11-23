#!/bin/bash

echo "🔍 Testing Assets with HTTPS"
echo "============================"
echo ""

echo "1️⃣  Testing asset access via HTTPS..."
echo "   Testing: curl -I https://daemon.bushleague.xyz/assets/index-Cn0al3d2.js"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://daemon.bushleague.xyz/assets/index-Cn0al3d2.js)
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Assets are accessible via HTTPS (HTTP $HTTP_CODE)"
  echo ""
  echo "   Full response headers:"
  curl -I https://daemon.bushleague.xyz/assets/index-Cn0al3d2.js 2>&1 | head -10
elif [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
  echo "⚠️  Got redirect (HTTP $HTTP_CODE)"
  echo "   Checking redirect location..."
  curl -I https://daemon.bushleague.xyz/assets/index-Cn0al3d2.js 2>&1 | grep -i "location" || true
else
  echo "❌ Assets NOT accessible (HTTP $HTTP_CODE)"
  echo "   Check Nginx error logs: sudo tail -20 /var/log/nginx/error.log"
fi
echo ""

echo "2️⃣  Testing CSS asset..."
CSS_FILE=$(ls /var/www/daemon-client/assets/*.css 2>/dev/null | head -1 | xargs basename 2>/dev/null || echo "")
if [ -n "$CSS_FILE" ]; then
  echo "   Testing: https://daemon.bushleague.xyz/assets/$CSS_FILE"
  CSS_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://daemon.bushleague.xyz/assets/$CSS_FILE)
  if [ "$CSS_CODE" = "200" ]; then
    echo "✅ CSS asset accessible (HTTP $CSS_CODE)"
  else
    echo "❌ CSS asset NOT accessible (HTTP $CSS_CODE)"
  fi
else
  echo "⚠️  No CSS file found to test"
fi
echo ""

echo "3️⃣  Checking Nginx config for redirects..."
NGINX_CONFIG="/etc/nginx/sites-available/daemon.bushleague.xyz"
if grep -q "return 301" "$NGINX_CONFIG"; then
  echo "⚠️  Found redirect rules in Nginx config:"
  grep -n "return 301" "$NGINX_CONFIG" | head -3
else
  echo "✅ No explicit redirect rules found"
fi
echo ""

echo "============================"
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Assets are working! The site should load correctly."
else
  echo "⚠️  Still having issues. Check the output above."
fi
echo ""

