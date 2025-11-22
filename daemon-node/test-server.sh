#!/bin/bash

# Test server endpoints from the server itself

echo "=========================================="
echo "Testing Daemon Social Network Endpoints"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test Hub Health
echo -e "${YELLOW}Testing Hub (Port 4001)...${NC}"
curl -s -o /dev/null -w "Hub Health Check: HTTP %{http_code} - Time: %{time_total}s\n" http://localhost:4001/health
curl -s http://localhost:4001/health | jq . || echo "Response: $(curl -s http://localhost:4001/health)"
echo ""

# Test PDS Health
echo -e "${YELLOW}Testing PDS (Port 4002)...${NC}"
curl -s -o /dev/null -w "PDS Health Check: HTTP %{http_code} - Time: %{time_total}s\n" http://localhost:4002/health
curl -s http://localhost:4002/health | jq . || echo "Response: $(curl -s http://localhost:4002/health)"
echo ""

# Test Gateway Health
echo -e "${YELLOW}Testing Gateway (Port 4003)...${NC}"
curl -s -o /dev/null -w "Gateway Health Check: HTTP %{http_code} - Time: %{time_total}s\n" http://localhost:4003/health
curl -s http://localhost:4003/health | jq . || echo "Response: $(curl -s http://localhost:4003/health)"
echo ""

# Test Gateway Feed (without auth - should work or show error)
echo -e "${YELLOW}Testing Gateway Feed Endpoint...${NC}"
curl -s -o /dev/null -w "Gateway Feed: HTTP %{http_code} - Time: %{time_total}s\n" "http://localhost:4003/api/v1/feed?limit=10"
echo "Response:"
curl -s "http://localhost:4003/api/v1/feed?limit=10" | jq . || echo "$(curl -s http://localhost:4003/api/v1/feed?limit=10)"
echo ""

# Test PDS Describe Server
echo -e "${YELLOW}Testing PDS Describe Server...${NC}"
curl -s -o /dev/null -w "PDS Describe: HTTP %{http_code} - Time: %{time_total}s\n" http://localhost:4002/xrpc/com.atproto.server.describeServer
curl -s http://localhost:4002/xrpc/com.atproto.server.describeServer | jq . || echo "Response: $(curl -s http://localhost:4002/xrpc/com.atproto.server.describeServer)"
echo ""

# Test external IP access (from server's perspective)
EXTERNAL_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "unknown")
echo -e "${YELLOW}External IP detected: ${EXTERNAL_IP}${NC}"
echo ""

# Test with external IP (if same as configured)
if [ "$EXTERNAL_IP" = "50.21.187.69" ]; then
  echo -e "${YELLOW}Testing with external IP (50.21.187.69)...${NC}"
  curl -s -o /dev/null -w "Gateway (external IP): HTTP %{http_code}\n" http://50.21.187.69:4003/health
else
  echo -e "${YELLOW}External IP ($EXTERNAL_IP) doesn't match configured IP (50.21.187.69)${NC}"
fi
echo ""

# Check if ports are listening
echo -e "${YELLOW}Checking listening ports...${NC}"
sudo ss -tlnp | grep -E ':(4001|4002|4003|5001)' || netstat -tlnp | grep -E ':(4001|4002|4003|5001)' 2>/dev/null || echo "Cannot check ports (need sudo or netstat)"
echo ""

echo "=========================================="
echo "Test Complete"
echo "=========================================="

