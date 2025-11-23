/**
 * @title Daemon Social Network Gateway
 * @notice HTTP API gateway for client access
 */

import cors from 'cors';
import express from 'express';
import { AggregationLayer } from './aggregation-layer.js';
import type { Config } from './config.js';
import { GatewayService } from './gateway-service.js';
import { x402Middleware } from './x402-middleware.js';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize gateway
async function initializeGateway(config: Config) {
  // Initialize services
  const aggregationLayer = new AggregationLayer(config);
  const gatewayService = new GatewayService(aggregationLayer, config);

  // Setup API endpoints BEFORE returning
  setupAPI(app, gatewayService, config);

  // Verify routes were registered
  console.log('API routes registered successfully');

  return { gatewayService };
}

function setupAPI(app: express.Application, gatewayService: GatewayService, config: Config) {
  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', gatewayId: gatewayService.getGatewayId() });
  });

  // Apply x402 middleware to protected routes
  const protectedRoutes = express.Router();
  protectedRoutes.use(x402Middleware(config));

  // Feed endpoints (protected - requires x402 payment)
  protectedRoutes.get('/api/v1/feed', async (req, res) => {
    try {
      const { did, type = 'algorithmic', limit = 50, cursor } = req.query;
      const feed = await gatewayService.getFeed(
        (did as string) || null,
        type as string,
        parseInt(limit as string) || 50,
        cursor as string | undefined
      );
      res.json(feed);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Post endpoints (protected - requires x402 payment)
  protectedRoutes.post('/api/v1/posts', async (req, res) => {
    try {
      const { did, text, parentHash, embeds } = req.body;
      console.log('[Gateway] POST /api/v1/posts - Request body:', { did, text: text?.substring(0, 50), parentHash, hasEmbeds: !!embeds });

      if (!did) {
        console.error('[Gateway] POST /api/v1/posts - Missing did');
        return res.status(400).json({ error: 'did is required' });
      }
      if (!did.startsWith('did:daemon:')) {
        console.error('[Gateway] POST /api/v1/posts - Invalid did format:', did);
        return res.status(400).json({ error: 'Invalid did format. Expected did:daemon:${fid}' });
      }
      if (!text || text.trim().length === 0) {
        console.error('[Gateway] POST /api/v1/posts - Missing or empty text');
        return res.status(400).json({ error: 'text is required and cannot be empty' });
      }

      console.log('[Gateway] POST /api/v1/posts - Creating post for did:', did);
      const result = await gatewayService.createPost(did, text, parentHash, embeds);
      console.log('[Gateway] POST /api/v1/posts - Post created successfully:', result.hash);
      res.json(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error('[Gateway] POST /api/v1/posts - Error:', errorMessage);
      if (errorStack) {
        console.error('[Gateway] POST /api/v1/posts - Stack:', errorStack);
      }
      res.status(400).json({ error: errorMessage });
    }
  });

  protectedRoutes.get('/api/v1/posts/:hash', async (req, res) => {
    try {
      const { did } = req.query;
      const userDid = typeof did === 'string' ? did : null;
      // Express automatically URL-decodes route parameters
      const hash = decodeURIComponent(req.params.hash);
      const post = await gatewayService.getPost(hash, userDid);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get replies for a post
  protectedRoutes.get('/api/v1/posts/:hash/replies', async (req, res) => {
    try {
      // Express automatically URL-decodes route parameters, but decode explicitly to be safe
      const hash = decodeURIComponent(req.params.hash);
      const replies = await gatewayService.getReplies(hash);
      res.json({ replies });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get posts by user DID
  app.get('/api/v1/users/:did/posts', async (req, res) => {
    try {
      const { did } = req.params;
      const { limit = 50, cursor } = req.query;

      // Validate did format
      if (!did || !did.startsWith('did:daemon:')) {
        return res.status(400).json({ error: 'Invalid did format. Expected did:daemon:X' });
      }

      const posts = await gatewayService.getPostsByUser(did, parseInt(limit as string) || 50, cursor as string | undefined);
      res.json({ posts, cursor: posts.length > 0 ? posts[posts.length - 1].hash : undefined });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get replies by user DID
  app.get('/api/v1/users/:did/replies', async (req, res) => {
    try {
      const { did } = req.params;
      const { limit = 50, cursor } = req.query;

      // Validate did format
      if (!did || !did.startsWith('did:daemon:')) {
        return res.status(400).json({ error: 'Invalid did format. Expected did:daemon:X' });
      }

      const replies = await gatewayService.getRepliesByUser(did, parseInt(limit as string) || 50, cursor as string | undefined);
      res.json({ posts: replies, cursor: replies.length > 0 ? replies[replies.length - 1].hash : undefined });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get reactions (likes/reposts/quotes) by user DID
  app.get('/api/v1/users/:did/reactions', async (req, res) => {
    try {
      const { did } = req.params;
      const { type, limit = 50 } = req.query;

      // Validate did format
      if (!did || !did.startsWith('did:daemon:')) {
        return res.status(400).json({ error: 'Invalid did format. Expected did:daemon:X' });
      }

      const reactionType = type && ['like', 'repost', 'quote'].includes(type as string)
        ? (type as 'like' | 'repost' | 'quote')
        : undefined;

      const posts = await gatewayService.getReactionsByUser(did, reactionType, parseInt(limit as string) || 50);
      res.json({ posts });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Lookup DID from wallet address
  app.get('/api/v1/wallet/:address/did', async (req, res) => {
    try {
      const address = req.params.address;
      if (!address || !address.startsWith('0x')) {
        return res.status(400).json({ error: 'Invalid wallet address format' });
      }
      const did = await gatewayService.getDIDFromAddress(address);
      if (!did) {
        return res.status(404).json({ error: 'No DID found for this wallet address' });
      }
      res.json({ did, address });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Profile endpoints (public read, protected write)
  // Accept did in URL: /api/v1/profile/:did
  app.get('/api/v1/profile/:did', async (req, res) => {
    try {
      const did = req.params.did;

      // Validate did format
      if (!did || !did.startsWith('did:daemon:')) {
        return res.status(400).json({ error: 'Invalid did format. Expected did:daemon:${fid}' });
      }

      const profile = await gatewayService.getProfile(did);
      if (!profile) {
        // Return empty profile instead of 404 to make frontend handling easier
        return res.json({
          did,
          username: null,
          displayName: null,
          bio: null,
          avatar: null,
          banner: null,
          website: null,
          verified: false
        });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get user's follows
  app.get('/api/v1/profile/:did/follows', async (req, res) => {
    try {
      const did = decodeURIComponent(req.params.did);

      // Validate did format
      if (!did || !did.startsWith('did:daemon:')) {
        return res.status(400).json({ error: 'Invalid did format. Expected did:daemon:${fid}' });
      }

      const follows = await gatewayService.getFollows(did);
      res.json({ follows: follows.map((followDid) => ({ did: followDid })) });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  protectedRoutes.put('/api/v1/profile/:did', async (req, res) => {
    try {
      const did = req.params.did;

      // Validate did format
      if (!did || !did.startsWith('did:daemon:')) {
        return res.status(400).json({ error: 'Invalid did format. Expected did:daemon:${fid}' });
      }

      const { username, displayName, bio, avatar, banner, website, walletAddress } = req.body;

      const profile = await gatewayService.updateProfile(did, {
        username,
        displayName,
        bio,
        avatar,
        banner,
        website,
        walletAddress // Pass wallet address for PDS account creation
      });

      res.json(profile);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Follow endpoints
  protectedRoutes.post('/api/v1/follow', async (req, res) => {
    try {
      const { followerDid, followingDid } = req.body;
      if (!followerDid || !followingDid) {
        return res.status(400).json({ error: 'followerDid and followingDid are required' });
      }
      const result = await gatewayService.follow(followerDid, followingDid);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  protectedRoutes.post('/api/v1/unfollow', async (req, res) => {
    try {
      const { followerDid, followingDid } = req.body;
      if (!followerDid || !followingDid) {
        return res.status(400).json({ error: 'followerDid and followingDid are required' });
      }
      const result = await gatewayService.unfollow(followerDid, followingDid);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Reaction endpoints
  protectedRoutes.post('/api/v1/reactions', async (req, res) => {
    try {
      const { did, targetHash, type } = req.body;

      // Validate did
      if (!did || typeof did !== 'string' || did.trim() === '') {
        return res.status(400).json({ error: 'did is required and must be a non-empty string' });
      }

      // Validate targetHash
      if (!targetHash || typeof targetHash !== 'string' || targetHash.trim() === '') {
        return res.status(400).json({ error: 'targetHash is required and must be a non-empty string' });
      }

      // Validate type
      if (!type || typeof type !== 'string') {
        return res.status(400).json({ error: 'type is required and must be a string' });
      }

      const validTypes: ('like' | 'repost' | 'quote')[] = ['like', 'repost', 'quote'];
      if (!validTypes.includes(type as 'like' | 'repost' | 'quote')) {
        return res.status(400).json({
          error: `type must be one of: ${validTypes.join(', ')}. Received: ${type}`
        });
      }

      // Type assertion after validation
      const reactionType: 'like' | 'repost' | 'quote' = type as 'like' | 'repost' | 'quote';

      console.log(`[Reactions] Creating reaction: did=${did}, targetHash=${targetHash}, type=${reactionType}`);
      const result = await gatewayService.createReaction(did, targetHash, reactionType);
      res.json(result);
    } catch (error) {
      console.error('[Reactions] Error creating reaction:', error);
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Unknown error occurred while creating reaction'
      });
    }
  });

  // Vote endpoints
  protectedRoutes.post('/api/v1/posts/:hash/vote', async (req, res) => {
    try {
      // Express automatically URL-decodes route parameters, but decode explicitly to be safe
      const hash = decodeURIComponent(req.params.hash);
      const { did, voteType } = req.body;

      if (!did) {
        return res.status(400).json({ error: 'did is required' });
      }
      if (!voteType || (voteType !== 'UP' && voteType !== 'DOWN')) {
        return res.status(400).json({ error: 'voteType must be UP or DOWN' });
      }

      // Type assertion after validation
      const validatedVoteType: 'UP' | 'DOWN' = voteType as 'UP' | 'DOWN';
      const result = await gatewayService.createVote(did, hash, 'post', validatedVoteType);

      // Return updated vote counts
      const votes = await gatewayService.getPostVotes(hash);
      res.json({ ...result, votes });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  protectedRoutes.post('/api/v1/comments/:hash/vote', async (req, res) => {
    try {
      // Express automatically URL-decodes route parameters, but decode explicitly to be safe
      const hash = decodeURIComponent(req.params.hash);
      const { did, voteType } = req.body;

      if (!did) {
        return res.status(400).json({ error: 'did is required' });
      }
      if (!voteType || (voteType !== 'UP' && voteType !== 'DOWN')) {
        return res.status(400).json({ error: 'voteType must be UP or DOWN' });
      }

      // Type assertion after validation
      const validatedVoteType: 'UP' | 'DOWN' = voteType as 'UP' | 'DOWN';
      const result = await gatewayService.createVote(did, hash, 'comment', validatedVoteType);

      // Return updated vote counts
      const votes = await gatewayService.getPostVotes(hash);
      res.json({ ...result, votes });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Search endpoint
  protectedRoutes.get('/api/v1/search', async (req, res) => {
    try {
      const { q, type = 'posts', limit = 20 } = req.query;
      const results = await gatewayService.search(
        q as string,
        type as string,
        parseInt(limit as string)
      );
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get reactions for a post
  protectedRoutes.get('/api/v1/posts/:hash/reactions', async (req, res) => {
    try {
      // Express automatically URL-decodes route parameters, but decode explicitly to be safe
      const hash = decodeURIComponent(req.params.hash);
      const { did } = req.query;
      if (!did || typeof did !== 'string') {
        return res.json({ liked: false, reposted: false });
      }
      const reactions = await gatewayService.getReactions(hash, did);
      res.json(reactions);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Notifications endpoint (public - just a count)
  app.get('/api/v1/notifications/count', async (req, res) => {
    try {
      const { did } = req.query;
      if (!did) {
        return res.status(400).json({ error: 'did is required' });
      }
      if (typeof did !== 'string' || !did.startsWith('did:daemon:')) {
        return res.status(400).json({ error: 'Invalid did format. Expected did:daemon:${fid}' });
      }
      const count = await gatewayService.getUnreadNotificationCount(did);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get notifications
  protectedRoutes.get('/api/v1/notifications', async (req, res) => {
    try {
      const { did } = req.query;
      if (!did || typeof did !== 'string') {
        return res.json({ notifications: [] });
      }
      const notifications = await gatewayService.getNotifications(did);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Mount protected routes
  app.use(protectedRoutes);
}

// Start server
const PORT = process.env.PORT || 4003;
const config: Config = {
  port: parseInt(process.env.GATEWAY_PORT || '4003'),
  gatewayId: process.env.GATEWAY_ID || '',
  hubEndpoints: process.env.HUB_ENDPOINTS ? process.env.HUB_ENDPOINTS.split(',') : [],
  pdsEndpoints: process.env.PDS_ENDPOINTS ? process.env.PDS_ENDPOINTS.split(',') : [],
  databaseUrl: process.env.DATABASE_URL || '',
  redisUrl: process.env.REDIS_URL || '',
  x402ServiceUrl: process.env.X402_SERVICE_URL || 'http://localhost:3000',
  rpcUrl: process.env.RPC_URL || '',
};

// Initialize and start server
(async () => {
  try {
    const { gatewayService } = await initializeGateway(config);

    // Ensure routes are set up before starting server
    console.log('Routes registered, starting server...');

    app.listen(PORT, () => {
      console.log(`Gateway server running on port ${PORT}`);
      console.log(`Gateway ID: ${gatewayService.getGatewayId()}`);
      console.log('Available routes:');
      console.log('  GET  /health');
      console.log('  GET  /api/v1/profile/:did');
      console.log('  PUT  /api/v1/profile/:did');
      console.log('  GET  /api/v1/notifications/count');
      console.log('  GET  /api/v1/feed');
      console.log('  POST /api/v1/posts');
    });
  } catch (error) {
    console.error('Failed to initialize gateway:', error);
    process.exit(1);
  }
})();

