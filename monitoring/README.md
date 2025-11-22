# Daemon Social Network Monitor

Real-time monitoring dashboard for all Daemon Social Network nodes.

## Quick Start

```bash
cd monitoring
npm install
npm start
```

Then open: http://localhost:4000

## What It Monitors

- **Hub** (port 4001) - Message relay node
- **PDS** (port 4002) - Personal Data Server
- **Gateway** (port 4003) - API Gateway
- **Backend** (port 3000) - x402 payment service

## Features

- ✅ Real-time status updates (WebSocket)
- ✅ Health checks every 10 seconds
- ✅ Response time monitoring
- ✅ Error tracking
- ✅ Summary dashboard

## Configuration

Set environment variables to monitor different endpoints:

```bash
HUB_ENDPOINT=http://localhost:4001
PDS_ENDPOINT=http://localhost:4002
GATEWAY_ENDPOINT=http://localhost:4003
BACKEND_ENDPOINT=http://localhost:3000
PORT=4000
```

## API

- `GET /api/status` - Get all node statuses
- `GET /api/status/:type` - Get specific node status (hub/pds/gateway/backend)
- `POST /api/check` - Force check all nodes

## WebSocket

Connect to `ws://localhost:8080` for real-time updates.

