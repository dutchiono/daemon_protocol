/**
 * @title Aggregation Layer
 * @notice Aggregates data from hubs and PDS
 */

import pg from 'pg';
// import Redis from 'redis'; // Optional - comment out if not installed
import type { Config } from './config.js';
import type { Post, Profile, Reaction, Vote } from './types.js';
import { didToFid, fidToDid } from './did-utils.js';

const { Pool } = pg;

export class AggregationLayer {
  private db: pg.Pool;
  private redis?: any; // Redis.RedisClientType - make optional
  private config: Config;
  private hubEndpoints: string[];
  private pdsEndpoints: string[];

  constructor(config: Config) {
    this.config = config;
    if (!config.databaseUrl || config.databaseUrl.trim() === '') {
      throw new Error('DATABASE_URL is required');
    }
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

    try {
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
    } catch (error) {
      console.error('Database error in getFollows:', error);
      // Return empty array if database query fails
      return [];
    }
  }

  async getPostsFromUsers(
    fids: number[],
    type: string,
    limit: number,
    cursor?: string
  ): Promise<Post[]> {
    // Query from hubs
    const posts: Post[] = [];

    // If no fids provided or empty, try to get all posts from hubs
    if (!fids || fids.length === 0) {
      // Try to get recent posts from all hubs
      for (const hubEndpoint of this.hubEndpoints) {
        try {
          // Try to get messages - if hub doesn't support batch endpoint, return empty
          const response = await fetch(
            `${hubEndpoint}/api/v1/peers`,
            { signal: AbortSignal.timeout(5000) }
          );
          if (response.ok) {
            // Hub is reachable, but no batch endpoint - return empty for now
            // TODO: Implement a way to get all posts from hub
          }
        } catch (error) {
          console.error(`Failed to query hub ${hubEndpoint}:`, error);
        }
      }
      return [];
    }

    for (const hubEndpoint of this.hubEndpoints) {
      try {
        // Query hub for posts from these users
        // Note: Hub might not have /api/v1/messages/batch endpoint
        // Fall back to individual queries or return empty
        const response = await fetch(
          `${hubEndpoint}/api/v1/messages/batch?fids=${fids.join(',')}&limit=${limit}`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (response.ok) {
          const data: any = await response.json();
          if (data.messages) {
            posts.push(...data.messages);
          }
        }
      } catch (error) {
        console.error(`Failed to query hub ${hubEndpoint}:`, error);
        // Continue to next hub or return empty
      }
    }

    // Deduplicate and sort
    const uniquePosts = this.deduplicatePosts(posts);
    return uniquePosts.slice(0, limit);
  }

  async createPost(
    did: string,
    text: string,
    parentHash?: string,
    embeds?: any[]
  ): Promise<Post> {
    console.log('[AggregationLayer] createPost - Starting for did:', did);

    // Convert did to fid for getUserPDS
    let fid: number;
    try {
      fid = didToFid(did);
      console.log('[AggregationLayer] createPost - Converted did to fid:', fid);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid DID format';
      console.error('[AggregationLayer] createPost - Failed to convert did to fid:', errorMessage);
      throw new Error(errorMessage);
    }

    // Create post via user's PDS
    // Find user's PDS
    const userPds = await this.getUserPDS(fid);
    console.log('[AggregationLayer] createPost - User PDS:', userPds);

    if (!userPds) {
      console.error('[AggregationLayer] createPost - PDS_ENDPOINTS not configured. Available endpoints:', this.pdsEndpoints);
      throw new Error('User PDS not found. Please ensure PDS_ENDPOINTS is configured.');
    }

    // Create post on PDS
    // Gateway makes server-side requests directly to PDS
    const requestBody = {
      repo: did,
      collection: 'app.bsky.feed.post',
      record: {
        $type: 'app.bsky.feed.post',
        text,
        createdAt: new Date().toISOString(),
        reply: parentHash ? { root: { uri: parentHash } } : undefined,
        embed: embeds?.[0]
      }
    };

    console.log('[AggregationLayer] createPost - Requesting PDS:', `${userPds}/xrpc/com.atproto.repo.createRecord`);
    console.log('[AggregationLayer] createPost - Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${userPds}/xrpc/com.atproto.repo.createRecord`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AggregationLayer] createPost - PDS error response:', response.status, errorText);
      
      // If user not found, try to create PDS account automatically
      if (response.status === 400 || response.status === 404) {
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error?.includes('User not found') || errorJson.error?.includes('not found')) {
            console.log('[AggregationLayer] createPost - User not found in PDS, attempting to create account...');
            // Try to get wallet address from users table
            const userResult = await this.db.query(
              `SELECT address FROM users WHERE did = $1`,
              [did]
            );
            const walletAddress = userResult.rows[0]?.address;
            
            // Extract handle from profiles table
            const profileResult = await this.db.query(
              `SELECT username FROM profiles WHERE did = $1`,
              [did]
            );
            const handle = profileResult.rows[0]?.username;

            // Create PDS account
            await this.ensurePDSAccount(did, walletAddress !== `0x${'0'.repeat(40)}` ? walletAddress : undefined, handle);

            // Retry post creation
            console.log('[AggregationLayer] createPost - Retrying post creation after PDS account creation...');
            const retryResponse = await fetch(`${userPds}/xrpc/com.atproto.repo.createRecord`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody)
            });

            if (retryResponse.ok) {
              const retryResult = await retryResponse.json();
              // Continue with normal flow
              const finalResult = retryResult;
              
              // Submit to hubs
              if (this.hubEndpoints.length > 0) {
                for (const hubEndpoint of this.hubEndpoints) {
                  try {
                    await fetch(`${hubEndpoint}/api/v1/messages`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        hash: (finalResult as any).uri,
                        did,
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
              }

              return {
                hash: (finalResult as any).uri,
                did,
                text,
                parentHash,
                timestamp: Math.floor(Date.now() / 1000),
                embeds: embeds || []
              };
            }
          }
        } catch (parseError) {
          // Not a JSON error, continue with original error
        }
      }

      // Original error handling
      let errorMessage = 'Failed to create post on PDS';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();

    // Also submit to hubs for propagation (optional - hub might not be running)
    if (this.hubEndpoints.length > 0) {
      for (const hubEndpoint of this.hubEndpoints) {
        try {
          await fetch(`${hubEndpoint}/api/v1/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              hash: (result as any).uri,
              did,
              text,
              parentHash,
              timestamp: Math.floor(Date.now() / 1000),
              embeds
            })
          });
        } catch (error) {
          // Hub is optional - just log and continue
          console.error(`Failed to submit to hub ${hubEndpoint}:`, error);
        }
      }
    }

    return {
      hash: (result as any).uri,
      did,
      text,
      parentHash,
      timestamp: Math.floor(Date.now() / 1000),
      embeds: embeds || []
    };
  }

  async getPost(hash: string, userDid?: string | null): Promise<Post | null> {
    // Check cache
    if (this.redis) {
      const cached = await this.redis.get(`post:${hash}`);
      if (cached) {
        const post = JSON.parse(cached) as Post;
        // Enrich with votes if userDid provided
        if (userDid) {
          return await this.enrichPostWithVotes(post, userDid);
        }
        return post;
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
          // Enrich with votes if userDid provided
          if (userDid) {
            return await this.enrichPostWithVotes(post as Post, userDid);
          }
          return post as Post | null;
        }
      } catch (error) {
        console.error(`Failed to query hub ${hubEndpoint}:`, error);
      }
    }

    return null;
  }

  async getProfile(did: string): Promise<Profile | null> {
    // Convert did to fid for database query
    const fid = didToFid(did);

    // Check cache
    if (this.redis) {
      const cached = await this.redis.get(`profile:${did}`);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    // Query database using fid
    const result = await this.db.query(
      `SELECT * FROM profiles WHERE fid = $1`,
      [fid]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    const profile: Profile = {
      did,
      username: row.username,
      displayName: row.display_name,
      bio: row.bio,
      avatar: row.avatar_cid,
      banner: row.banner_cid,
      website: row.website,
      verified: row.verified
    };

    // Cache using did
    if (this.redis) {
      await this.redis.setEx(`profile:${did}`, 1800, JSON.stringify(profile)); // 30 min cache
    }

    return profile;
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
    // Convert did to fid for database operations
    const fid = didToFid(did);

    // First, ensure the user exists in the users table
    const userCheck = await this.db.query(
      `SELECT fid FROM users WHERE fid = $1`,
      [fid]
    );

    const isNewUser = userCheck.rows.length === 0;

    if (isNewUser) {
      // Create user if it doesn't exist
      // Use wallet address if provided, otherwise placeholder
      const address = updates.walletAddress || `0x${'0'.repeat(40)}`; // 0x0000...0000
      await this.db.query(
        `INSERT INTO users (fid, address, did, created_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (fid) DO UPDATE SET did = $3`,
        [fid, address, did]
      );

      // For new users, ensure PDS account exists
      // This unifies account creation - Gateway and PDS accounts created together
      await this.ensurePDSAccount(did, updates.walletAddress, updates.username);
    } else {
      // Update did if it's missing
      await this.db.query(
        `UPDATE users SET did = $1 WHERE fid = $2 AND (did IS NULL OR did != $1)`,
        [did, fid]
      );
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.username !== undefined) {
      updateFields.push(`username = $${paramIndex++}`);
      values.push(updates.username);
    }
    if (updates.displayName !== undefined) {
      updateFields.push(`display_name = $${paramIndex++}`);
      values.push(updates.displayName);
    }
    if (updates.bio !== undefined) {
      updateFields.push(`bio = $${paramIndex++}`);
      values.push(updates.bio);
    }
    if (updates.avatar !== undefined) {
      updateFields.push(`avatar_cid = $${paramIndex++}`);
      values.push(updates.avatar);
    }
    if (updates.banner !== undefined) {
      updateFields.push(`banner_cid = $${paramIndex++}`);
      values.push(updates.banner);
    }
    if (updates.website !== undefined) {
      updateFields.push(`website = $${paramIndex++}`);
      values.push(updates.website);
    }

    if (updateFields.length === 0) {
      // No updates, just return existing profile
      const existing = await this.getProfile(did);
      if (!existing) {
        throw new Error('Profile not found');
      }
      return existing;
    }

    // Add updated_at and did (doesn't need parameters for updated_at)
    updateFields.push(`updated_at = NOW()`);
    if (!updateFields.some(f => f.includes('did'))) {
      updateFields.push(`did = $${paramIndex++}`);
      values.push(did);
    }

    // Add fid for WHERE clause
    values.push(fid);
    const whereParamIndex = paramIndex;

    const query = `
      UPDATE profiles
      SET ${updateFields.join(', ')}
      WHERE fid = $${whereParamIndex}
      RETURNING *
    `;

    const result = await this.db.query(query, values);

    if (result.rows.length === 0) {
      // Profile doesn't exist, create it
      const insertQuery = `
        INSERT INTO profiles (fid, did, username, display_name, bio, avatar_cid, banner_cid, website, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *
      `;
      const insertResult = await this.db.query(insertQuery, [
        fid,
        did,
        updates.username || null,
        updates.displayName || null,
        updates.bio || null,
        updates.avatar || null,
        updates.banner || null,
        updates.website || null
      ]);
      return this.mapRowToProfile(insertResult.rows[0], did);
    }

    const row = result.rows[0];
    const profile = this.mapRowToProfile(row, did);

    // Invalidate cache using did
    if (this.redis) {
      await this.redis.del(`profile:${did}`);
    }

    return profile;
  }

  private mapRowToProfile(row: any, did: string): Profile {
    return {
      did,
      username: row.username,
      displayName: row.display_name,
      bio: row.bio,
      avatar: row.avatar_cid,
      banner: row.banner_cid,
      website: row.website,
      verified: row.verified
    };
  }

  async getUnreadNotificationCount(did: string): Promise<number> {
    const fid = didToFid(did);

    try {
      // Count reactions on user's posts (likes, reposts, replies)
      // Count new follows
      // For now, we'll count reactions on posts created by this user in the last 7 days
      const sevenDaysAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);

      const result = await this.db.query(
        `SELECT COUNT(DISTINCT r.id) as count
         FROM reactions r
         INNER JOIN messages m ON r.target_hash = m.hash
         WHERE m.fid = $1
           AND r.fid != $1
           AND m.timestamp > $2
           AND r.active = true`,
        [fid, sevenDaysAgo]
      );

      const reactionCount = parseInt(result.rows[0]?.count || '0');

      // Count new follows (people who followed you in last 7 days)
      const followResult = await this.db.query(
        `SELECT COUNT(*) as count
         FROM follows
         WHERE following_fid = $1
           AND active = true
           AND timestamp > $2`,
        [fid, sevenDaysAgo]
      );

      const followCount = parseInt(followResult.rows[0]?.count || '0');

      // For now, return sum of reactions and follows
      // In the future, we could track read/unread status
      return reactionCount + followCount;
    } catch (error) {
      console.error('Error getting notification count:', error);
      return 0;
    }
  }

  async createFollow(followerDid: string, followingDid: string): Promise<void> {
    // Convert dids to fids for database operations
    const followerFid = didToFid(followerDid);
    const followingFid = didToFid(followingDid);

    // Create follow on user's PDS
    const userPds = await this.getUserPDS(followerFid);

    if (!userPds) {
      throw new Error('User PDS not found. Please ensure PDS_ENDPOINTS is configured.');
    }

    // Gateway makes server-side requests directly to PDS
    await fetch(`${userPds}/xrpc/com.atproto.repo.createRecord`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        repo: followerDid,
        collection: 'app.bsky.graph.follow',
        record: {
          $type: 'app.bsky.graph.follow',
          subject: followingDid,
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
      did: fidToDid(fid),
      timestamp: Math.floor(Date.now() / 1000)
    };
  }

  // Vote methods
  async createVote(
    did: string,
    targetHash: string,
    targetType: 'post' | 'comment',
    voteType: 'UP' | 'DOWN'
  ): Promise<Vote> {
    // Check if user has already voted
    const existingVote = await this.db.query(
      `SELECT vote_type FROM votes WHERE did = $1 AND target_hash = $2`,
      [did, targetHash]
    );

    const timestamp = Math.floor(Date.now() / 1000);

    if (existingVote.rows.length > 0) {
      const existingVoteType = existingVote.rows[0].vote_type;

      // If voting the same way, remove the vote
      if (existingVoteType === voteType) {
        await this.db.query(
          `DELETE FROM votes WHERE did = $1 AND target_hash = $2`,
          [did, targetHash]
        );

        // Invalidate vote cache
        if (this.redis) {
          await this.redis.del(`votes:${targetHash}`);
          await this.redis.del(`vote:${did}:${targetHash}`);
        }

        // Return null vote (removed)
        return {
          did,
          targetHash,
          targetType,
          voteType: 'UP', // placeholder, vote was removed
          timestamp
        };
      } else {
        // Change vote type
        await this.db.query(
          `UPDATE votes SET vote_type = $1, timestamp = $2 WHERE did = $3 AND target_hash = $4`,
          [voteType, timestamp, did, targetHash]
        );
      }
    } else {
      // Create new vote
      await this.db.query(
        `INSERT INTO votes (did, target_hash, target_type, vote_type, timestamp)
         VALUES ($1, $2, $3, $4, $5)`,
        [did, targetHash, targetType, voteType, timestamp]
      );
    }

    // Invalidate vote cache
    if (this.redis) {
      await this.redis.del(`votes:${targetHash}`);
      await this.redis.del(`vote:${did}:${targetHash}`);
    }

    return {
      did,
      targetHash,
      targetType,
      voteType,
      timestamp
    };
  }

  async getPostVotes(targetHash: string): Promise<{
    voteCount: number;
    upvoteCount: number;
    downvoteCount: number;
  }> {
    // Check cache first
    if (this.redis) {
      const cached = await this.redis.get(`votes:${targetHash}`);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    // Query database
    const result = await this.db.query(
      `SELECT
        COUNT(*) FILTER (WHERE vote_type = 'UP') as upvotes,
        COUNT(*) FILTER (WHERE vote_type = 'DOWN') as downvotes
       FROM votes
       WHERE target_hash = $1`,
      [targetHash]
    );

    const upvoteCount = parseInt(result.rows[0]?.upvotes || '0');
    const downvoteCount = parseInt(result.rows[0]?.downvotes || '0');
    const voteCount = upvoteCount - downvoteCount;

    const voteData = { voteCount, upvoteCount, downvoteCount };

    // Cache result (30 min)
    if (this.redis) {
      await this.redis.setEx(`votes:${targetHash}`, 1800, JSON.stringify(voteData));
    }

    return voteData;
  }

  async getUserVote(did: string, targetHash: string): Promise<'UP' | 'DOWN' | null> {
    // Check cache first
    if (this.redis) {
      const cached = await this.redis.get(`vote:${did}:${targetHash}`);
      if (cached) {
        return cached === 'null' ? null : (cached as 'UP' | 'DOWN');
      }
    }

    // Query database
    const result = await this.db.query(
      `SELECT vote_type FROM votes WHERE did = $1 AND target_hash = $2`,
      [did, targetHash]
    );

    const voteType = result.rows[0]?.vote_type || null;

    // Cache result (30 min)
    if (this.redis) {
      await this.redis.setEx(`vote:${did}:${targetHash}`, 1800, voteType || 'null');
    }

    return voteType;
  }

  async enrichPostWithVotes(post: Post, userDid?: string | null): Promise<Post> {
    const votes = await this.getPostVotes(post.hash);
    const currentVote = userDid ? await this.getUserVote(userDid, post.hash) : null;

    return {
      ...post,
      voteCount: votes.voteCount,
      upvoteCount: votes.upvoteCount,
      downvoteCount: votes.downvoteCount,
      currentVote
    };
  }

  async enrichPostsWithVotes(posts: Post[], userDid?: string | null): Promise<Post[]> {
    // Enrich all posts with votes in parallel
    return Promise.all(
      posts.map(post => this.enrichPostWithVotes(post, userDid))
    );
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
      did: row.did || fidToDid(parseInt(row.fid)),
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
      did: row.did || fidToDid(parseInt(row.fid)),
      username: row.username,
      displayName: row.display_name,
      bio: row.bio,
      avatar: row.avatar_cid,
      website: row.website,
      verified: row.verified
    }));
  }

  private async getUserPDS(fid: number): Promise<string | null> {
    // If pdsEndpoints is empty, return null
    if (!this.pdsEndpoints || this.pdsEndpoints.length === 0) {
      return null;
    }

    // Gateway makes server-side requests, so use direct PDS URL
    // Nginx proxy is only for client-side requests
    return this.pdsEndpoints[0];
  }

  /**
   * Ensure PDS account exists for a given DID
   * Creates account if it doesn't exist, idempotent operation
   */
  private async ensurePDSAccount(did: string, walletAddress?: string, handle?: string): Promise<void> {
    if (!this.pdsEndpoints || this.pdsEndpoints.length === 0) {
      console.warn('[AggregationLayer] ensurePDSAccount - PDS_ENDPOINTS not configured, skipping');
      return;
    }

    const userPds = this.pdsEndpoints[0];
    
    // First, check if account already exists
    try {
      const checkResponse = await fetch(`${userPds}/xrpc/com.atproto.repo.getProfile?did=${encodeURIComponent(did)}`);
      if (checkResponse.ok) {
        console.log('[AggregationLayer] ensurePDSAccount - PDS account already exists for:', did);
        return; // Account exists, nothing to do
      }
    } catch (error) {
      // If check fails, proceed to create account
      console.log('[AggregationLayer] ensurePDSAccount - Account check failed, will create:', did);
    }

    // Account doesn't exist, create it
    try {
      console.log('[AggregationLayer] ensurePDSAccount - Creating PDS account for:', did, 'wallet:', walletAddress);
      
      const createBody: any = {};
      if (walletAddress) {
        createBody.walletAddress = walletAddress;
      }
      if (handle) {
        createBody.handle = handle;
      }

      const createResponse = await fetch(`${userPds}/xrpc/com.atproto.server.createAccount`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createBody)
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error('[AggregationLayer] ensurePDSAccount - Failed to create PDS account:', createResponse.status, errorText);
        throw new Error(`Failed to create PDS account: ${errorText}`);
      }

      const result = await createResponse.json();
      console.log('[AggregationLayer] ensurePDSAccount - PDS account created successfully:', result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[AggregationLayer] ensurePDSAccount - Error creating PDS account:', errorMessage);
      // Don't throw - allow Gateway profile to exist without PDS account
      // The fallback in createPost will handle it
    }
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

