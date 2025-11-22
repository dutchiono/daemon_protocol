/**
 * @title Monitoring Server
 * @notice Monitors all Daemon Social Network nodes and provides dashboard
 */

import express from 'express';
import { WebSocketServer } from 'ws';
import cron from 'node-cron';

const app = express();
app.use(express.json());
app.use(express.static('public'));

interface NodeStatus {
  type: 'hub' | 'pds' | 'gateway' | 'backend';
  endpoint: string;
  status: 'online' | 'offline' | 'error';
  lastCheck: number;
  responseTime?: number;
  error?: string;
  metrics?: any;
}

const nodeConfigs = [
  { type: 'hub' as const, endpoint: process.env.HUB_ENDPOINT || 'http://localhost:4001' },
  { type: 'pds' as const, endpoint: process.env.PDS_ENDPOINT || 'http://localhost:4002' },
  { type: 'gateway' as const, endpoint: process.env.GATEWAY_ENDPOINT || 'http://localhost:4003' },
  { type: 'backend' as const, endpoint: process.env.BACKEND_ENDPOINT || 'http://localhost:3000' },
];

const nodeStatuses: Map<string, NodeStatus> = new Map();

// Check node health
async function checkNode(node: typeof nodeConfigs[0]): Promise<NodeStatus> {
  const startTime = Date.now();
  try {
    const response = await fetch(`${node.endpoint}/health`, {
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    const responseTime = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      return {
        type: node.type,
        endpoint: node.endpoint,
        status: 'online',
        lastCheck: Date.now(),
        responseTime,
        metrics: data
      };
    } else {
      return {
        type: node.type,
        endpoint: node.endpoint,
        status: 'error',
        lastCheck: Date.now(),
        responseTime,
        error: `HTTP ${response.status}`
      };
    }
  } catch (error) {
    return {
      type: node.type,
      endpoint: node.endpoint,
      status: 'offline',
      lastCheck: Date.now(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Check all nodes
async function checkAllNodes() {
  console.log(`[${new Date().toISOString()}] Checking nodes...`);

  for (const node of nodeConfigs) {
    const status = await checkNode(node);
    nodeStatuses.set(node.endpoint, status);

    const icon = status.status === 'online' ? '✅' : '❌';
    console.log(`${icon} ${node.type.toUpperCase()}: ${status.status} (${status.responseTime || 'N/A'}ms)`);
  }
}

// API: Get all node statuses
app.get('/api/status', (req, res) => {
  const statuses = Array.from(nodeStatuses.values());
  res.json({
    nodes: statuses,
    summary: {
      total: statuses.length,
      online: statuses.filter(s => s.status === 'online').length,
      offline: statuses.filter(s => s.status === 'offline').length,
      errors: statuses.filter(s => s.status === 'error').length
    },
    timestamp: Date.now()
  });
});

// API: Get specific node status
app.get('/api/status/:type', (req, res) => {
  const { type } = req.params;
  const node = nodeConfigs.find(n => n.type === type);
  if (!node) {
    return res.status(404).json({ error: 'Node type not found' });
  }
  const status = nodeStatuses.get(node.endpoint);
  res.json(status || { error: 'Not checked yet' });
});

// API: Force check all nodes
app.post('/api/check', async (req, res) => {
  await checkAllNodes();
  res.json({ message: 'Check complete', timestamp: Date.now() });
});

// WebSocket for real-time updates
const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Client connected to monitoring');

  // Send current status
  const statuses = Array.from(nodeStatuses.values());
  ws.send(JSON.stringify({ type: 'status', data: statuses }));

  // Send updates every 5 seconds
  const interval = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      const statuses = Array.from(nodeStatuses.values());
      ws.send(JSON.stringify({ type: 'update', data: statuses }));
    } else {
      clearInterval(interval);
    }
  }, 5000);

  ws.on('close', () => {
    clearInterval(interval);
    console.log('Client disconnected');
  });
});

// Check nodes every 10 seconds
cron.schedule('*/10 * * * * *', checkAllNodes);

// Initial check
checkAllNodes();

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log('========================================');
  console.log('Daemon Social Network Monitor');
  console.log('========================================');
  console.log(`Dashboard: http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api/status`);
  console.log(`WebSocket: ws://localhost:8080`);
  console.log('');
  console.log('Monitoring nodes:');
  nodeConfigs.forEach(node => {
    console.log(`  - ${node.type}: ${node.endpoint}`);
  });
  console.log('');
  console.log('Checking nodes every 10 seconds...');
});

