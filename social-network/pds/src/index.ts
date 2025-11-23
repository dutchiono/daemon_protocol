/**
 * @title Daemon Social Network Personal Data Server (PDS)
 * @notice Personal Data Server for user data hosting and account portability
 */

import express from 'express';
import cors from 'cors';
import { PDSService } from './pds-service.js';
import { ReplicationEngine } from './replication-engine.js';
import { Database } from './database.js';
import type { Config } from './config.js';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize PDS
async function initializePDS(config: Config) {
  // Initialize database
  const db = new Database(config.databaseUrl);

  // Initialize services
  const replicationEngine = new ReplicationEngine(db, config);
  const pdsService = new PDSService(db, replicationEngine, config);

  // Start PDS
  await pdsService.start();

  // Setup API endpoints
  setupAPI(app, pdsService);

  return { pdsService };
}

function setupAPI(app: express.Application, pdsService: PDSService) {
  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', pdsId: pdsService.getPdsId() });
  });

  // User endpoints (AT Protocol compatible)
  app.get('/xrpc/com.atproto.server.describeServer', (req, res) => {
    res.json({
      availableUserDomains: [pdsService.getPdsId()],
      inviteCodeRequired: false
    });
  });

  // Create account
  app.post('/xrpc/com.atproto.server.createAccount', async (req, res) => {
    try {
      const { handle, email, password, inviteCode, walletAddress } = req.body;

      // If walletAddress is provided, use wallet-based signup
      if (walletAddress) {
        const result = await pdsService.createAccountWithWallet(walletAddress, handle);
        res.json(result);
      } else {
        // Traditional email/password signup
        const result = await pdsService.createAccount(handle, email, password, inviteCode);
        res.json(result);
      }
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get user profile
  app.get('/xrpc/com.atproto.repo.getProfile', async (req, res) => {
    try {
      const { did } = req.query;
      const profile = await pdsService.getProfile(did as string);
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Create post
  app.post('/xrpc/com.atproto.repo.createRecord', async (req, res) => {
    try {
      const { repo, collection, record } = req.body;
      const result = await pdsService.createRecord(repo, collection, record);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get user's posts
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

  // Follow operation
  app.post('/xrpc/com.atproto.repo.createRecord', async (req, res) => {
    try {
      const { repo, collection, record } = req.body;
      if (collection === 'app.bsky.graph.follow') {
        const result = await pdsService.createFollow(repo, record);
        res.json(result);
      } else {
        res.status(400).json({ error: 'Invalid collection' });
      }
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Account migration
  app.post('/xrpc/com.atproto.server.migrateAccount', async (req, res) => {
    try {
      const { did, newPds } = req.body;
      const result = await pdsService.migrateAccount(did, newPds);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
}

// Start server
const PORT = process.env.PORT || 4002;
const config: Config = {
  port: parseInt(process.env.PDS_PORT || '4002'),
  databaseUrl: process.env.DATABASE_URL || '',
  pdsId: process.env.PDS_ID || '',
  federationPeers: process.env.FEDERATION_PEERS ? process.env.FEDERATION_PEERS.split(',') : [],
  ipfsGateway: process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs/',
  rpcUrl: process.env.RPC_URL || 'https://sepolia.base.org',
};

// Validate required config
if (!config.databaseUrl || config.databaseUrl.trim() === '') {
  console.error('ERROR: DATABASE_URL is required for PDS');
  console.error('Please set DATABASE_URL environment variable');
  process.exit(1);
}

// Initialize and start server
(async () => {
  try {
    console.log('Initializing PDS...');
    const { pdsService } = await initializePDS(config);

    console.log('PDS initialized successfully, starting server...');

    app.listen(PORT, () => {
      console.log(`PDS server running on port ${PORT}`);
      console.log(`PDS ID: ${pdsService.getPdsId()}`);
      console.log('PDS is ready to accept requests');
    });
  } catch (error) {
    console.error('Failed to initialize PDS:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    process.exit(1);
  }
})();

