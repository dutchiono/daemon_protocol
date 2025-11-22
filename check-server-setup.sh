#!/bin/bash

echo "🔍 Checking Server Setup..."
echo "================================"
echo ""

# Check if nginx is installed
echo "1. Checking Nginx installation..."
if command -v nginx &> /dev/null; then
    echo "   ✅ Nginx is installed"
    nginx -v
else
    echo "   ❌ Nginx is not installed"
fi
echo ""

# Check nginx status
echo "2. Checking Nginx status..."
if systemctl is-active --quiet nginx; then
    echo "   ✅ Nginx is running"
else
    echo "   ⚠️  Nginx is not running"
fi
echo ""

# List all nginx configuration files
echo "3. Checking Nginx configuration files..."
if [ -d "/etc/nginx/sites-available" ]; then
    echo "   Available sites:"
    ls -la /etc/nginx/sites-available/ | grep -v "^total" | awk '{print "   - " $9}'
else
    echo "   ⚠️  /etc/nginx/sites-available not found"
fi
echo ""

# List enabled sites
echo "4. Checking enabled sites..."
if [ -d "/etc/nginx/sites-enabled" ]; then
    echo "   Enabled sites:"
    ls -la /etc/nginx/sites-enabled/ | grep -v "^total" | awk '{print "   - " $9}'
else
    echo "   ⚠️  /etc/nginx/sites-enabled not found"
fi
echo ""

# Check nginx main config
echo "5. Checking Nginx main configuration..."
if [ -f "/etc/nginx/nginx.conf" ]; then
    echo "   Main config exists at /etc/nginx/nginx.conf"
    echo "   Checking for include statements..."
    grep -E "include|sites-enabled" /etc/nginx/nginx.conf | head -5
else
    echo "   ⚠️  Main config not found"
fi
echo ""

# Check what's listening on common ports
echo "6. Checking listening ports..."
echo "   Port 80 (HTTP):"
if netstat -tuln 2>/dev/null | grep -q ":80 "; then
    netstat -tuln 2>/dev/null | grep ":80 " | awk '{print "   - " $4 " -> " $7}'
else
    echo "   - Nothing listening on port 80"
fi

echo "   Port 443 (HTTPS):"
if netstat -tuln 2>/dev/null | grep -q ":443 "; then
    netstat -tuln 2>/dev/null | grep ":443 " | awk '{print "   - " $4 " -> " $7}'
else
    echo "   - Nothing listening on port 443"
fi

echo "   Port 4002 (PDS):"
if netstat -tuln 2>/dev/null | grep -q ":4002 "; then
    netstat -tuln 2>/dev/null | grep ":4002 " | awk '{print "   - " $4 " -> " $7}'
else
    echo "   - Nothing listening on port 4002"
fi

echo "   Port 4003 (Gateway):"
if netstat -tuln 2>/dev/null | grep -q ":4003 "; then
    netstat -tuln 2>/dev/null | grep ":4003 " | awk '{print "   - " $4 " -> " $7}'
else
    echo "   - Nothing listening on port 4003"
fi
echo ""

# Check for Apache (common alternative)
echo "7. Checking for Apache..."
if command -v apache2 &> /dev/null || command -v httpd &> /dev/null; then
    echo "   ⚠️  Apache is installed (might conflict with nginx)"
    if systemctl is-active --quiet apache2 || systemctl is-active --quiet httpd; then
        echo "   ⚠️  Apache is running"
    fi
else
    echo "   ✅ Apache is not installed"
fi
echo ""

# Check web root directories
echo "8. Checking common web root directories..."
for dir in /var/www /usr/share/nginx/html /var/www/html; do
    if [ -d "$dir" ]; then
        echo "   $dir exists:"
        ls -la "$dir" 2>/dev/null | head -10 | awk '{print "     " $9}'
    fi
done
echo ""

# Check PM2 processes
echo "9. Checking PM2 processes..."
if command -v pm2 &> /dev/null; then
    echo "   Running processes:"
    pm2 list 2>/dev/null || echo "   PM2 not running or no processes"
else
    echo "   ⚠️  PM2 is not installed"
fi
echo ""

# Check for other web servers
echo "10. Checking for other web servers..."
if command -v node &> /dev/null; then
    echo "   Node.js processes:"
    ps aux | grep -E "node|npm|vite" | grep -v grep | awk '{print "   - " $11 " " $12 " " $13}'
fi
echo ""

echo "================================"
echo "✅ Check complete!"
echo ""
echo "Next steps:"
echo "1. Review the enabled sites above"
echo "2. Check if port 80/443 are available"
echo "3. Decide where to deploy the client (new subdomain or path)"

