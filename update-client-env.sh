#!/bin/bash

echo "🔧 Updating Client Environment Variables"
echo "========================================="
echo ""

cd ~/daemon/daemon-client

# Check if .env exists
if [ ! -f .env ]; then
    echo "1️⃣  Creating .env file..."
    cat > .env << 'EOF'
VITE_GATEWAY_URL=https://daemon.bushleague.xyz/api
VITE_PDS_URL=https://daemon.bushleague.xyz/xrpc
VITE_ID_REGISTRY_ADDRESS=
VITE_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
EOF
    echo "   ✅ .env file created"
else
    echo "1️⃣  .env file exists"
fi
echo ""

# Check if ID_REGISTRY_ADDRESS is set
if grep -q "VITE_ID_REGISTRY_ADDRESS=" .env && ! grep -q "VITE_ID_REGISTRY_ADDRESS=$" .env && ! grep -q "VITE_ID_REGISTRY_ADDRESS=\"\"" .env; then
    CURRENT_ADDRESS=$(grep "VITE_ID_REGISTRY_ADDRESS=" .env | cut -d'=' -f2)
    echo "2️⃣  Current ID Registry Address: $CURRENT_ADDRESS"
else
    echo "2️⃣  ID Registry Address is NOT set"
    echo ""
    echo "   You need to either:"
    echo "   A) Deploy the contract (recommended for testing)"
    echo "   B) Use an existing contract address"
    echo ""
    read -p "   Do you have a contract address? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "   Enter contract address: " CONTRACT_ADDRESS
        if [ ! -z "$CONTRACT_ADDRESS" ]; then
            # Update or add the address
            if grep -q "VITE_ID_REGISTRY_ADDRESS=" .env; then
                sed -i "s|VITE_ID_REGISTRY_ADDRESS=.*|VITE_ID_REGISTRY_ADDRESS=$CONTRACT_ADDRESS|" .env
            else
                echo "VITE_ID_REGISTRY_ADDRESS=$CONTRACT_ADDRESS" >> .env
            fi
            echo "   ✅ Address saved"
        fi
    else
        echo ""
        echo "   To deploy the contract:"
        echo "   cd ~/daemon/contracts"
        echo "   npm install"
        echo "   # Create .env with PRIVATE_KEY and RPC_URL"
        echo "   npx hardhat run scripts/deploy-identity-registry-base.ts --network base-sepolia"
        echo ""
        echo "   Then run this script again to update the client."
        exit 0
    fi
fi
echo ""

# Show current .env
echo "3️⃣  Current .env file:"
cat .env
echo ""

# Rebuild client
echo "4️⃣  Rebuilding client with new environment variables..."
npm run build
echo ""

# Copy to web directory
echo "5️⃣  Copying built files to web directory..."
sudo cp -r dist/* /var/www/daemon-client/
sudo chown -R www-data:www-data /var/www/daemon-client
echo "   ✅ Files copied"
echo ""

echo "=========================================="
echo "✅ Client Updated!"
echo ""
echo "🌐 The client has been rebuilt and deployed."
echo "   Refresh your browser to see the changes."
echo ""

