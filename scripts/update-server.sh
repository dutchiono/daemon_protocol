#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Daemon Social Network - Server Update${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Get project root (assuming script is in scripts/ directory)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo -e "${YELLOW}Step 1: Pulling latest changes...${NC}"
git pull
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Code updated${NC}"
else
    echo -e "${RED}❌ Git pull failed${NC}"
    exit 1
fi
echo ""

# Check if database setup is needed
echo -e "${YELLOW}Step 2: Checking database setup...${NC}"
if command -v psql &> /dev/null; then
    if psql -U postgres -lqt | cut -d \| -f 1 | grep -qw "daemon" 2>/dev/null; then
        echo -e "${GREEN}✅ Database exists${NC}"
        
        # Check if schema needs to be updated (simplified check)
        TABLE_COUNT=$(psql -U postgres -d daemon -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null || echo "0")
        if [ "$TABLE_COUNT" -lt "5" ]; then
            echo -e "${YELLOW}⚠️  Database schema may be incomplete. Running schema setup...${NC}"
            if [ -f "backend/db/social-schema.sql" ]; then
                psql -U postgres -d daemon -f backend/db/social-schema.sql 2>/dev/null || echo "Schema already applied or errors occurred"
                echo -e "${GREEN}✅ Schema check complete${NC}"
            fi
        fi
    else
        echo -e "${YELLOW}⚠️  Database 'daemon' does not exist.${NC}"
        read -p "Run database setup script? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            ./scripts/setup-database.sh
        else
            echo -e "${YELLOW}⚠️  Skipping database setup. Node will run with limited functionality.${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  PostgreSQL not installed. Node will run without database.${NC}"
fi
echo ""

# Check if dependencies need updating
echo -e "${YELLOW}Step 3: Checking dependencies...${NC}"
if [ -f "daemon-node/package.json" ]; then
    cd daemon-node
    
    # Check if node_modules exists and is newer than package.json
    if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
        echo -e "${YELLOW}📦 Installing/updating dependencies...${NC}"
        npm install
        echo -e "${GREEN}✅ Dependencies updated${NC}"
    else
        echo -e "${GREEN}✅ Dependencies up to date${NC}"
    fi
    
    # Check if build is needed
    if [ ! -d "dist" ] || [ "src" -nt "dist" ] || [ "package.json" -nt "dist" ]; then
        echo -e "${YELLOW}🔨 Building project...${NC}"
        npm run build
        echo -e "${GREEN}✅ Build complete${NC}"
    else
        echo -e "${GREEN}✅ Build up to date${NC}"
    fi
    
    cd ..
else
    echo -e "${RED}❌ daemon-node/package.json not found${NC}"
    exit 1
fi
echo ""

# Restart service
echo -e "${YELLOW}Step 4: Restarting service...${NC}"

# Check if using PM2
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "daemon-node"; then
        echo -e "${BLUE}🔄 Restarting PM2 process...${NC}"
        pm2 restart daemon-node --update-env
        pm2 save
        echo -e "${GREEN}✅ Service restarted${NC}"
        
        echo ""
        echo -e "${BLUE}Service status:${NC}"
        pm2 status daemon-node
    else
        echo -e "${YELLOW}⚠️  PM2 process 'daemon-node' not found.${NC}"
        echo -e "${YELLOW}   Start it manually with:${NC}"
        echo -e "   ${BLUE}cd daemon-node && pm2 start npm --name daemon-node -- start all${NC}"
    fi
# Check if using systemd
elif systemctl is-active --quiet daemon-node 2>/dev/null; then
    echo -e "${BLUE}🔄 Restarting systemd service...${NC}"
    sudo systemctl restart daemon-node
    echo -e "${GREEN}✅ Service restarted${NC}"
    
    echo ""
    echo -e "${BLUE}Service status:${NC}"
    sudo systemctl status daemon-node --no-pager -l
# Check if running directly
else
    echo -e "${YELLOW}⚠️  No service manager detected (PM2 or systemd).${NC}"
    echo -e "${YELLOW}   Service is not managed.${NC}"
    echo ""
    echo -e "${YELLOW}To restart manually:${NC}"
    echo -e "1. Stop the current process (Ctrl+C if in terminal)"
    echo -e "2. Start with: ${BLUE}cd daemon-node && npm start all${NC}"
    echo ""
    echo -e "${YELLOW}Or set up PM2:${NC}"
    echo -e "   ${BLUE}cd daemon-node && pm2 start npm --name daemon-node -- start all${NC}"
    echo -e "   ${BLUE}pm2 save && pm2 startup${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Update Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${BLUE}Test endpoints:${NC}"
echo -e "  ${YELLOW}curl http://localhost:4001/health${NC}  # Hub"
echo -e "  ${YELLOW}curl http://localhost:4002/health${NC}  # PDS"
echo -e "  ${YELLOW}curl http://localhost:4003/health${NC}  # Gateway"
echo ""
echo -e "${BLUE}View logs:${NC}"
if command -v pm2 &> /dev/null; then
    echo -e "  ${YELLOW}pm2 logs daemon-node${NC}"
elif systemctl is-active --quiet daemon-node 2>/dev/null; then
    echo -e "  ${YELLOW}sudo journalctl -u daemon-node -f${NC}"
else
    echo -e "  ${YELLOW}Check terminal output or logs/ directory${NC}"
fi
echo ""

