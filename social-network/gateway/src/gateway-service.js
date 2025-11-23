/**
 * @title Gateway Service
 * @notice Core gateway service for API aggregation
 */
export class GatewayService {
    aggregationLayer;
    config;
    constructor(aggregationLayer, config) {
        this.aggregationLayer = aggregationLayer;
        this.config = config;
    }
    async getFeed(fid, type, limit, cursor) {
        // Get user's follows
        const follows = await this.aggregationLayer.getFollows(fid);
        // Get posts from followed users
        const posts = await this.aggregationLayer.getPostsFromUsers(follows, type, limit, cursor);
        // Rank posts (algorithmic or chronological)
        const rankedPosts = type === 'algorithmic'
            ? await this.rankPostsAlgorithmically(posts, fid)
            : posts.sort((a, b) => b.timestamp - a.timestamp);
        return {
            posts: rankedPosts.slice(0, limit),
            cursor: rankedPosts.length > limit ? rankedPosts[limit - 1].hash : undefined
        };
    }
    async createPost(fid, text, parentHash, embeds) {
        // Create post via aggregation layer
        const post = await this.aggregationLayer.createPost(fid, text, parentHash, embeds);
        return post;
    }
    async getPost(hash) {
        return await this.aggregationLayer.getPost(hash);
    }
    async getProfile(fid) {
        return await this.aggregationLayer.getProfile(fid);
    }
    async follow(followerFid, followingFid) {
        await this.aggregationLayer.createFollow(followerFid, followingFid);
        return { success: true };
    }
    async unfollow(followerFid, followingFid) {
        await this.aggregationLayer.deleteFollow(followerFid, followingFid);
        return { success: true };
    }
    async createReaction(fid, targetHash, type) {
        return await this.aggregationLayer.createReaction(fid, targetHash, type);
    }
    async search(query, type, limit) {
        if (type === 'posts') {
            return await this.aggregationLayer.searchPosts(query, limit);
        }
        else if (type === 'users') {
            return await this.aggregationLayer.searchUsers(query, limit);
        }
        return { results: [] };
    }
    async getUnreadNotificationCount(fid) {
        return await this.aggregationLayer.getUnreadNotificationCount(fid);
    }
    async rankPostsAlgorithmically(posts, fid) {
        // Simple algorithmic ranking based on:
        // - Recency (time decay)
        // - Engagement (likes, reposts, replies)
        // - User interactions (follows, previous engagement)
        const now = Date.now() / 1000;
        const scored = posts.map(post => {
            const age = now - post.timestamp;
            const timeScore = Math.exp(-age / (7 * 24 * 60 * 60)); // 7 day half-life
            // Engagement score (would need to fetch reactions)
            const engagementScore = 1.0; // Placeholder
            // Combined score
            const score = timeScore * 0.6 + engagementScore * 0.4;
            return { post, score };
        });
        return scored
            .sort((a, b) => b.score - a.score)
            .map(item => item.post);
    }
    getGatewayId() {
        return this.config.gatewayId;
    }
}
//# sourceMappingURL=gateway-service.js.map
