#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Restarting Daemon Social Network Server...${NC}"
echo ""

# Check if using PM2
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "daemon-node"; then
        echo -e "${YELLOW}Restarting PM2 process...${NC}"
        pm2 restart daemon-node --update-env
        pm2 save
        echo -e "${GREEN}✅ Server restarted${NC}"

        echo ""
        pm2 status daemon-node
        exit 0
    fi
fi

# Check if using systemd
if systemctl is-active --quiet daemon-node 2>/dev/null; then
    echo -e "${YELLOW}Restarting systemd service...${NC}"
    sudo systemctl restart daemon-node
    echo -e "${GREEN}✅ Server restarted${NC}"

    echo ""
    sudo systemctl status daemon-node --no-pager -l
    exit 0
fi

# No service manager found
echo -e "${RED}❌ No service manager detected${NC}"
echo ""
echo -e "${YELLOW}Service is not running with PM2 or systemd.${NC}"
echo ""
echo -e "To restart:"
echo -e "1. Stop the current process (Ctrl+C)"
echo -e "2. Run: ${BLUE}./scripts/start-server.sh${NC}"
echo ""
exit 1

