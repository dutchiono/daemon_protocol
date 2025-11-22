#!/bin/bash
# Setup script for Uniswap V4 Core dependency

set -e

echo "Setting up Uniswap V4 Core..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Creating node_modules directory..."
    mkdir -p node_modules/@uniswap
fi

# Check if already installed
if [ -d "node_modules/@uniswap/v4-core" ]; then
    echo "Uniswap V4 Core already installed at node_modules/@uniswap/v4-core"
    echo "Remove it first if you want to reinstall"
    exit 0
fi

# Clone Uniswap V4 Core
echo "Cloning Uniswap V4 Core from GitHub..."
cd node_modules/@uniswap
git clone https://github.com/Uniswap/v4-core.git v4-core
cd v4-core

# Install dependencies
echo "Installing Uniswap V4 Core dependencies..."
npm install

# Return to contracts directory
cd ../../..

echo "✅ Uniswap V4 Core setup complete!"
echo ""
echo "Next steps:"
echo "1. Run: npm run compile"
echo "2. Run: npm test"

