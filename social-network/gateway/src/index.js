/**
 * @title Daemon Social Network Gateway
 * @notice HTTP API gateway for client access
 */
import express from 'express';
import cors from 'cors';
import { GatewayService } from './gateway-service.js';
import { x402Middleware } from './x402-middleware.js';
import { AggregationLayer } from './aggregation-layer.js';
const app = express();
app.use(cors());
app.use(express.json());
// Initialize gateway
async function initializeGateway(config) {
    // Initialize services
    const aggregationLayer = new AggregationLayer(config);
    const gatewayService = new GatewayService(aggregationLayer, config);
    // Setup API endpoints
    setupAPI(app, gatewayService, config);
    return { gatewayService };
}
function setupAPI(app, gatewayService, config) {
    // Health check
    app.get('/health', (req, res) => {
        res.json({ status: 'ok', gatewayId: gatewayService.getGatewayId() });
    });
    // Apply x402 middleware to protected routes
    const protectedRoutes = express.Router();
    protectedRoutes.use(x402Middleware(config));
    // Feed endpoints
    protectedRoutes.get('/api/v1/feed', async (req, res) => {
        try {
            const { fid, type = 'algorithmic', limit = 50, cursor } = req.query;
            const feed = await gatewayService.getFeed(parseInt(fid), type, parseInt(limit), cursor);
            res.json(feed);
        }
        catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
    });
    // Post endpoints
    protectedRoutes.post('/api/v1/posts', async (req, res) => {
        try {
            const { did, text, parentHash, embeds } = req.body;
            // Gateway service expects fid, but we're using did now
            // Convert did to fid if needed, or update gateway service to accept did
            // For now, pass did directly - aggregation layer accepts did
            const result = await gatewayService.createPost(did, text, parentHash, embeds);
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
    });
    protectedRoutes.get('/api/v1/posts/:hash', async (req, res) => {
        try {
            const post = await gatewayService.getPost(req.params.hash);
            if (!post) {
                return res.status(404).json({ error: 'Post not found' });
            }
            res.json(post);
        }
        catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
    });
    // Profile endpoints (public read, protected write)
    app.get('/api/v1/profile/:fid', async (req, res) => {
        try {
            const fid = parseInt(req.params.fid);
            const profile = await gatewayService.getProfile(fid);
            if (!profile) {
                // Return empty profile instead of 404 to make frontend handling easier
                return res.json({
                    fid,
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
        }
        catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
    });
    // Follow endpoints
    protectedRoutes.post('/api/v1/follow', async (req, res) => {
        try {
            const { followerFid, followingFid } = req.body;
            const result = await gatewayService.follow(followerFid, followingFid);
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
    });
    protectedRoutes.post('/api/v1/unfollow', async (req, res) => {
        try {
            const { followerFid, followingFid } = req.body;
            const result = await gatewayService.unfollow(followerFid, followingFid);
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
    });
    // Reaction endpoints
    protectedRoutes.post('/api/v1/reactions', async (req, res) => {
        try {
            const { fid, targetHash, type } = req.body;
            const result = await gatewayService.createReaction(fid, targetHash, type);
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
    });
    // Search endpoint
    protectedRoutes.get('/api/v1/search', async (req, res) => {
        try {
            const { q, type = 'posts', limit = 20 } = req.query;
            const results = await gatewayService.search(q, type, parseInt(limit));
            res.json(results);
        }
        catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
    });
    // Notifications endpoint (public - just a count)
    app.get('/api/v1/notifications/count', async (req, res) => {
        try {
            const { fid } = req.query;
            if (!fid) {
                return res.status(400).json({ error: 'fid is required' });
            }
            const count = await gatewayService.getUnreadNotificationCount(parseInt(fid));
            res.json({ count });
        }
        catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
    });
    // Mount protected routes
    app.use(protectedRoutes);
}
// Start server
const PORT = process.env.PORT || 4003;
const config = {
    port: parseInt(process.env.GATEWAY_PORT || '4003'),
    gatewayId: process.env.GATEWAY_ID || '',
    hubEndpoints: process.env.HUB_ENDPOINTS ? process.env.HUB_ENDPOINTS.split(',') : [],
    pdsEndpoints: process.env.PDS_ENDPOINTS ? process.env.PDS_ENDPOINTS.split(',') : [],
    databaseUrl: process.env.DATABASE_URL || '',
    redisUrl: process.env.REDIS_URL || '',
    x402ServiceUrl: process.env.X402_SERVICE_URL || 'http://localhost:3000',
};
initializeGateway(config).then(({ gatewayService }) => {
    app.listen(PORT, () => {
        console.log(`Gateway server running on port ${PORT}`);
        console.log(`Gateway ID: ${gatewayService.getGatewayId()}`);
    });
}).catch((error) => {
    console.error('Failed to initialize gateway:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map
