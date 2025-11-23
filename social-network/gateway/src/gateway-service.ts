/**
 * @title Gateway Service
 * @notice Core gateway service for API aggregation
 */

import { AggregationLayer } from './aggregation-layer.js';
import type { Config } from './config.js';
import type { Post, Profile, Feed, Reaction, Vote } from './types.js';
// Removed didToFid/fidToDid imports - using DIDs directly throughout

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
      // If type is 'global' or 'all', show all posts from everyone
      if (type === 'global' || type === 'all') {
        const posts = await this.aggregationLayer.getAllPosts(type, limit, cursor);
        const enrichedPosts = did ? await this.aggregationLayer.enrichPostsWithVotes(posts, did) : posts;

        // Rank posts algorithmically
        const rankedPosts = await this.rankPostsAlgorithmically(enrichedPosts, did || '', type);

        return {
          posts: rankedPosts.slice(0, limit),
          cursor: rankedPosts.length > limit ? rankedPosts[limit - 1].hash : undefined
        };
      }

      // If did is null or empty, return empty feed
      if (!did) {
        return { posts: [], cursor: undefined };
      }

      // Get user's follows using DID
      const follows = await this.aggregationLayer.getFollows(did);

      // Always include your own DID in the list so you see your own posts
      const didsToQuery = [...new Set([did, ...follows])];

      // Get posts from followed users AND yourself
      const posts = await this.aggregationLayer.getPostsFromUsers(
        didsToQuery,
        type,
        limit,
        cursor
      );

      // Get reposts and quote casts from followed users
      const repostsAndQuotes = await this.aggregationLayer.getRepostsAndQuotesForFeed(didsToQuery, limit);

      // Combine posts with reposts/quotes
      const allPosts = [...posts, ...repostsAndQuotes];

      // Enrich posts with votes
      const enrichedPosts = await this.aggregationLayer.enrichPostsWithVotes(allPosts, did);

      // Rank posts (algorithmic or chronological)
      const rankedPosts = type === 'algorithmic' || type === 'hot' || type === 'top'
        ? await this.rankPostsAlgorithmically(enrichedPosts, did, type)
        : enrichedPosts.sort((a: Post, b: Post) => b.timestamp - a.timestamp);

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

  async getPost(hash: string, userDid?: string | null): Promise<Post | null> {
    // getPost now handles vote enrichment internally if userDid is provided
    return await this.aggregationLayer.getPost(hash, userDid);
  }

  async getReplies(postHash: string): Promise<Post[]> {
    return await this.aggregationLayer.getReplies(postHash);
  }

  async getPostsByUser(did: string, limit: number, cursor?: string): Promise<Post[]> {
    // Get posts from this specific user - using DID
    const posts = await this.aggregationLayer.getPostsFromUsers([did], 'chronological', limit, cursor);
    // Filter out replies (only show top-level posts)
    const topLevelPosts = posts.filter(post => !post.parentHash);
    // Enrich with votes if needed
    return await this.aggregationLayer.enrichPostsWithVotes(topLevelPosts, did);
  }

  async getRepliesByUser(did: string, limit: number, cursor?: string): Promise<Post[]> {
    return await this.aggregationLayer.getRepliesByUser(did, limit, cursor);
  }

  async getReactionsByUser(did: string, type?: 'like' | 'repost' | 'quote', limit: number = 50): Promise<Post[]> {
    return await this.aggregationLayer.getReactionsByUser(did, type, limit);
  }

  async getDIDFromAddress(walletAddress: string): Promise<string | null> {
    return await this.aggregationLayer.getDIDFromAddress(walletAddress);
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
      walletAddress?: string; // Optional wallet address for PDS account creation
    }
  ): Promise<Profile> {
    return await this.aggregationLayer.updateProfile(did, updates);
  }

  async follow(followerDid: string, followingDid: string): Promise<{ success: boolean }> {
    await this.aggregationLayer.createFollow(followerDid, followingDid);
    return { success: true };
  }

  async unfollow(followerDid: string, followingDid: string): Promise<{ success: boolean }> {
    await this.aggregationLayer.deleteFollow(followerDid, followingDid);
    return { success: true };
  }

  async getFollows(did: string): Promise<string[]> {
    return await this.aggregationLayer.getFollows(did);
  }

  async createReaction(
    did: string,
    targetHash: string,
    type: 'like' | 'repost' | 'quote'
  ): Promise<Reaction> {
    return await this.aggregationLayer.createReaction(did, targetHash, type);
  }

  async createVote(
    did: string,
    targetHash: string,
    targetType: 'post' | 'comment',
    voteType: 'UP' | 'DOWN'
  ): Promise<Vote> {
    return await this.aggregationLayer.createVote(did, targetHash, targetType, voteType);
  }

  async getPostVotes(targetHash: string): Promise<{
    voteCount: number;
    upvoteCount: number;
    downvoteCount: number;
  }> {
    return await this.aggregationLayer.getPostVotes(targetHash);
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

  async getReactions(postHash: string, did: string): Promise<{ liked: boolean; reposted: boolean }> {
    return await this.aggregationLayer.getReactions(postHash, did);
  }

  async getNotifications(did: string): Promise<{ notifications: any[] }> {
    return await this.aggregationLayer.getNotifications(did);
  }

  private async rankPostsAlgorithmically(posts: Post[], did: string, feedType: string = 'hot'): Promise<Post[]> {
    const now = Date.now() / 1000;

    const scored = await Promise.all(posts.map(async post => {
      const age = now - post.timestamp;

      // Get vote counts if not already enriched
      const voteCount = post.voteCount ?? 0;
      const upvoteCount = post.upvoteCount ?? 0;
      const downvoteCount = post.downvoteCount ?? 0;

      let score = 0;

      if (feedType === 'top') {
        // Top: Sort by vote count only (all time)
        score = voteCount;
      } else if (feedType === 'hot') {
        // Hot: Reddit's hot algorithm (vote score weighted by age)
        // Score = (upvotes - downvotes) / time^1.5 (roughly)
        const timeWeight = Math.pow(age + 2, 1.5); // Add 2 to prevent division by 0
        score = voteCount / timeWeight;

        // Boost recent posts slightly
        if (age < 3600) score *= 1.2; // Boost posts < 1 hour old
        if (age < 300) score *= 1.5; // Boost posts < 5 minutes old
      } else {
        // Default algorithmic: recency + votes
        const timeScore = Math.exp(-age / (7 * 24 * 60 * 60)); // 7 day half-life
        const voteScore = Math.log(Math.max(1, voteCount + 1)); // Log scale for votes
        score = timeScore * 0.5 + voteScore * 0.5;
      }

      return { post, score };
    }));

    return scored
      .sort((a, b) => b.score - a.score)
      .map(item => item.post);
  }

  getGatewayId(): string {
    return this.config.gatewayId;
  }
}

