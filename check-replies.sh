#!/bin/bash

# Script to diagnose why replies aren't showing up
# Checks database, PDS, Gateway API, and logs

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Reply Diagnostic Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Get database connection from environment or use default
DB_USER="${DB_USER:-daemon}"
DB_NAME="${DB_NAME:-daemon}"
GATEWAY_URL="${GATEWAY_URL:-http://localhost:4003}"
PDS_URL="${PDS_URL:-http://localhost:4002}"

# Test post hash (you can pass as argument or it will try to find one)
POST_HASH="${1:-}"

echo -e "${YELLOW}1. Checking database for replies...${NC}"
echo ""

# Check if any replies exist
REPLY_COUNT=$(psql -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM messages WHERE parent_hash IS NOT NULL;" 2>/dev/null || echo "0")
echo -e "Total replies in database: ${GREEN}$REPLY_COUNT${NC}"

if [ "$REPLY_COUNT" -gt 0 ]; then
    echo ""
    echo -e "${GREEN}Recent replies:${NC}"
    psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT hash, did, LEFT(text, 50) as text_preview, parent_hash, timestamp FROM messages WHERE parent_hash IS NOT NULL ORDER BY timestamp DESC LIMIT 10;" 2>/dev/null || echo "Could not query database"
else
    echo -e "${RED}No replies found in database${NC}"
fi

echo ""
echo -e "${YELLOW}2. Checking recent messages (all types)...${NC}"
echo ""
psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT hash, did, LEFT(text, 40) as text_preview, parent_hash, message_type, TO_TIMESTAMP(timestamp) as created_at FROM messages ORDER BY timestamp DESC LIMIT 15;" 2>/dev/null || echo "Could not query database"

echo ""
echo -e "${YELLOW}3. Finding a post to test replies for...${NC}"
echo ""

# If no post hash provided, find one
if [ -z "$POST_HASH" ]; then
    POST_HASH=$(psql -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT hash FROM messages WHERE parent_hash IS NULL ORDER BY timestamp DESC LIMIT 1;" 2>/dev/null || echo "")
    if [ -z "$POST_HASH" ]; then
        echo -e "${RED}No posts found in database${NC}"
        POST_HASH="at://did:daemon:1/app.daemon.feed.post/1763912220233"
        echo -e "${YELLOW}Using default post hash: $POST_HASH${NC}"
    else
        echo -e "${GREEN}Found post: $POST_HASH${NC}"
    fi
else
    echo -e "${GREEN}Using provided post hash: $POST_HASH${NC}"
fi

echo ""
echo -e "${YELLOW}4. Checking database for replies to this post...${NC}"
echo ""
REPLIES_TO_POST=$(psql -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM messages WHERE parent_hash = '$POST_HASH';" 2>/dev/null || echo "0")
echo -e "Replies to this post in database: ${GREEN}$REPLIES_TO_POST${NC}"

if [ "$REPLIES_TO_POST" -gt 0 ]; then
    echo ""
    echo -e "${GREEN}Replies found:${NC}"
    psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT hash, did, text, parent_hash, timestamp FROM messages WHERE parent_hash = '$POST_HASH' ORDER BY timestamp DESC;" 2>/dev/null || echo "Could not query database"
fi

echo ""
echo -e "${YELLOW}5. Checking PDS for reply records...${NC}"
echo ""

# Extract DID from post hash if it's an AT Protocol URI
if [[ "$POST_HASH" == at://* ]]; then
    POST_AUTHOR_DID=$(echo "$POST_HASH" | sed 's|at://||' | cut -d'/' -f1)
    echo -e "Post author DID: ${GREEN}$POST_AUTHOR_DID${NC}"

    # Check if PDS is responding
    if curl -s "$PDS_URL/health" > /dev/null 2>&1; then
        echo -e "${GREEN}PDS is responding${NC}"
        echo ""

        # Get all known DIDs from database (like getReplies does)
        echo "Getting known DIDs from database..."
        KNOWN_DIDS=$(psql -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT DISTINCT did FROM messages WHERE did IS NOT NULL LIMIT 50;" 2>/dev/null || echo "")

        # Add post author DID if not in list
        if [ -n "$POST_AUTHOR_DID" ]; then
            KNOWN_DIDS="$POST_AUTHOR_DID"$'\n'"$KNOWN_DIDS"
        fi

        # Remove duplicates and empty lines
        KNOWN_DIDS=$(echo "$KNOWN_DIDS" | grep -v '^$' | sort -u)
        DID_COUNT=$(echo "$KNOWN_DIDS" | wc -l)
        echo -e "Found ${GREEN}$DID_COUNT${NC} known DIDs to check"

        TOTAL_REPLY_RECORDS=0
        REPLIES_TO_POST_PDS=0
        ALL_REPLIES=""

        # Check each DID's repo
        for DID in $KNOWN_DIDS; do
            if [ -z "$DID" ]; then continue; fi
            echo "  Checking repo: $DID"
            PDS_RECORDS=$(curl -s "$PDS_URL/xrpc/com.atproto.repo.listRecords?repo=$DID&collection=app.daemon.feed.post&limit=500" 2>/dev/null || echo '{"records":[]}')

            # Count replies in this repo
            REPLY_COUNT=$(echo "$PDS_RECORDS" | jq -r '.records[] | select(.value.reply != null) | .uri' 2>/dev/null | wc -l || echo "0")
            if [ "$REPLY_COUNT" -gt 0 ]; then
                TOTAL_REPLY_RECORDS=$((TOTAL_REPLY_RECORDS + REPLY_COUNT))

                # Check for replies to specific post
                REPLIES_TO_THIS_POST=$(echo "$PDS_RECORDS" | jq -r --arg post "$POST_HASH" '.records[] | select(.value.reply != null and (.value.reply.parent.uri == $post or .value.reply.root.uri == $post)) | .uri' 2>/dev/null | wc -l || echo "0")
                if [ "$REPLIES_TO_THIS_POST" -gt 0 ]; then
                    REPLIES_TO_POST_PDS=$((REPLIES_TO_POST_PDS + REPLIES_TO_THIS_POST))
                    REPLIES_FOUND=$(echo "$PDS_RECORDS" | jq -r --arg post "$POST_HASH" '.records[] | select(.value.reply != null and (.value.reply.parent.uri == $post or .value.reply.root.uri == $post)) | {uri: .uri, text: .value.text, parent: .value.reply.parent.uri}' 2>/dev/null || echo "")
                    ALL_REPLIES="$ALL_REPLIES"$'\n'"$REPLIES_FOUND"
                fi
            fi
        done

        echo ""
        echo -e "Total reply records found across all repos: ${GREEN}$TOTAL_REPLY_RECORDS${NC}"
        echo -e "Replies to this post in PDS: ${GREEN}$REPLIES_TO_POST_PDS${NC}"

        if [ "$REPLIES_TO_POST_PDS" -gt 0 ]; then
            echo ""
            echo -e "${GREEN}Replies found in PDS:${NC}"
            echo "$ALL_REPLIES" | jq -s '.' 2>/dev/null || echo "$ALL_REPLIES"
        fi
    else
        echo -e "${RED}PDS is not responding at $PDS_URL${NC}"
    fi
else
    echo -e "${YELLOW}Post hash is not an AT Protocol URI, skipping PDS check${NC}"
fi

echo ""
echo -e "${YELLOW}6. Testing Gateway API endpoint...${NC}"
echo ""

# URL encode the post hash
ENCODED_HASH=$(echo "$POST_HASH" | sed 's|:|%3A|g' | sed 's|/|%2F|g' | sed 's|#|%23|g')

# Check if Gateway is responding
if curl -s "$GATEWAY_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}Gateway is responding${NC}"
    echo ""
    echo "Testing: GET $GATEWAY_URL/api/v1/posts/$ENCODED_HASH/replies"

    API_RESPONSE=$(curl -s "$GATEWAY_URL/api/v1/posts/$ENCODED_HASH/replies?did=did:daemon:1" 2>/dev/null || echo '{"replies":[]}')

    REPLY_COUNT_API=$(echo "$API_RESPONSE" | jq -r '.replies | length' 2>/dev/null || echo "0")
    echo -e "Replies returned by API: ${GREEN}$REPLY_COUNT_API${NC}"

    if [ "$REPLY_COUNT_API" -gt 0 ]; then
        echo ""
        echo -e "${GREEN}API Response:${NC}"
        echo "$API_RESPONSE" | jq '.' 2>/dev/null || echo "$API_RESPONSE"
    else
        echo ""
        echo -e "${YELLOW}Full API Response:${NC}"
        echo "$API_RESPONSE" | jq '.' 2>/dev/null || echo "$API_RESPONSE"
    fi
else
    echo -e "${RED}Gateway is not responding at $GATEWAY_URL${NC}"
fi

echo ""
echo -e "${YELLOW}7. Checking Gateway logs for reply-related activity...${NC}"
echo ""

# Check PM2 logs if available
if command -v pm2 &> /dev/null; then
    echo "Recent Gateway logs (last 30 lines with 'reply' or 'parent' or 'getReplies'):"
    pm2 logs daemon-gateway --lines 100 --nostream 2>/dev/null | grep -i "reply\|parent\|getReplies\|query PDS repo" | tail -20 || echo "No reply-related logs found"

    echo ""
    echo "Recent POST requests to /api/v1/posts:"
    pm2 logs daemon-gateway --lines 100 --nostream 2>/dev/null | grep "POST /api/v1/posts" | tail -10 || echo "No POST requests found"

    echo ""
    echo "Checking for PDS repo queries (should see queries to multiple DIDs):"
    pm2 logs daemon-gateway --lines 200 --nostream 2>/dev/null | grep -i "query PDS repo\|Failed to query PDS repo" | tail -10 || echo "No PDS repo queries found"
else
    echo "PM2 not available, skipping log check"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Diagnostic Complete${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Summary:"
echo "  - Database replies: $REPLY_COUNT"
echo "  - Replies to test post (DB): $REPLIES_TO_POST"
echo "  - Replies to test post (API): $REPLY_COUNT_API"
echo ""
echo "If replies exist in database/PDS but not in API, check:"
echo "  1. Gateway aggregation-layer.ts getReplies() method"
echo "  2. parent_hash matching logic"
echo "  3. URL encoding of post hash in API calls"
echo ""

