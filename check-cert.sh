#!/bin/bash

echo "🔍 Checking Certificate Location"
echo "=================================="
echo ""

echo "1️⃣  Checking if certificate exists..."
if [ -f "/etc/letsencrypt/live/daemon.bushleague.xyz/fullchain.pem" ]; then
    echo "   ✅ Found at: /etc/letsencrypt/live/daemon.bushleague.xyz/fullchain.pem"
    ls -la /etc/letsencrypt/live/daemon.bushleague.xyz/
else
    echo "   ❌ Not found at expected location"
    echo ""
    echo "2️⃣  Checking all certificates..."
    echo "   Available certificates:"
    ls -la /etc/letsencrypt/live/ 2>/dev/null || echo "   /etc/letsencrypt/live/ doesn't exist"
    echo ""
    echo "3️⃣  Checking certbot logs..."
    echo "   Last few lines of certbot log:"
    sudo tail -20 /var/log/letsencrypt/letsencrypt.log
fi

echo ""
echo "4️⃣  Listing all certbot certificates..."
sudo certbot certificates

