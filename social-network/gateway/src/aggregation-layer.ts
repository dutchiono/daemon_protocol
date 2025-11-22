/**
 * @title Aggregation Layer
 * @notice Aggregates data from hubs and PDS
 */

import pg from 'pg';
// import Redis from 'redis'; // Optional - comment out if not installed
import type { Config } from './config.js';
import type { Post, Profile, Reaction } from './types.js';

const { Pool } = pg;

export class AggregationLayer {
  private db: pg.Pool;
  private redis?: any; // Redis.RedisClientType - make optional
  private config: Config;
  private hubEndpoints: string[];
  private pdsEndpoints: string[];

  constructor(config: Config) {
    this.config = config;
    this.db = new Pool({ connectionString: config.databaseUrl });
    this.hubEndpoints = config.hubEndpoints;
    this.pdsEndpoints = config.pdsEndpoints;

    // Redis is optional - comment out if not installed
    // if (config.redisUrl) {
    //   this.redis = Redis.createClient({ url: config.redisUrl });
    //   this.redis.connect().catch(console.error);
    // }
  }

  async getFollows(fid: number): Promise<number[]> {
    // Check cache first
    const cacheKey = `follows:${fid}`;
    if (this.redis) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    // Query database
    const result = await this.db.query(
      `SELECT following_fid FROM follows
       WHERE follower_fid = $1 AND active = true`,
      [fid]
    );

    const follows = result.rows.map((row: any) => parseInt(row.following_fid));

    // Cache result
    if (this.redis) {
      await this.redis.setEx(cacheKey, 300, JSON.stringify(follows)); // 5 min cache
    }

    return follows;
  }

  async getPostsFromUsers(
    fids: number[],
    type: string,
    limit: number,
    cursor?: string
  ): Promise<Post[]> {
    // Query from hubs
    const posts: Post[] = [];

    for (const hubEndpoint of this.hubEndpoints) {
      try {
        // Query hub for posts from these users
        const response = await fetch(
          `${hubEndpoint}/api/v1/messages/batch?fids=${fids.join(',')}&limit=${limit}`
        );
        if (response.ok) {
          const data: any = await response.json();
          posts.push(...data.messages);
        }
      } catch (error) {
        console.error(`Failed to query hub ${hubEndpoint}:`, error);
      }
    }

    // Deduplicate and sort
    const uniquePosts = this.deduplicatePosts(posts);
    return uniquePosts.slice(0, limit);
  }

  async createPost(
    fid: number,
    text: string,
    parentHash?: string,
    embeds?: any[]
  ): Promise<Post> {
    // Create post via user's PDS
    // Find user's PDS
    const userPds = await this.getUserPDS(fid);

    if (!userPds) {
      throw new Error('User PDS not found');
    }

    // Create post on PDS
    const response = await fetch(`${userPds}/xrpc/com.atproto.repo.createRecord`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        repo: `did:daemon:${fid}`,
        collection: 'app.bsky.feed.post',
        record: {
          $type: 'app.bsky.feed.post',
          text,
          createdAt: new Date().toISOString(),
          reply: parentHash ? { root: { uri: parentHash } } : undefined,
          embed: embeds?.[0]
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create post');
    }

    const result = await response.json();

    // Also submit to hubs for propagation
    for (const hubEndpoint of this.hubEndpoints) {
      try {
        await fetch(`${hubEndpoint}/api/v1/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hash: (result as any).uri,
            fid,
            text,
            parentHash,
            timestamp: Math.floor(Date.now() / 1000),
            embeds
          })
        });
      } catch (error) {
        console.error(`Failed to submit to hub ${hubEndpoint}:`, error);
      }
    }

    return {
      hash: (result as any).uri,
      fid,
      text,
      parentHash,
      timestamp: Math.floor(Date.now() / 1000),
      embeds: embeds || []
    };
  }

  async getPost(hash: string): Promise<Post | null> {
    // Check cache
    if (this.redis) {
      const cached = await this.redis.get(`post:${hash}`);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    // Query hubs
    for (const hubEndpoint of this.hubEndpoints) {
      try {
        const response = await fetch(`${hubEndpoint}/api/v1/messages/${hash}`);
        if (response.ok) {
          const post: any = await response.json();
          // Cache
          if (this.redis) {
            await this.redis.setEx(`post:${hash}`, 3600, JSON.stringify(post)); // 1 hour cache
          }
          return post as Post | null;
        }
      } catch (error) {
        console.error(`Failed to query hub ${hubEndpoint}:`, error);
      }
    }

    return null;
  }

  async getProfile(fid: number): Promise<Profile | null> {
    // Check cache
    if (this.redis) {
      const cached = await this.redis.get(`profile:${fid}`);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    // Query database
    const result = await this.db.query(
      `SELECT * FROM profiles WHERE fid = $1`,
      [fid]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    const profile: Profile = {
      fid,
      username: row.username,
      displayName: row.display_name,
      bio: row.bio,
      avatar: row.avatar_cid,
      banner: row.banner_cid,
      verified: row.verified
    };

    // Cache
    if (this.redis) {
      await this.redis.setEx(`profile:${fid}`, 1800, JSON.stringify(profile)); // 30 min cache
    }

    return profile;
  }

  async createFollow(followerFid: number, followingFid: number): Promise<void> {
    // Create follow on user's PDS
    const userPds = await this.getUserPDS(followerFid);

    if (!userPds) {
      throw new Error('User PDS not found');
    }

    await fetch(`${userPds}/xrpc/com.atproto.repo.createRecord`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        repo: `did:daemon:${followerFid}`,
        collection: 'app.bsky.graph.follow',
        record: {
          $type: 'app.bsky.graph.follow',
          subject: `did:daemon:${followingFid}`,
          createdAt: new Date().toISOString()
        }
      })
    });

    // Update database
    await this.db.query(
      `INSERT INTO follows (follower_fid, following_fid, timestamp, active)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (follower_fid, following_fid) DO UPDATE SET active = true`,
      [followerFid, followingFid, Math.floor(Date.now() / 1000)]
    );

    // Invalidate cache
    if (this.redis) {
      await this.redis.del(`follows:${followerFid}`);
    }
  }

  async deleteFollow(followerFid: number, followingFid: number): Promise<void> {
    await this.db.query(
      `UPDATE follows SET active = false
       WHERE follower_fid = $1 AND following_fid = $2`,
      [followerFid, followingFid]
    );

    // Invalidate cache
    if (this.redis) {
      await this.redis.del(`follows:${followerFid}`);
    }
  }

  async createReaction(
    fid: number,
    targetHash: string,
    type: 'like' | 'repost' | 'quote'
  ): Promise<Reaction> {
    // Store reaction in database
    await this.db.query(
      `INSERT INTO reactions (fid, target_hash, reaction_type, timestamp, active)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (fid, target_hash, reaction_type) DO UPDATE SET active = true`,
      [fid, targetHash, type, Math.floor(Date.now() / 1000)]
    );

    return {
      type,
      targetHash,
      fid,
      timestamp: Math.floor(Date.now() / 1000)
    };
  }

  async searchPosts(query: string, limit: number): Promise<Post[]> {
    // Full-text search in database
    const result = await this.db.query(
      `SELECT * FROM messages
       WHERE deleted = false
       AND to_tsvector('english', text) @@ plainto_tsquery('english', $1)
       ORDER BY timestamp DESC
       LIMIT $2`,
      [query, limit]
    );

    return result.rows.map((row: any) => ({
      hash: row.hash,
      fid: parseInt(row.fid),
      text: row.text,
      timestamp: parseInt(row.timestamp)
    }));
  }

  async searchUsers(query: string, limit: number): Promise<Profile[]> {
    const result = await this.db.query(
      `SELECT * FROM profiles
       WHERE username ILIKE $1 OR display_name ILIKE $1
       LIMIT $2`,
      [`%${query}%`, limit]
    );

    return result.rows.map((row: any) => ({
      fid: parseInt(row.fid),
      username: row.username,
      displayName: row.display_name,
      bio: row.bio,
      avatar: row.avatar_cid,
      verified: row.verified
    }));
  }

  private async getUserPDS(fid: number): Promise<string | null> {
    // In production, would query user's PDS assignment
    // For now, return first PDS
    return this.pdsEndpoints[0] || null;
  }

  private deduplicatePosts(posts: Post[]): Post[] {
    const seen = new Set<string>();
    return posts.filter(post => {
      if (seen.has(post.hash)) {
        return false;
      }
      seen.add(post.hash);
      return true;
    });
  }
}

