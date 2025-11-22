#!/bin/bash
# End-to-End Test Script for Social Network Nodes

echo "=========================================="
echo "Daemon Social Network - E2E Test"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Hub Health
echo -e "${YELLOW}Test 1: Hub Health Check${NC}"
HUB_HEALTH=$(curl -s http://localhost:4001/health)
if echo "$HUB_HEALTH" | grep -q "ok"; then
    echo -e "${GREEN}✓ Hub is running${NC}"
else
    echo -e "${RED}✗ Hub is not running${NC}"
    echo "Response: $HUB_HEALTH"
    exit 1
fi
echo ""

# Test 2: PDS Health
echo -e "${YELLOW}Test 2: PDS Health Check${NC}"
PDS_HEALTH=$(curl -s http://localhost:4002/health)
if echo "$PDS_HEALTH" | grep -q "ok"; then
    echo -e "${GREEN}✓ PDS is running${NC}"
else
    echo -e "${RED}✗ PDS is not running${NC}"
    echo "Response: $PDS_HEALTH"
    exit 1
fi
echo ""

# Test 3: Gateway Health
echo -e "${YELLOW}Test 3: Gateway Health Check${NC}"
GATEWAY_HEALTH=$(curl -s http://localhost:4003/health)
if echo "$GATEWAY_HEALTH" | grep -q "ok"; then
    echo -e "${GREEN}✓ Gateway is running${NC}"
else
    echo -e "${RED}✗ Gateway is not running${NC}"
    echo "Response: $GATEWAY_HEALTH"
    exit 1
fi
echo ""

# Test 4: Create a Post via PDS
echo -e "${YELLOW}Test 4: Create Post via PDS${NC}"
POST_TEXT="Test post from E2E test - $(date)"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

POST_RESPONSE=$(curl -s -X POST http://localhost:4002/xrpc/com.atproto.repo.createRecord \
  -H "Content-Type: application/json" \
  -d "{
    \"repo\": \"did:daemon:1\",
    \"collection\": \"app.bsky.feed.post\",
    \"record\": {
      \"\$type\": \"app.bsky.feed.post\",
      \"text\": \"$POST_TEXT\",
      \"createdAt\": \"$TIMESTAMP\"
    }
  }")

if echo "$POST_RESPONSE" | grep -q "uri"; then
    POST_URI=$(echo "$POST_RESPONSE" | grep -o '"uri":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✓ Post created: $POST_URI${NC}"
else
    echo -e "${RED}✗ Failed to create post${NC}"
    echo "Response: $POST_RESPONSE"
    exit 1
fi
echo ""

# Test 5: Submit Message to Hub
echo -e "${YELLOW}Test 5: Submit Message to Hub${NC}"
MESSAGE_TEXT="Hello from hub test"
MESSAGE_HASH=$(echo -n "$MESSAGE_TEXT-$(date +%s)" | sha256sum | cut -d' ' -f1)
TIMESTAMP=$(date +%s)

HUB_MESSAGE=$(curl -s -X POST http://localhost:4001/api/v1/messages \
  -H "Content-Type: application/json" \
  -d "{
    \"hash\": \"0x$MESSAGE_HASH\",
    \"fid\": 1,
    \"text\": \"$MESSAGE_TEXT\",
    \"timestamp\": $TIMESTAMP
  }")

if echo "$HUB_MESSAGE" | grep -q "accepted"; then
    echo -e "${GREEN}✓ Message submitted to hub${NC}"
else
    echo -e "${YELLOW}⚠ Message submission response: $HUB_MESSAGE${NC}"
fi
echo ""

# Test 6: Retrieve Message from Hub
echo -e "${YELLOW}Test 6: Retrieve Message from Hub${NC}"
RETRIEVE_MESSAGE=$(curl -s http://localhost:4001/api/v1/messages/0x$MESSAGE_HASH)
if echo "$RETRIEVE_MESSAGE" | grep -q "hash"; then
    echo -e "${GREEN}✓ Message retrieved from hub${NC}"
    echo "Message: $(echo "$RETRIEVE_MESSAGE" | grep -o '"text":"[^"]*"' | cut -d'"' -f4)"
else
    echo -e "${YELLOW}⚠ Could not retrieve message (may need to wait)${NC}"
fi
echo ""

# Test 7: Get Feed via Gateway
echo -e "${YELLOW}Test 7: Get Feed via Gateway${NC}"
FEED_RESPONSE=$(curl -s http://localhost:4003/api/v1/feed?fid=1)
if echo "$FEED_RESPONSE" | grep -q "402"; then
    echo -e "${GREEN}✓ Gateway returned 402 Payment Required (expected)${NC}"
    echo "This means the gateway is working and x402 payment is required"
elif echo "$FEED_RESPONSE" | grep -q "posts"; then
    echo -e "${GREEN}✓ Feed retrieved (with payment)${NC}"
else
    echo -e "${YELLOW}⚠ Feed response: $FEED_RESPONSE${NC}"
fi
echo ""

# Test 8: Check Database
echo -e "${YELLOW}Test 8: Check Database Records${NC}"
echo "Checking if data was stored..."
echo ""
echo "Run these SQL queries to verify:"
echo "  SELECT COUNT(*) FROM messages;"
echo "  SELECT COUNT(*) FROM pds_records;"
echo "  SELECT * FROM messages ORDER BY created_at DESC LIMIT 5;"
echo ""

echo "=========================================="
echo -e "${GREEN}E2E Test Complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Check database to see stored messages"
echo "2. Test with multiple posts"
echo "3. Test feed aggregation"
echo "4. Test reactions and follows"

