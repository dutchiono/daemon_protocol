#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Daemon Social Network - Server Status${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check processes
echo -e "${YELLOW}Processes:${NC}"
if pgrep -f "daemon-node\|tsx.*index.ts" > /dev/null; then
    echo -e "${GREEN}✅ Node process running${NC}"
    pgrep -f "daemon-node\|tsx.*index.ts" | xargs ps -p
else
    echo -e "${RED}❌ Node process not found${NC}"
fi
echo ""

# Check PM2
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "daemon-node"; then
        echo -e "${YELLOW}PM2 Status:${NC}"
        pm2 status daemon-node
        echo ""
    fi
fi

# Check systemd
if systemctl is-active --quiet daemon-node 2>/dev/null; then
    echo -e "${YELLOW}Systemd Status:${NC}"
    sudo systemctl status daemon-node --no-pager -l
    echo ""
fi

# Check ports
echo -e "${YELLOW}Port Status:${NC}"
PORTS=(4001 4002 4003 5001)
for PORT in "${PORTS[@]}"; do
    if sudo ss -tlnp | grep -q ":$PORT "; then
        SERVICE=""
        case $PORT in
            4001) SERVICE="Hub" ;;
            4002) SERVICE="PDS" ;;
            4003) SERVICE="Gateway" ;;
            5001) SERVICE="libp2p WS" ;;
        esac
        echo -e "${GREEN}✅ Port $PORT ($SERVICE) is listening${NC}"
    else
        echo -e "${RED}❌ Port $PORT is not listening${NC}"
    fi
done
echo ""

# Test endpoints
echo -e "${YELLOW}Endpoint Health:${NC}"
ENDPOINTS=(
    "http://localhost:4001/health:Hub"
    "http://localhost:4002/health:PDS"
    "http://localhost:4003/health:Gateway"
)

for ENDPOINT_INFO in "${ENDPOINTS[@]}"; do
    IFS=':' read -r URL NAME <<< "$ENDPOINT_INFO"
    if curl -s -o /dev/null -w "%{http_code}" "$URL" | grep -q "200"; then
        echo -e "${GREEN}✅ $NAME: OK${NC}"
    else
        echo -e "${RED}❌ $NAME: Not responding${NC}"
    fi
done
echo ""

# Check database
echo -e "${YELLOW}Database:${NC}"
if command -v psql &> /dev/null; then
    if psql -U postgres -lqt | cut -d \| -f 1 | grep -qw "daemon" 2>/dev/null; then
        echo -e "${GREEN}✅ Database 'daemon' exists${NC}"

        # Test connection
        if psql -U postgres -d daemon -c "SELECT 1;" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Database connection OK${NC}"
        else
            echo -e "${RED}❌ Database connection failed${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Database 'daemon' does not exist${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  PostgreSQL not installed${NC}"
fi
echo ""

# Check logs
echo -e "${YELLOW}Recent Logs:${NC}"
if [ -f "daemon-node/logs/combined.log" ]; then
    echo "Last 5 lines from logs/combined.log:"
    tail -5 daemon-node/logs/combined.log
else
    echo -e "${YELLOW}⚠️  No log file found${NC}"
fi
echo ""

echo -e "${BLUE}========================================${NC}"

