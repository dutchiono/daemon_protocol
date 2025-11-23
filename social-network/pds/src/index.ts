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
        console.log(`[PDS] Creating wallet account: ${walletAddress}, handle: ${handle || 'auto-generated'}`);
        const result = await pdsService.createAccountWithWallet(walletAddress, handle);
        console.log(`[PDS] Wallet account created successfully: ${result.did}, handle: ${result.handle}`);
        res.json(result);
      } else {
        // Traditional email/password signup
        console.log(`[PDS] Creating email account: ${handle}`);
        const result = await pdsService.createAccount(handle, email, password, inviteCode);
        console.log(`[PDS] Email account created successfully: ${result.did}, handle: ${result.handle}`);
        res.json(result);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[PDS] Account creation failed:`, errorMessage);
      if (error instanceof Error && error.stack) {
        console.error(`[PDS] Stack trace:`, error.stack);
      }
      res.status(400).json({ error: errorMessage });
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

  // Create record (posts, follows, etc.) - consolidated handler
  app.post('/xrpc/com.atproto.repo.createRecord', async (req, res) => {
    try {
      const { repo, collection, record } = req.body;

      // Log full request body for debugging
      console.log('[PDS] POST /xrpc/com.atproto.repo.createRecord - Request body:', {
        repo,
        collection,
        record: JSON.stringify(record, null, 2),
        recordType: typeof record,
        recordKeys: record ? Object.keys(record) : []
      });

      // Route based on collection type
      if (collection === 'app.bsky.graph.follow') {
        // Handle follow operation
        console.log('[PDS] Creating follow record for repo:', repo);
        const result = await pdsService.createFollow(repo, record);
        console.log('[PDS] Follow record created successfully:', result.uri);
        res.json(result);
      } else if (collection === 'app.bsky.feed.post') {
        // Handle post creation
        console.log('[PDS] Creating post record for repo:', repo);
        const result = await pdsService.createRecord(repo, collection, record);
        console.log('[PDS] Post record created successfully:', result.uri);
        res.json(result);
      } else {
        // Handle other record types
        console.log('[PDS] Creating record for collection:', collection);
        const result = await pdsService.createRecord(repo, collection, record);
        console.log('[PDS] Record created successfully:', result.uri);
        res.json(result);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error('[PDS] POST /xrpc/com.atproto.repo.createRecord - Error:', errorMessage);
      if (errorStack) {
        console.error('[PDS] Stack trace:', errorStack);
      }
      console.error('[PDS] Request body that caused error:', JSON.stringify(req.body, null, 2));
      res.status(400).json({ error: errorMessage });
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

