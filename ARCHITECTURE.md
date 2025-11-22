# Daemon Protocol Architecture

## Overview

Daemon Protocol follows a clean separation of concerns with frontend and backend services properly separated.

## Architecture

```
┌─────────────────┐
│   Launchpad     │  Frontend (React/Vite)
│   (Frontend)    │  Separate process
└────────┬────────┘
         │
         │ HTTP API
         │
┌────────▼────────┐
│    Backend      │  Express API Server
│   (Backend)     │  + Telegram Bot Service
│                 │  Single process
└─────────────────┘
```

## Components

### 1. **Launchpad** (Frontend)
- **Location**: `daemon/launchpad/`
- **Type**: React/Vite frontend
- **Purpose**: Web UI for token launches
- **Separation**: ✅ Separate process (correct for frontend)
- **Communication**: HTTP API calls to backend

### 2. **Backend** (API Server + Services)
- **Location**: `daemon/backend/`
- **Type**: Express.js API server
- **Components**:
  - REST API endpoints
  - Telegram Bot service (integrated)
  - Agent service
  - All backend services
- **Separation**: ✅ Single process (correct for backend services)

### 3. **Agent** (Library)
- **Location**: `daemon/agent/`
- **Type**: TypeScript library
- **Purpose**: Agent logic, prompts, tools
- **Usage**: Imported by backend services

## Why This Architecture?

### ✅ Frontend Separate (Launchpad)
- **Reason**: Frontend should be separate for:
  - Independent deployment
  - Different scaling needs
  - CDN hosting
  - Client-side optimizations

### ✅ Backend Services Together (API + Telegram Bot)
- **Reason**: Backend services should be together because:
  - They share the same dependencies
  - They use the same agent/API logic
  - Simpler deployment (one process)
  - No HTTP overhead between services
  - Shared session management
  - Easier to maintain

## Communication Flow

### Launchpad → Backend
```
Launchpad (Frontend)
    ↓ HTTP Request
Backend API (/api/ai/chat, /factory/launch, etc.)
    ↓
Response
```

### Telegram → Backend
```
Telegram Message
    ↓
Telegram Bot Service (in backend process)
    ↓ Direct function call (no HTTP)
Agent Service
    ↓
Response
```

## Benefits

1. **Consistency**: Frontend separate, backend services together
2. **Performance**: Telegram bot calls agent directly (no HTTP overhead)
3. **Simplicity**: One backend process to manage
4. **Maintainability**: Related services in one place
5. **Scalability**: Can still scale frontend and backend independently

## Deployment

### Development
```bash
# Terminal 1: Backend (includes Telegram bot)
npm run dev:backend

# Terminal 2: Frontend
npm run dev:launchpad
```

### Production
```bash
# Backend (API + Telegram bot)
cd backend && npm start

# Frontend (build and serve)
cd launchpad && npm run build && npm run preview
```

## Environment Variables

### Backend (includes Telegram bot)
```bash
AGENT_API_KEY=...          # For agent
TELEGRAM_BOT_TOKEN=...     # For Telegram bot
PORT=3000                  # API server port
# ... other backend vars
```

### Frontend
```bash
VITE_API_URL=http://localhost:3000  # Backend URL
# ... other frontend vars
```

## Summary

- ✅ **Launchpad**: Separate frontend (correct)
- ✅ **Backend**: API + Telegram bot together (correct)
- ✅ **Agent**: Shared library used by backend
- ✅ **Clean separation**: Frontend vs backend, not frontend vs backend services

This architecture is consistent, maintainable, and follows best practices.

