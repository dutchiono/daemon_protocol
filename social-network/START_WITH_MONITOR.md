# Start Everything with Monitoring

## One-Command Start Script

Create a script to start all nodes + monitor:

```bash
# start-all.sh
#!/bin/bash

echo "Starting Daemon Social Network..."

# Terminal 1: Hub
gnome-terminal -- bash -c "cd social-network/hub && npm run dev; exec bash"

# Terminal 2: PDS
gnome-terminal -- bash -c "cd social-network/pds && npm run dev; exec bash"

# Terminal 3: Gateway
gnome-terminal -- bash -c "cd social-network/gateway && npm run dev; exec bash"

# Terminal 4: Backend
gnome-terminal -- bash -c "cd backend && npm run dev; exec bash"

# Terminal 5: Monitor
gnome-terminal -- bash -c "cd monitoring && npm start; exec bash"

echo "All services starting..."
echo "Monitor: http://localhost:4000"
```

## Or Use PM2 (Process Manager)

```bash
npm install -g pm2

# Start all with PM2
pm2 start social-network/hub/src/index.ts --name hub --interpreter tsx
pm2 start social-network/pds/src/index.ts --name pds --interpreter tsx
pm2 start social-network/gateway/src/index.ts --name gateway --interpreter tsx
pm2 start backend/server.ts --name backend --interpreter tsx
pm2 start monitoring/server.ts --name monitor --interpreter tsx

# View dashboard
pm2 monit

# View logs
pm2 logs

# Stop all
pm2 stop all
```

## Docker Compose (Future)

For production, we should create a `docker-compose.yml` to orchestrate everything.

