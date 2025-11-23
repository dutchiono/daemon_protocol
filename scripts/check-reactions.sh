#!/bin/bash

# Simple script to check replies, recasts, and quote casts
# Uses DATABASE_URL from environment, no password prompts

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Try to load .env file from common locations
if [ -f ".env" ]; then
    set -a
    source .env
    set +a
elif [ -f "../.env" ]; then
    set -a
    source ../.env
    set +a
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Replies, Recasts & Quote Casts Check${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}ERROR: DATABASE_URL environment variable is not set${NC}"
    echo "Set it like: export DATABASE_URL='postgresql://user:pass@host:port/dbname'"
    echo "Or add it to .env file in the project root"
    exit 1
fi

echo -e "${YELLOW}1. Checking Replies...${NC}"
REPLY_COUNT=$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM messages WHERE parent_hash IS NOT NULL;" 2>/dev/null || echo "0")
echo -e "Total replies: ${GREEN}$REPLY_COUNT${NC}"

if [ "$REPLY_COUNT" -gt 0 ]; then
    echo -e "${GREEN}Recent replies:${NC}"
    psql "$DATABASE_URL" -c "SELECT hash, did, LEFT(text, 50) as text_preview, parent_hash, TO_TIMESTAMP(timestamp) as created_at FROM messages WHERE parent_hash IS NOT NULL ORDER BY timestamp DESC LIMIT 5;" 2>/dev/null || echo "Could not query"
fi

echo ""
echo -e "${YELLOW}2. Checking Recasts/Reposts...${NC}"
REPOST_COUNT=$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM reactions WHERE reaction_type = 'repost' AND active = true;" 2>/dev/null || echo "0")
echo -e "Total reposts: ${GREEN}$REPOST_COUNT${NC}"

if [ "$REPOST_COUNT" -gt 0 ]; then
    echo -e "${GREEN}Recent reposts:${NC}"
    psql "$DATABASE_URL" -c "SELECT did, target_hash, TO_TIMESTAMP(timestamp) as created_at FROM reactions WHERE reaction_type = 'repost' AND active = true ORDER BY timestamp DESC LIMIT 5;" 2>/dev/null || echo "Could not query"
fi

echo ""
echo -e "${YELLOW}3. Checking Quote Casts...${NC}"
QUOTE_COUNT=$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM reactions WHERE reaction_type = 'quote' AND active = true;" 2>/dev/null || echo "0")
echo -e "Total quote casts: ${GREEN}$QUOTE_COUNT${NC}"

if [ "$QUOTE_COUNT" -gt 0 ]; then
    echo -e "${GREEN}Recent quote casts:${NC}"
    psql "$DATABASE_URL" -c "SELECT did, target_hash, TO_TIMESTAMP(timestamp) as created_at FROM reactions WHERE reaction_type = 'quote' AND active = true ORDER BY timestamp DESC LIMIT 5;" 2>/dev/null || echo "Could not query"
fi

echo ""
echo -e "${YELLOW}4. Checking Likes...${NC}"
LIKE_COUNT=$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM reactions WHERE reaction_type = 'like' AND active = true;" 2>/dev/null || echo "0")
echo -e "Total likes: ${GREEN}$LIKE_COUNT${NC}"

echo ""
echo -e "${YELLOW}5. Summary${NC}"
echo -e "  Replies: ${GREEN}$REPLY_COUNT${NC}"
echo -e "  Reposts: ${GREEN}$REPOST_COUNT${NC}"
echo -e "  Quote Casts: ${GREEN}$QUOTE_COUNT${NC}"
echo -e "  Likes: ${GREEN}$LIKE_COUNT${NC}"

echo ""
echo -e "${BLUE}========================================${NC}"

