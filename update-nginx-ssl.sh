#!/bin/bash

echo "🔧 Updating Nginx to use SSL Certificate"
echo "=========================================="
echo ""

# Check if certificate exists
if [ -f "/etc/letsencrypt/live/daemon.bushleague.xyz/fullchain.pem" ]; then
    echo "✅ Certificate found at /etc/letsencrypt/live/daemon.bushleague.xyz/"
    echo ""
    
    # Update nginx config
    echo "1️⃣  Updating nginx configuration..."
    sudo sed -i 's|ssl_certificate /etc/letsencrypt/live/bushleague.xyz/fullchain.pem;|ssl_certificate /etc/letsencrypt/live/daemon.bushleague.xyz/fullchain.pem;|' /etc/nginx/sites-available/daemon.bushleague.xyz
    sudo sed -i 's|ssl_certificate_key /etc/letsencrypt/live/bushleague.xyz/privkey.pem;|ssl_certificate_key /etc/letsencrypt/live/daemon.bushleague.xyz/privkey.pem;|' /etc/nginx/sites-available/daemon.bushleague.xyz
    
    echo "✅ Nginx config updated"
    echo ""
    
    # Test nginx config
    echo "2️⃣  Testing nginx configuration..."
    if sudo nginx -t; then
        echo "✅ Nginx config is valid"
        echo ""
        echo "3️⃣  Reloading nginx..."
        sudo systemctl reload nginx
        echo "✅ Nginx reloaded"
        echo ""
        echo "=========================================="
        echo "✅ SSL Setup Complete!"
        echo ""
        echo "🌐 Test your site:"
        echo "   curl -I https://daemon.bushleague.xyz"
        echo "   curl https://daemon.bushleague.xyz/health"
        echo ""
    else
        echo "❌ Nginx config has errors"
        exit 1
    fi
else
    echo "❌ Certificate not found at /etc/letsencrypt/live/daemon.bushleague.xyz/"
    echo "   Run: sudo certbot certonly --standalone -d daemon.bushleague.xyz"
    exit 1
fi

