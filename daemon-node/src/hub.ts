/**
 * @title Hub Node Runner
 * @notice Starts Hub node with DHT support
 */

import { noise } from '@chainsafe/libp2p-noise';
import { autoNAT } from '@libp2p/autonat';
import { bootstrap } from '@libp2p/bootstrap';
import { identify } from '@libp2p/identify';
import { kadDHT } from '@libp2p/kad-dht';
import { mplex } from '@libp2p/mplex';
import { uPnPNAT } from '@libp2p/upnp-nat';
import { webSockets } from '@libp2p/websockets';
import express from 'express';
import { createLibp2p } from 'libp2p';
import { Database } from '../../social-network/hub/src/database.js';
import { HubService } from '../../social-network/hub/src/hub-service.js';
import { MessageValidator } from '../../social-network/hub/src/message-validator.js';
import { SyncEngine } from '../../social-network/hub/src/sync-engine.js';
import { logger } from './logger.js';

export interface HubConfig {
  port: number;
  databaseUrl: string;
  rpcUrl: string;
  bootstrapNodes?: string[];
}

export async function startHub(config: HubConfig) {
  console.log('Starting Hub node...');
  console.log(`Port: ${config.port}`);
  console.log(`Bootstrap nodes: ${config.bootstrapNodes?.length || 0}`);

  const app = express();
  app.use(express.json());

  // Create libp2p node with DHT
  const peerDiscovery = [];
  if (config.bootstrapNodes && config.bootstrapNodes.length > 0) {
    peerDiscovery.push(bootstrap({ list: config.bootstrapNodes }));
  }

  const libp2pConfig: any = {
    addresses: {
      listen: [`/ip4/0.0.0.0/tcp/${config.port}/ws`]
    },
    transports: [webSockets()],
    connectionEncryption: [noise()],
    streamMuxers: [mplex()],
    services: {
      identify: identify(),
      autoNAT: autoNAT(),
      uPnPNAT: uPnPNAT(),
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

  // Add DHT
  libp2pConfig.dht = kadDHT();
  if (peerDiscovery.length > 0) {
    libp2pConfig.peerDiscovery = peerDiscovery;
  }

  const node = await createLibp2p(libp2pConfig);

  // Log DHT events
  node.addEventListener('peer:discovery', (evt: any) => {
    console.log(`🔍 Discovered peer: ${evt.detail.id.toString()}`);
  });

  node.addEventListener('peer:connect', (evt: any) => {
    console.log(`✅ Connected to peer: ${evt.detail.toString()}`);
  });

  // Initialize services
  const db = new Database(config.databaseUrl);
  const validator = new MessageValidator({
    port: config.port,
    databaseUrl: config.databaseUrl,
    nodeId: `hub-${config.port}`,
    peers: [],
    bootstrapNodes: config.bootstrapNodes,
    rpcUrl: config.rpcUrl,
    chainId: 84532,
  });
  const syncEngine = new SyncEngine(node, db, {
    port: config.port,
    databaseUrl: config.databaseUrl,
    nodeId: `hub-${config.port}`,
    peers: [],
    bootstrapNodes: config.bootstrapNodes,
    rpcUrl: config.rpcUrl,
    chainId: 84532,
  });
  const hubService = new HubService(node, db, validator, syncEngine, {
    port: config.port,
    databaseUrl: config.databaseUrl,
    nodeId: `hub-${config.port}`,
    peers: [],
    bootstrapNodes: config.bootstrapNodes,
    rpcUrl: config.rpcUrl,
    chainId: 84532,
  });

  await hubService.start();

  // Setup API
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', nodeId: hubService.getNodeId() });
  });

  app.post('/api/v1/messages', async (req, res) => {
    try {
      const result = await hubService.submitMessage(req.body);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get('/api/v1/messages/:hash', async (req, res) => {
    try {
      const message = await hubService.getMessage(req.params.hash);
      if (!message) return res.status(404).json({ error: 'Not found' });
      res.json(message);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get('/api/v1/peers', (req, res) => {
    res.json({ peers: hubService.getPeers(), count: hubService.getPeers().length });
  });

  let serverStarted = false;
  const server = app.listen(config.port, () => {
    serverStarted = true;
    console.log(`✅ Hub running on port ${config.port}`);
    console.log(`   Node ID: ${hubService.getNodeId()}`);
    console.log(`   DHT: Enabled`);

    console.log('   Addresses:');
    node.getMultiaddrs().forEach((ma) => {
      console.log(`   - ${ma.toString()}`);
    });

    if (config.bootstrapNodes && config.bootstrapNodes.length > 0) {
      console.log(`   Bootstrap: ${config.bootstrapNodes.length} nodes`);
    }
  });

  server.on('error', (error: any) => {
    // Only handle errors if server hasn't started yet
    if (!serverStarted && error.code === 'EADDRINUSE') {
      console.error(`\n❌ ERROR: Port ${config.port} is already in use!`);
      console.error(`   Another process is running on port ${config.port}`);
      console.error(`   Kill the existing process: lsof -ti:${config.port} | xargs kill -9`);
      console.error(`   Or choose a different port.\n`);
      process.exit(1);
    } else if (!serverStarted) {
      console.error(`❌ ERROR starting Hub server:`, error);
      throw error;
    }
    // Ignore errors after server has started (they might be connection errors, etc.)
  });

  // Log address updates (NAT traversal success)
  node.addEventListener('self:peer:update', () => {
    console.log('🔄 Node addresses updated (NAT/UPnP):');
    node.getMultiaddrs().forEach((ma) => {
      console.log(`   - ${ma.toString()}`);
    });
  });

  return {
    stop: async () => {
      await hubService.stop();
      await node.stop();
      server.close();
    }
  };
}

