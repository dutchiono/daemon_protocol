/**
 * @title Start All Nodes
 * @notice Runs Hub, PDS, and Gateway together in one process
 */

// Polyfill for Node.js < 22 compatibility (must be first import)
import './polyfill.js';

// Ensure .env is loaded (in case this is imported directly)
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { startGateway } from './gateway.js';
import { startHub } from './hub.js';
import { startPDS } from './pds.js';

export interface AllConfig {
  databaseUrl: string;
  rpcUrl: string;
  bootstrapNodes?: string[];
}

export async function startAll(config: AllConfig) {
  console.log('========================================');
  console.log('Daemon Social Network - Starting All Nodes');
  console.log('========================================\n');

  // Load bootstrap nodes from env if not provided
  const bootstrapNodes = config.bootstrapNodes ||
    (process.env.BOOTSTRAP_PEERS ? process.env.BOOTSTRAP_PEERS.split(',') : []);

  if (bootstrapNodes.length > 0) {
    console.log(`📡 Bootstrap nodes: ${bootstrapNodes.length}`);
  } else {
    console.log('⚠️  No bootstrap nodes - first node will be bootstrap');
  }

  // Start all nodes in parallel
  const [hub, pds, gateway] = await Promise.all([
    startHub({
      port: 4001,
      databaseUrl: config.databaseUrl,
      rpcUrl: config.rpcUrl,
      bootstrapNodes: bootstrapNodes,
    }),
    startPDS({
      port: 4002,
      databaseUrl: config.databaseUrl,
      federationPeers: [],
    }),
    startGateway({
      port: 4003,
      databaseUrl: config.databaseUrl,
      hubEndpoints: ['http://localhost:4001'],
      pdsEndpoints: ['http://localhost:4002'],
    }),
  ]);

  // Get server hostname/IP for displaying client endpoints
  const os = await import('os');
  const networkInterfaces = os.networkInterfaces();
  let serverHost = 'localhost';
  for (const interfaceName of Object.keys(networkInterfaces)) {
    const addresses = networkInterfaces[interfaceName];
    if (addresses) {
      for (const addr of addresses) {
        if (addr.family === 'IPv4' && !addr.internal) {
          serverHost = addr.address;
          break;
        }
      }
      if (serverHost !== 'localhost') break;
    }
  }
  const hostname = os.hostname();

  console.log('\n========================================');
  console.log('✅ All nodes started successfully!');
  console.log('========================================');
  console.log(`Server: ${hostname} (${serverHost})`);
  console.log('\n📍 Client Endpoints:');
  console.log(`   Hub HTTP API:     http://${serverHost}:4001`);
  console.log(`   Hub libp2p WS:    ws://${serverHost}:5001`);
  console.log(`   PDS AT Protocol:  http://${serverHost}:4002`);
  console.log(`   Gateway REST API: http://${serverHost}:4003`);
  console.log('\nPress Ctrl+C to stop all nodes\n');

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\nShutting down nodes...');
    await Promise.all([
      hub?.stop(),
      pds?.stop(),
      gateway?.stop(),
    ]);
    process.exit(0);
  });
}

