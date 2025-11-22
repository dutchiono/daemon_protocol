#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Daemon Social Network - Start Server${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Get project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js v20+${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node --version)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm $(npm --version)${NC}"

# Check database (optional)
if command -v psql &> /dev/null; then
    if psql -U postgres -lqt | cut -d \| -f 1 | grep -qw "daemon" 2>/dev/null; then
        echo -e "${GREEN}✅ Database ready${NC}"
    else
        echo -e "${YELLOW}⚠️  Database 'daemon' not found. Running without database (limited functionality).${NC}"
        read -p "Setup database now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            ./scripts/setup-database.sh
        fi
    fi
else
    echo -e "${YELLOW}⚠️  PostgreSQL not installed. Node will run without database.${NC}"
fi
echo ""

# Install dependencies if needed
cd daemon-node

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Build if needed
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}Building project...${NC}"
    npm run build
fi

echo ""
echo -e "${BLUE}Starting server...${NC}"
echo ""

# Check if PM2 is installed and preferred
if command -v pm2 &> /dev/null; then
    read -p "Start with PM2? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pm2 start npm --name daemon-node -- start all
        pm2 save
        echo ""
        echo -e "${GREEN}✅ Server started with PM2${NC}"
        echo ""
        echo -e "${BLUE}Useful commands:${NC}"
        echo -e "  ${YELLOW}pm2 logs daemon-node${NC}    # View logs"
        echo -e "  ${YELLOW}pm2 restart daemon-node${NC} # Restart"
        echo -e "  ${YELLOW}pm2 stop daemon-node${NC}    # Stop"
        exit 0
    fi
fi

# Start directly
npm start all

