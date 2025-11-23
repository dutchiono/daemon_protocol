#!/bin/bash
# Fix Gateway TypeScript build errors by cleaning stale files

echo "🔧 Fixing Gateway TypeScript build errors..."
echo ""

cd social-network/gateway || exit 1

echo "1️⃣  Removing stale declaration files..."
find src -name "*.d.ts" -type f -delete 2>/dev/null || true
find src -name "*.d.ts.map" -type f -delete 2>/dev/null || true
echo "   ✅ Cleaned .d.ts files"

echo ""
echo "2️⃣  Removing build artifacts..."
rm -rf dist node_modules/.cache .tsbuildinfo 2>/dev/null || true
echo "   ✅ Cleaned build artifacts"

echo ""
echo "3️⃣  Verifying types.ts exports..."
if grep -q "export interface Vote" src/types.ts; then
    echo "   ✅ Vote interface is exported"
else
    echo "   ❌ Vote interface NOT found in types.ts"
    exit 1
fi

if grep -q "voteCount\?:" src/types.ts; then
    echo "   ✅ voteCount property exists in Post interface"
else
    echo "   ❌ voteCount property NOT found in Post interface"
    exit 1
fi

echo ""
echo "4️⃣  Rebuilding..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
else
    echo ""
    echo "❌ Build failed. Check errors above."
    exit 1
fi

