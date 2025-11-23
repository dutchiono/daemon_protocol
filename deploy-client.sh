#!/bin/bash

# Automated Client Deployment Script
# This script pulls from git, builds, and deploys the client

set -e  # Exit on error

echo "🚀 Deploying Daemon Client"
echo "=========================="
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "1️⃣  Pulling latest changes from git..."
git pull
echo ""

echo "2️⃣  Building client..."
cd daemon-client
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Client build failed!"
  exit 1
fi
echo "✅ Client built successfully"
echo ""

echo "3️⃣  Copying files to Nginx directory..."
# Ensure directory exists
sudo mkdir -p /var/www/daemon-client
# Copy all files from dist
sudo cp -r dist/* /var/www/daemon-client/
# Verify assets were copied
if [ -d "/var/www/daemon-client/assets" ]; then
  echo "✅ Files copied to /var/www/daemon-client/"
  echo "   Assets directory exists with $(ls /var/www/daemon-client/assets/ | wc -l) files"
else
  echo "❌ WARNING: Assets directory not found after copy!"
  echo "   Checking dist folder..."
  ls -la dist/ || true
fi
echo ""

echo "4️⃣  Setting correct permissions..."
sudo chown -R www-data:www-data /var/www/daemon-client/
sudo chmod -R 755 /var/www/daemon-client/
echo "✅ Permissions set"
echo ""

echo "5️⃣  Reloading Nginx..."
sudo systemctl reload nginx
echo "✅ Nginx reloaded"
echo ""

echo "=========================="
echo "✅ Client deployment complete!"
echo ""
echo "🌐 Site should be live at: https://daemon.bushleague.xyz"
echo ""
echo "📊 Verify deployment:"
echo "   ls -la /var/www/daemon-client/assets/ | head -5"
echo "   curl -I https://daemon.bushleague.xyz/assets/index-Cn0al3d2.js"

