#!/bin/bash

echo "🔧 Fixing Git Pull Issue..."
echo ""

# Check what changes exist
echo "1. Checking what files have changes..."
git status

echo ""
echo "2. Checking differences in aggregation-layer.js..."
git diff social-network/gateway/src/aggregation-layer.js | head -20

echo ""
echo "3. Checking differences in gateway-service.js..."
git diff social-network/gateway/src/gateway-service.js | head -20

echo ""
echo "4. These are likely just compiled JS files or line ending differences."
echo "   We'll discard these changes and pull fresh from git."
echo ""

read -p "Discard local changes and pull? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Discarding local changes..."
    git checkout -- social-network/gateway/src/aggregation-layer.js
    git checkout -- social-network/gateway/src/gateway-service.js
    echo "✅ Changes discarded"
    echo ""
    echo "Pulling latest changes..."
    git pull
    echo "✅ Done!"
else
    echo "Cancelled."
fi

