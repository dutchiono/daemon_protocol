/**
 * @title Daemon Social Network Hub
 * @notice P2P message relay node for Daemon Social Network
 */

import express from 'express';
import { createLibp2p } from 'libp2p';
import { webSockets } from '@libp2p/websockets';
import { noise } from '@chainsafe/libp2p-noise';
import { mplex } from '@libp2p/mplex';
import { kadDHT } from '@libp2p/kad-dht';
import { bootstrap } from '@libp2p/bootstrap';
import { identify } from '@libp2p/identify';
import { HubService } from './hub-service.js';
import { MessageValidator } from './message-validator.js';
import { SyncEngine } from './sync-engine.js';
import { Database } from './database.js';
import { logger } from './logger.js';
import type { Config } from './config.js';

const app = express();
app.use(express.json());

// Initialize hub
async function initializeHub(config: Config) {
  // Create libp2p node with DHT
  const peerDiscovery = [];

  // Add bootstrap nodes if configured
  if (config.bootstrapNodes && config.bootstrapNodes.length > 0) {
    peerDiscovery.push(
      bootstrap({
        list: config.bootstrapNodes
      })
    );
  }

  const libp2pConfig: any = {
    addresses: {
      // Use a different port for libp2p WebSocket transport to avoid conflict with Express HTTP server
      // Express HTTP uses config.port, libp2p uses config.port + 1000
      listen: [`/ip4/0.0.0.0/tcp/${config.port + 1000}/ws`]
    },
    transports: [webSockets()],
    connectionEncryption: [noise()],
    streamMuxers: [mplex()],
    services: {
      identify: identify(),
      logger: (components: any) => ({
        forComponent: (name: string) => {
          return {
            info: (message: string, ...args: any[]) => logger.info(message, { component: name, args }),
            error: (message: string | Error, ...args: any[]) => {
              if (message instanceof Error) {
                logger.error(message.message, { component: name, args, stack: message.stack });
              } else {
                logger.error(message, { component: name, args });
              }
            },
            warn: (message: string, ...args: any[]) => logger.warn(message, { component: name, args }),
            debug: (message: string, ...args: any[]) => logger.debug(message, { component: name, args }),
            trace: (message: string, ...args: any[]) => logger.debug(message, { component: name, args }),
          };
        }
      })
    }
  };

  // Add DHT if enabled (default: true)
  if (config.enableDHT !== false) {
    libp2pConfig.dht = kadDHT();
    console.log('✅ DHT enabled - automatic node discovery active');

    if (config.bootstrapNodes && config.bootstrapNodes.length > 0) {
      libp2pConfig.peerDiscovery = peerDiscovery;
      console.log(`📡 Bootstrap nodes: ${config.bootstrapNodes.length}`);
    } else {
      console.log('⚠️  No bootstrap nodes configured - DHT will work but may take longer to discover peers');
    }
  } else {
    console.log('⚠️  DHT disabled - using manual peer list only');
  }

  const node = await createLibp2p(libp2pConfig);

  // Log DHT status
  node.addEventListener('peer:discovery', (evt) => {
    console.log(`🔍 Discovered peer via DHT: ${evt.detail.id.toString()}`);
  });

  // Initialize database
  const db = new Database(config.databaseUrl);

  // Initialize services
  const messageValidator = new MessageValidator(config);
  const syncEngine = new SyncEngine(node, db, config);
  const hubService = new HubService(node, db, messageValidator, syncEngine, config);

  // Start hub (this will start the libp2p node)
  await hubService.start();

  // Log node addresses for bootstrap configuration (after node is started)
  const addresses = node.getMultiaddrs();
  if (addresses.length > 0) {
    console.log('📡 Node addresses (use these as BOOTSTRAP_NODES for other nodes):');
    addresses.forEach((addr) => {
      console.log(`   ${addr.toString()}`);
    });
  }

  // Setup API endpoints
  setupAPI(app, hubService);

  return { node, hubService };
}

function setupAPI(app: express.Application, hubService: HubService) {
  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', nodeId: hubService.getNodeId() });
  });

  // Submit message
  app.post('/api/v1/messages', async (req, res) => {
    try {
      const message = req.body;
      const result = await hubService.submitMessage(message);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get message by hash
  app.get('/api/v1/messages/:hash', async (req, res) => {
    try {
      const message = await hubService.getMessage(req.params.hash);
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }
      res.json(message);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get messages by FID
  app.get('/api/v1/messages/fid/:fid', async (req, res) => {
    try {
      const { limit = 100, offset = 0 } = req.query;
      const messages = await hubService.getMessagesByFid(
        parseInt(req.params.fid),
        parseInt(limit as string),
        parseInt(offset as string)
      );
      res.json({ messages, total: messages.length });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get messages by multiple FIDs (batch endpoint)
  app.get('/api/v1/messages/batch', async (req, res) => {
    try {
      const { fids, limit = 100 } = req.query;
      if (!fids || typeof fids !== 'string') {
        return res.status(400).json({ error: 'fids parameter is required (comma-separated)' });
      }
      const fidArray = fids.split(',').map(f => parseInt(f.trim())).filter(f => !isNaN(f) && f > 0);
      if (fidArray.length === 0) {
        return res.json({ messages: [], total: 0 });
      }
      const messages = await hubService.getMessagesByFids(
        fidArray,
        parseInt(limit as string)
      );
      res.json({ messages, total: messages.length });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Sync status
  app.get('/api/v1/sync/status', async (req, res) => {
    try {
      const status = await hubService.getSyncStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Peer information
  app.get('/api/v1/peers', (req, res) => {
    const peers = hubService.getPeers();
    res.json({ peers, count: peers.length });
  });
}

// Start server
const PORT = process.env.PORT || 4001;
const config: Config = {
  port: parseInt(process.env.HUB_PORT || '4001'),
  databaseUrl: process.env.DATABASE_URL || '',
  nodeId: process.env.NODE_ID || '',
  peers: process.env.PEERS ? process.env.PEERS.split(',') : [],
  bootstrapNodes: process.env.BOOTSTRAP_NODES ? process.env.BOOTSTRAP_NODES.split(',') : [],
  rpcUrl: process.env.RPC_URL || '',
  chainId: parseInt(process.env.CHAIN_ID || '84532'), // Base Sepolia default
  enableDHT: process.env.ENABLE_DHT !== 'false',
};

// Validate required config
if (!config.databaseUrl || config.databaseUrl.trim() === '') {
  console.error('ERROR: DATABASE_URL is required for Hub');
  console.error('Please set DATABASE_URL environment variable');
  process.exit(1);
}

// Initialize and start server
(async () => {
  try {
    console.log('Initializing Hub...');
    const { hubService } = await initializeHub(config);

    console.log('Hub initialized successfully, starting server...');

    app.listen(PORT, () => {
      console.log(`Hub server running on port ${PORT}`);
      console.log(`Node ID: ${hubService.getNodeId()}`);
      console.log('Hub is ready to accept requests');
    });
  } catch (error) {
    console.error('Failed to initialize hub:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    process.exit(1);
  }
})();

