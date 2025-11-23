/**
 * @title Gateway Service
 * @notice Core gateway service for API aggregation
 */

import { AggregationLayer } from './aggregation-layer.js';
import type { Config } from './config.js';
import type { Post, Profile, Feed, Reaction } from './types.js';
import { didToFid, fidToDid } from './did-utils.js';

export class GatewayService {
  private aggregationLayer: AggregationLayer;
  private config: Config;

  constructor(aggregationLayer: AggregationLayer, config: Config) {
    this.aggregationLayer = aggregationLayer;
    this.config = config;
  }

  async getFeed(
    did: string | null,
    type: string,
    limit: number,
    cursor?: string
  ): Promise<Feed> {
    try {
      // If did is null or empty, return empty feed or general feed
      if (!did) {
        // Return empty feed for now - could be extended to show general feed
        return { posts: [], cursor: undefined };
      }

      // Convert did to fid for internal operations
      const fid = didToFid(did);

      // Get user's follows
      const follows = await this.aggregationLayer.getFollows(fid);

      // Get posts from followed users
      const posts = await this.aggregationLayer.getPostsFromUsers(
        follows,
        type,
        limit,
        cursor
      );

      // Rank posts (algorithmic or chronological)
      const rankedPosts = type === 'algorithmic'
        ? await this.rankPostsAlgorithmically(posts, did)
        : posts.sort((a, b) => b.timestamp - a.timestamp);

      return {
        posts: rankedPosts.slice(0, limit),
        cursor: rankedPosts.length > limit ? rankedPosts[limit - 1].hash : undefined
      };
    } catch (error) {
      console.error('Error in getFeed:', error);
      // Return empty feed on error instead of throwing
      return { posts: [], cursor: undefined };
    }
  }

  async createPost(
    did: string,
    text: string,
    parentHash?: string,
    embeds?: any[]
  ): Promise<Post> {
    // Create post via aggregation layer
    const post = await this.aggregationLayer.createPost(did, text, parentHash, embeds);

    return post;
  }

  async getPost(hash: string): Promise<Post | null> {
    return await this.aggregationLayer.getPost(hash);
  }

  async getProfile(did: string): Promise<Profile | null> {
    return await this.aggregationLayer.getProfile(did);
  }

  async updateProfile(
    did: string,
    updates: {
      username?: string;
      displayName?: string;
      bio?: string;
      avatar?: string;
      banner?: string;
      website?: string;
    }
  ): Promise<Profile> {
    return await this.aggregationLayer.updateProfile(did, updates);
  }

  async follow(followerDid: string, followingDid: string): Promise<{ success: boolean }> {
    await this.aggregationLayer.createFollow(followerDid, followingDid);
    return { success: true };
  }

  async unfollow(followerDid: string, followingDid: string): Promise<{ success: boolean }> {
    const followerFid = didToFid(followerDid);
    const followingFid = didToFid(followingDid);
    await this.aggregationLayer.deleteFollow(followerFid, followingFid);
    return { success: true };
  }

  async createReaction(
    did: string,
    targetHash: string,
    type: 'like' | 'repost' | 'quote'
  ): Promise<Reaction> {
    const fid = didToFid(did);
    return await this.aggregationLayer.createReaction(fid, targetHash, type);
  }

  async search(query: string, type: string, limit: number): Promise<any> {
    if (type === 'posts') {
      return await this.aggregationLayer.searchPosts(query, limit);
    } else if (type === 'users') {
      return await this.aggregationLayer.searchUsers(query, limit);
    }
    return { results: [] };
  }

  async getUnreadNotificationCount(did: string): Promise<number> {
    return await this.aggregationLayer.getUnreadNotificationCount(did);
  }

  private async rankPostsAlgorithmically(posts: Post[], did: string): Promise<Post[]> {
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

  getGatewayId(): string {
    return this.config.gatewayId;
  }
}

