#!/bin/bash

echo "🔍 Checking Existing Nginx Configs..."
echo "======================================"
echo ""

# Check bronkle.xyz config
echo "1. bronkle.xyz configuration:"
if [ -f "/etc/nginx/sites-available/bronkle.xyz" ]; then
    echo "   File exists, showing config:"
    cat /etc/nginx/sites-available/bronkle.xyz
else
    echo "   ⚠️  Config file not found"
fi
echo ""

# Check bushleague.xyz config
echo "2. bushleague.xyz configuration:"
if [ -f "/etc/nginx/sites-available/bushleague.xyz" ]; then
    echo "   File exists, showing config:"
    cat /etc/nginx/sites-available/bushleague.xyz
else
    echo "   ⚠️  Config file not found"
fi
echo ""

echo "======================================"
echo "🚀 Checking Daemon Services..."
echo ""

# Check if Gateway is running
echo "3. Checking Gateway (port 4003)..."
if netstat -tuln 2>/dev/null | grep -q ":4003 "; then
    echo "   ✅ Gateway is running on port 4003"
else
    echo "   ❌ Gateway is NOT running"
    echo "   Checking PM2 for gateway process..."
    pm2 list | grep -i gateway || echo "   No gateway process found"
fi
echo ""

# Check if PDS is running
echo "4. Checking PDS (port 4002)..."
if netstat -tuln 2>/dev/null | grep -q ":4002 "; then
    echo "   ✅ PDS is running on port 4002"
else
    echo "   ❌ PDS is NOT running"
    echo "   Checking PM2 for PDS process..."
    pm2 list | grep -i pds || echo "   No PDS process found"
fi
echo ""

# Check daemon-node processes
echo "5. All PM2 processes:"
pm2 list
echo ""

echo "======================================"
echo "📋 Summary:"
echo ""
echo "To fix the 404 errors, we need to:"
echo "1. Start the Gateway service (port 4003)"
echo "2. Start the PDS service (port 4002)"
echo ""
echo "Then we can deploy the client as:"
echo "- A new subdomain (e.g., daemon.bronkle.xyz)"
echo "- A path on existing site (e.g., bronkle.xyz/daemon)"
echo "- A new domain/subdomain"
echo ""

