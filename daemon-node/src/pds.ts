/**
 * @title PDS Node Runner
 * @notice Starts PDS node
 */

import express from 'express';
import { Database } from '../../social-network/pds/src/database.js';
import { ReplicationEngine } from '../../social-network/pds/src/replication-engine.js';
import { PDSService } from '../../social-network/pds/src/pds-service.js';

export interface PDSConfig {
  port: number;
  databaseUrl: string;
  federationPeers?: string[];
}

export async function startPDS(config: PDSConfig) {
  console.log('Starting PDS node...');
  console.log(`Port: ${config.port}`);

  const app = express();
  app.use(express.json());

  const db = new Database(config.databaseUrl);
  const replicationEngine = new ReplicationEngine(db, {
    port: config.port,
    databaseUrl: config.databaseUrl,
    pdsId: `pds-${config.port}`,
    federationPeers: config.federationPeers || [],
    ipfsGateway: 'https://ipfs.io/ipfs/',
  });
  const pdsService = new PDSService(db, replicationEngine, {
    port: config.port,
    databaseUrl: config.databaseUrl,
    pdsId: `pds-${config.port}`,
    federationPeers: config.federationPeers || [],
    ipfsGateway: 'https://ipfs.io/ipfs/',
  });

  await pdsService.start();

  // Setup API (AT Protocol compatible)
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', pdsId: pdsService.getPdsId() });
  });

  app.get('/xrpc/com.atproto.server.describeServer', (req, res) => {
    res.json({
      availableUserDomains: [pdsService.getPdsId()],
      inviteCodeRequired: false
    });
  });

  app.post('/xrpc/com.atproto.server.createAccount', async (req, res) => {
    try {
      const { handle, email, password } = req.body;
      const result = await pdsService.createAccount(handle, email, password);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post('/xrpc/com.atproto.repo.createRecord', async (req, res) => {
    try {
      const { repo, collection, record } = req.body;
      const result = await pdsService.createRecord(repo, collection, record);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get('/xrpc/com.atproto.repo.listRecords', async (req, res) => {
    try {
      const { repo, collection, limit = 50, cursor } = req.query;
      const result = await pdsService.listRecords(
        repo as string,
        collection as string,
        parseInt(limit as string),
        cursor as string | undefined
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

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
  const serverUrl = `http://${serverHost}:${config.port}`;

  const server = app.listen(config.port, '0.0.0.0', () => {
    console.log(`✅ PDS running on port ${config.port}`);
    console.log(`   PDS ID: ${pdsService.getPdsId()}`);
    console.log(`   Hostname: ${hostname}`);
    console.log(`   Server IP: ${serverHost}`);
    
    console.log(`\n   📡 Client API Endpoints (AT Protocol):`);
    console.log(`   ${serverUrl}/health`);
    console.log(`   ${serverUrl}/xrpc/com.atproto.server.describeServer`);
    console.log(`   ${serverUrl}/xrpc/com.atproto.server.createAccount`);
    console.log(`   ${serverUrl}/xrpc/com.atproto.repo.createRecord`);
    console.log(`   ${serverUrl}/xrpc/com.atproto.repo.listRecords`);
  }).on('error', (error: any) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`\n❌ ERROR: Port ${config.port} is already in use!`);
      console.error(`   Another process is running on port ${config.port}`);
      console.error(`   Kill the existing process first: lsof -ti:${config.port} | xargs kill -9`);
      console.error(`   Or choose a different port.\n`);
      process.exit(1);
    } else {
      console.error(`❌ ERROR starting PDS server:`, error);
      throw error;
    }
  });

  return {
    stop: async () => {
      await pdsService.stop();
      server.close();
    }
  };
}

