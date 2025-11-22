#!/bin/bash

echo "🔧 Fixing Certbot SSL Certificate Issue"
echo "========================================"
echo ""

# Clean up any failed attempts
echo "1️⃣  Cleaning up any failed certbot attempts..."
sudo certbot delete --cert-name daemon.bushleague.xyz 2>/dev/null || echo "   No existing cert to delete"
sudo rm -rf /var/log/letsencrypt/letsencrypt.log.backup* 2>/dev/null || true
echo "✅ Cleanup done"
echo ""

# Check if we can use the existing bushleague.xyz cert
echo "2️⃣  Checking existing certificates..."
if [ -f "/etc/letsencrypt/live/bushleague.xyz/fullchain.pem" ]; then
    echo "   ✅ Found existing certificate for bushleague.xyz"
    echo "   Attempting to expand it to include subdomain..."
    echo ""
    
    # Try to expand the existing certificate
    sudo certbot --nginx --expand -d bushleague.xyz -d www.bushleague.xyz -d daemon.bushleague.xyz
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Certificate expanded successfully!"
        exit 0
    else
        echo ""
        echo "⚠️  Expansion failed, trying standalone method..."
    fi
else
    echo "   ⚠️  No existing certificate found"
fi
echo ""

# Try standalone method (doesn't require nginx to be running)
echo "3️⃣  Trying standalone method (temporarily stops nginx)..."
echo "   This will temporarily stop nginx to verify domain ownership"
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

# Stop nginx temporarily
sudo systemctl stop nginx

# Get certificate using standalone
sudo certbot certonly --standalone -d daemon.bushleague.xyz --non-interactive --agree-tos --email admin@bushleague.xyz

# Start nginx again
sudo systemctl start nginx

if [ -f "/etc/letsencrypt/live/daemon.bushleague.xyz/fullchain.pem" ]; then
    echo ""
    echo "✅ Certificate obtained successfully!"
    echo ""
    echo "4️⃣  Updating nginx config to use the certificate..."
    
    # Update nginx config to use the new certificate
    sudo sed -i 's|ssl_certificate /etc/letsencrypt/live/bushleague.xyz/fullchain.pem;|ssl_certificate /etc/letsencrypt/live/daemon.bushleague.xyz/fullchain.pem;|' /etc/nginx/sites-available/daemon.bushleague.xyz
    sudo sed -i 's|ssl_certificate_key /etc/letsencrypt/live/bushleague.xyz/privkey.pem;|ssl_certificate_key /etc/letsencrypt/live/daemon.bushleague.xyz/privkey.pem;|' /etc/nginx/sites-available/daemon.bushleague.xyz
    
    # Test and reload nginx
    if sudo nginx -t; then
        sudo systemctl reload nginx
        echo "✅ Nginx updated and reloaded"
    else
        echo "❌ Nginx config error"
        exit 1
    fi
else
    echo ""
    echo "❌ Certificate creation failed"
    echo "   Check logs: sudo cat /var/log/letsencrypt/letsencrypt.log"
    exit 1
fi

echo ""
echo "========================================"
echo "✅ SSL Certificate Setup Complete!"
echo ""
echo "🌐 Test your site:"
echo "   curl -I https://daemon.bushleague.xyz"
echo ""

