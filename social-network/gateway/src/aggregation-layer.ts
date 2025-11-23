/**
 * @title Aggregation Layer
 * @notice Aggregates data from hubs and PDS
 */
import pg from 'pg';
import Redis from 'redis';
import { ethers } from 'ethers';
import type { Config } from './config.js';
// Removed didToFid import - using DIDs directly throughout
import type { Reaction } from './types.js';
const { Pool } = pg;
export class AggregationLayer {
    db;
    redis;
    config;
    hubEndpoints;
    pdsEndpoints;
    constructor(config: Config) {
        this.config = config;
        if (!config.databaseUrl || config.databaseUrl.trim() === '') {
            throw new Error('DATABASE_URL is required');
        }
        this.db = new Pool({ connectionString: config.databaseUrl });
        this.hubEndpoints = config.hubEndpoints;
        this.pdsEndpoints = config.pdsEndpoints;
        if (config.redisUrl) {
            this.redis = Redis.createClient({ url: config.redisUrl });
            this.redis.connect().catch(console.error);
        }
    }
    async getFollows(did: string): Promise<string[]> {
        // Check cache first
        const cacheKey = `follows:${did}`;
        if (this.redis) {
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
        }
        // Query database using DIDs - return DIDs directly
        const result = await this.db.query(`SELECT following_did FROM follows
         WHERE follower_did = $1 AND active = true`, [did]);
        const follows = result.rows.map((row) => row.following_did);
        // Cache result
        if (this.redis) {
            await this.redis.setEx(cacheKey, 300, JSON.stringify(follows)); // 5 min cache
        }
        return follows;
    }
    async getPostsFromUsers(dids: string[], type: string, limit: number, cursor?: string) {
        // Query from hubs first - using DIDs
        const posts: any[] = [];
        for (const hubEndpoint of this.hubEndpoints) {
            try {
                // Query hub for posts from these users - pass DIDs
                const didsParam = dids.map(d => encodeURIComponent(d)).join(',');
                const response = await fetch(`${hubEndpoint}/api/v1/messages/batch?dids=${didsParam}&limit=${limit}`);
                if (response.ok) {
                    const data: any = await response.json();
                    if (data.messages && Array.isArray(data.messages)) {
                        // Convert Hub messages to Post format
                        for (const msg of data.messages) {
                            posts.push({
                                hash: msg.hash,
                                did: msg.did,
                                text: msg.text,
                                timestamp: msg.timestamp,
                                messageType: msg.messageType || 'post',
                                parentHash: msg.parentHash,
                                embeds: msg.embeds || [],
                                signature: msg.signature,
                                signingKey: msg.signingKey,
                                verified: !!(msg.signature && msg.signingKey)
                            });
                        }
                    }
                }
            }
            catch (error) {
                console.error(`[AggregationLayer] Failed to query hub ${hubEndpoint}:`, error);
            }
        }

        // If Hub has no posts, fallback to querying PDS directly
        if (posts.length === 0 && this.pdsEndpoints && this.pdsEndpoints.length > 0) {
            console.log(`[AggregationLayer] Hub returned no posts, querying PDS directly for ${dids.length} users`);
            const userPds = this.pdsEndpoints[0]; // Use first PDS for now

            for (const did of dids) {
                try {
                    // Query PDS for posts from this user
                    const response = await fetch(`${userPds}/xrpc/com.atproto.repo.listRecords?repo=${encodeURIComponent(did)}&collection=app.daemon.feed.post&limit=${limit}`);
                    if (response.ok) {
                        const data: any = await response.json();
                        if (data.records && Array.isArray(data.records)) {
                            // Convert PDS records to post format
                            // PDS returns records in AT Protocol format: { uri, value, cid }
                            for (const record of data.records) {
                                // Handle both formats: AT Protocol format (record.value) or flat format (record.text)
                                const recordData = record.value || record;
                                if (recordData && recordData.text) {
                                    // Use URI from record if available, otherwise generate from timestamp
                                    const hash = record.uri || `at://${did}/app.daemon.feed.post/${new Date(recordData.createdAt).getTime()}`;
                                    // Extract parentHash from reply data if present
                                    const parentHash = recordData.reply?.parent?.uri || recordData.reply?.root?.uri || undefined;
                                    posts.push({
                                        hash: hash,
                                        did: did,
                                        text: recordData.text,
                                        timestamp: new Date(recordData.createdAt).getTime() / 1000,
                                        messageType: parentHash ? 'reply' : 'post',
                                        parentHash: parentHash,
                                        embeds: recordData.embed ? [recordData.embed] : []
                                    });
                                }
                            }
                            console.log(`[AggregationLayer] Retrieved ${posts.length} posts from PDS for ${did}`);
                        } else {
                            console.log(`[AggregationLayer] No records in PDS response for ${did}`);
                        }
                    } else {
                        const errorText = await response.text();
                        console.error(`[AggregationLayer] PDS query failed for ${did}: ${response.status} ${errorText}`);
                    }
                } catch (error) {
                    console.error(`[AggregationLayer] Failed to query PDS for user ${did}:`, error);
                }
            }
        }

        // Filter out replies (posts with parentHash) - only show top-level posts in main feed
        const topLevelPosts = posts.filter(post => !post.parentHash);

        // Deduplicate and sort
        const uniquePosts = this.deduplicatePosts(topLevelPosts);

        // Enrich posts with usernames from profiles
        const uniqueDids = [...new Set(uniquePosts.map(p => p.did))];
        const profilePromises = uniqueDids.map(did =>
            this.getProfile(did).catch(() => null)
        );
        const profiles = await Promise.all(profilePromises);

        // Create a map of DID to username for quick lookup
        const didToUsername = new Map<string, string | undefined>();
        profiles.forEach((profile, index) => {
            if (profile) {
                didToUsername.set(uniqueDids[index], profile.username);
            }
        });

        // Add usernames to posts
        const enrichedPosts = uniquePosts.map(post => ({
            ...post,
            username: didToUsername.get(post.did)
        }));

        return enrichedPosts.slice(0, limit);
    }

    async getAllPosts(type: string, limit: number, cursor?: string) {
        // Get all posts from database (most reliable source for global feed)
        const posts: any[] = [];

        if (this.db) {
            try {
                // Query database for all top-level posts (not replies)
                const result = await this.db.query(`
                    SELECT hash, did, text, timestamp, message_type, parent_hash
                    FROM messages
                    WHERE deleted = false AND parent_hash IS NULL
                    ORDER BY timestamp DESC
                    LIMIT $1
                `, [limit * 2]); // Get more to account for deduplication

                for (const row of result.rows) {
                    posts.push({
                        hash: row.hash,
                        did: row.did,
                        text: row.text,
                        timestamp: parseInt(row.timestamp),
                        messageType: row.message_type || 'post',
                        parentHash: row.parent_hash || undefined,
                        embeds: [] // Embeds are in separate message_embeds table
                    });
                }
            } catch (error) {
                console.error(`[AggregationLayer] Failed to query database for all posts:`, error);
            }
        }

        // Also try to get posts from PDS (query all known users)
        if (this.pdsEndpoints && this.pdsEndpoints.length > 0 && this.db) {
            try {
                // Get all DIDs from profiles table
                const profileResult = await this.db.query(`SELECT DISTINCT did FROM profiles LIMIT 100`);
                const allDids = profileResult.rows.map(row => row.did);

                if (allDids.length > 0) {
                    const userPds = this.pdsEndpoints[0];
                    for (const did of allDids) {
                        try {
                            const response = await fetch(`${userPds}/xrpc/com.atproto.repo.listRecords?repo=${encodeURIComponent(did)}&collection=app.daemon.feed.post&limit=${limit}`);
                            if (response.ok) {
                                const data: any = await response.json();
                                if (data.records && Array.isArray(data.records)) {
                                    for (const record of data.records) {
                                        const recordData = record.value || record;
                                        if (recordData && recordData.text) {
                                            const hash = record.uri || `at://${did}/app.daemon.feed.post/${new Date(recordData.createdAt).getTime()}`;
                                            const parentHash = recordData.reply?.parent?.uri || recordData.reply?.root?.uri || undefined;

                                            // Only add top-level posts (not replies)
                                            if (!parentHash) {
                                                // Check if already in posts (avoid duplicates)
                                                if (!posts.find(p => p.hash === hash)) {
                                                    posts.push({
                                                        hash: hash,
                                                        did: did,
                                                        text: recordData.text,
                                                        timestamp: new Date(recordData.createdAt).getTime() / 1000,
                                                        messageType: 'post',
                                                        parentHash: undefined,
                                                        embeds: recordData.embed ? [recordData.embed] : []
                                                    });
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        } catch (error) {
                            // Continue with other users
                        }
                    }
                }
            } catch (error) {
                console.error(`[AggregationLayer] Failed to get all posts from PDS:`, error);
            }
        }

        // Deduplicate
        const uniquePosts = this.deduplicatePosts(posts);

        // Enrich with usernames
        const uniqueDids = [...new Set(uniquePosts.map(p => p.did))];
        const profilePromises = uniqueDids.map(did =>
            this.getProfile(did).catch(() => null)
        );
        const profiles = await Promise.all(profilePromises);

        const didToUsername = new Map<string, string | undefined>();
        profiles.forEach((profile, index) => {
            if (profile) {
                didToUsername.set(uniqueDids[index], profile.username);
            }
        });

        const enrichedPosts = uniquePosts.map(post => ({
            ...post,
            username: didToUsername.get(post.did)
        }));

        // Sort by timestamp (newest first)
        enrichedPosts.sort((a, b) => b.timestamp - a.timestamp);

        return enrichedPosts.slice(0, limit);
    }

    async createPost(did: string, text: string, parentHash?: string, embeds?: any[]) {
        // Use DID directly - no conversion needed

        // Create post via user's PDS
        // Find user's PDS
        const userPds = await this.getUserPDS(did);
        if (!userPds) {
            throw new Error('User PDS not found');
        }

        // Ensure PDS account exists before creating post
        try {
            await this.ensurePDSAccount(did, undefined);
        } catch (error) {
            console.error('[AggregationLayer] Failed to ensure PDS account:', error);
            // Continue anyway - might already exist
        }

        // Build record object, ensuring all values are serializable
        const record: any = {
            $type: 'app.daemon.feed.post',
            text: text || '',
            createdAt: new Date().toISOString()
        };

        // Add reply if parentHash exists
        if (parentHash) {
            record.reply = {
                root: {
                    uri: parentHash
                },
                parent: {
                    uri: parentHash
                }
            };
        }

        // Add embed if embeds exist and are valid
        if (embeds && Array.isArray(embeds) && embeds.length > 0) {
            const firstEmbed = embeds[0];
            // Ensure embed is a plain object (not a class instance)
            if (firstEmbed && typeof firstEmbed === 'object') {
                record.embed = JSON.parse(JSON.stringify(firstEmbed));
            }
        }

        // Build request body, removing undefined values
        const requestBody = {
            repo: did,
            collection: 'app.daemon.feed.post',
            record: record
        };

        // Log full request body before sending
        console.log('[AggregationLayer] Creating post on PDS:', {
            pds: userPds,
            did: did,
            textLength: text?.length,
            hasParentHash: !!parentHash,
            hasEmbeds: !!(embeds && embeds.length > 0)
        });
        console.log('[AggregationLayer] Full request body being sent to PDS:', JSON.stringify(requestBody, null, 2));

        // Create post on PDS
        const response = await fetch(`${userPds}/xrpc/com.atproto.repo.createRecord`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            // Try to parse error response
            let errorMessage = 'Failed to create post';
            try {
                const errorData: any = await response.json();
                errorMessage = errorData.error || errorData.message || errorMessage;
                console.error('[AggregationLayer] PDS error response:', errorData);
            } catch (parseError) {
                const errorText = await response.text();
                console.error('[AggregationLayer] PDS error (non-JSON):', errorText);
                errorMessage = errorText || errorMessage;
            }

            // If user not found, try to create account and retry
            if (errorMessage.includes('User not found') || errorMessage.includes('not found')) {
                console.log('[AggregationLayer] User not found in PDS, attempting to create account...');
                try {
                    await this.ensurePDSAccount(did, undefined);
                    // Retry once
                    const retryResponse = await fetch(`${userPds}/xrpc/com.atproto.repo.createRecord`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestBody)
                    });
                    if (!retryResponse.ok) {
                        const retryError: any = await retryResponse.json().catch(() => ({ error: 'Unknown error' }));
                        throw new Error(retryError.error || 'Failed to create post after account creation');
                    }
                    const retryResult: any = await retryResponse.json();
                    // Continue with retryResult below
                    const result = retryResult;

                    // Only submit to hubs for top-level posts (not replies)
                    if (!parentHash) {
                        const retryTimestamp = Math.floor(Date.now() / 1000);
                        const retryMessageContent = JSON.stringify({
                            did: did,
                            text: text,
                            timestamp: retryTimestamp,
                            parentHash: null,
                            mentions: [],
                            embeds: embeds || []
                        });
                        const retryMessageHash = ethers.keccak256(ethers.toUtf8Bytes(retryMessageContent));

                        // Submit to hubs (only for top-level posts)
                        for (const hubEndpoint of this.hubEndpoints) {
                            try {
                                await fetch(`${hubEndpoint}/api/v1/messages`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        hash: retryMessageHash,
                                        did: did,
                                        text,
                                        timestamp: retryTimestamp,
                                        embeds: embeds || []
                                    })
                                });
                            }
                            catch (error) {
                                console.error(`Failed to submit to hub ${hubEndpoint}:`, error);
                            }
                        }
                    }
                    return {
                        hash: result.uri,
                        did,
                        text,
                        parentHash: parentHash || undefined,
                        timestamp: Math.floor(Date.now() / 1000),
                        embeds: embeds || []
                    };
                } catch (retryError) {
                    throw new Error(`Failed to create post: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`);
                }
            } else {
                throw new Error(errorMessage);
            }
        }

        const result: any = await response.json();

        // Calculate proper hash for Hub (keccak256 of message content, matching Hub's calculation)
        const timestamp = Math.floor(Date.now() / 1000);
        const messageContent = JSON.stringify({
            did: did,
            text: text,
            timestamp: timestamp,
            parentHash: parentHash || null,
            mentions: [],
            embeds: embeds || []
        });
        // Only submit to hubs for top-level posts (not replies)
        // Replies are stored in PDS and don't need Hub propagation
        // The Hub expects hex-format parent hashes, but we use AT Protocol URIs
        if (!parentHash) {
            // Use ethers.keccak256 to match Hub's hash calculation
            const messageHash = ethers.keccak256(ethers.toUtf8Bytes(messageContent));

            // Submit to hubs for propagation (only for top-level posts)
            for (const hubEndpoint of this.hubEndpoints) {
                try {
                    const hubMessage = {
                        hash: messageHash,
                        did: did,
                        text,
                        messageType: 'post' as 'post' | 'reply',
                        timestamp: timestamp,
                        embeds: embeds || [],
                        deleted: false
                    };
                    console.log(`[AggregationLayer] Submitting message to hub ${hubEndpoint}:`, JSON.stringify(hubMessage, null, 2));
                    const hubResponse = await fetch(`${hubEndpoint}/api/v1/messages`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(hubMessage)
                    });
                    if (!hubResponse.ok) {
                        const errorText = await hubResponse.text();
                        console.error(`[AggregationLayer] Hub ${hubEndpoint} rejected message: ${hubResponse.status} ${errorText}`);
                    } else {
                        const hubResult = await hubResponse.json();
                        console.log(`[AggregationLayer] Message submitted to hub ${hubEndpoint} successfully:`, hubResult);
                    }
                }
                catch (error) {
                    console.error(`[AggregationLayer] Failed to submit to hub ${hubEndpoint}:`, error);
                }
            }
        } else {
            console.log(`[AggregationLayer] Skipping Hub submission for reply (stored in PDS only)`);
        }
        return {
            hash: result.uri,
            did,
            text,
            parentHash: parentHash || undefined,
            timestamp: Math.floor(Date.now() / 1000),
            embeds: embeds || []
        };
    }
    async getPost(hash: string, userDid?: string | null) {
        // Check cache
        if (this.redis) {
            const cached = await this.redis.get(`post:${hash}`);
            if (cached) {
                const post = JSON.parse(cached);
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
                    const post = await response.json();
                    // Enrich with votes if userDid provided
                    let enrichedPost = post;
                    if (userDid) {
                        enrichedPost = await this.enrichPostWithVotes(post, userDid);
                    }
                    // Cache
                    if (this.redis) {
                        await this.redis.setEx(`post:${hash}`, 3600, JSON.stringify(enrichedPost)); // 1 hour cache
                    }
                    return enrichedPost;
                }
            }
            catch (error) {
                console.error(`Failed to query hub ${hubEndpoint}:`, error);
            }
        }
        return null;
    }

    async getReplies(postHash: string) {
        const replies: any[] = [];

        // Query PDS for all posts with this parentHash
        // We need to query all users' PDS instances to find replies
        // For now, query the first PDS and search across all repos
        if (this.pdsEndpoints && this.pdsEndpoints.length > 0) {
            const userPds = this.pdsEndpoints[0];

            try {
                // Query PDS for all posts - we'll filter by parentHash
                // Since we can't query by parentHash directly, we'll need to get all posts and filter
                // For efficiency, we could query specific users, but for now get a larger set
                const response = await fetch(`${userPds}/xrpc/com.atproto.repo.listRecords?collection=app.daemon.feed.post&limit=500`);
                if (response.ok) {
                    const data: any = await response.json();
                    if (data.records && Array.isArray(data.records)) {
                        for (const record of data.records) {
                            const recordData = record.value || record;
                            if (recordData && recordData.text) {
                                // Extract parentHash from reply data
                                const parentHash = recordData.reply?.parent?.uri || recordData.reply?.root?.uri || undefined;

                                // If this post is a reply to the target post
                                if (parentHash === postHash) {
                                    const hash = record.uri || `at://${recordData.did || 'unknown'}/app.daemon.feed.post/${new Date(recordData.createdAt).getTime()}`;
                                    const did = recordData.did || hash.split('/')[2]?.replace('did:', '') || 'unknown';

                                    replies.push({
                                        hash: hash,
                                        did: did,
                                        text: recordData.text,
                                        timestamp: new Date(recordData.createdAt).getTime() / 1000,
                                        messageType: 'reply',
                                        parentHash: parentHash,
                                        embeds: recordData.embed ? [recordData.embed] : []
                                    });
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                console.error(`[AggregationLayer] Failed to query PDS for replies:`, error);
            }
        }

        // Also check database for replies stored there
        if (this.db) {
            try {
                const result = await this.db.query(`
                    SELECT hash, did, text, timestamp, message_type, parent_hash
                    FROM messages
                    WHERE parent_hash = $1 AND deleted = false
                    ORDER BY timestamp DESC
                    LIMIT 100
                `, [postHash]);

                for (const row of result.rows) {
                    // Only add if not already in replies (avoid duplicates)
                    if (!replies.find(r => r.hash === row.hash)) {
                        replies.push({
                            hash: row.hash,
                            did: row.did,
                            text: row.text,
                            timestamp: parseInt(row.timestamp),
                            messageType: row.message_type || 'reply',
                            parentHash: row.parent_hash,
                            embeds: [] // Embeds are in separate message_embeds table
                        });
                    }
                }
            } catch (error) {
                console.error(`[AggregationLayer] Failed to query database for replies:`, error);
            }
        }

        // Enrich replies with usernames from profiles
        const uniqueDids = [...new Set(replies.map(r => r.did))];
        const profilePromises = uniqueDids.map(did =>
            this.getProfile(did).catch(() => null)
        );
        const profiles = await Promise.all(profilePromises);

        const didToUsername = new Map<string, string | undefined>();
        profiles.forEach((profile, index) => {
            if (profile) {
                didToUsername.set(uniqueDids[index], profile.username);
            }
        });

        // Add usernames to replies
        const enrichedReplies = replies.map(reply => ({
            ...reply,
            username: didToUsername.get(reply.did)
        }));

        // Sort by timestamp (newest first)
        enrichedReplies.sort((a, b) => b.timestamp - a.timestamp);

        return enrichedReplies;
    }
    async getDIDFromAddress(walletAddress: string): Promise<string | null> {
        // Query users table to find FID for this wallet address
        // Then convert to DID format
        if (!this.db) {
            return null;
        }
        try {
            const result = await this.db.query(`SELECT fid FROM users WHERE address = $1 AND active = true LIMIT 1`, [walletAddress.toLowerCase()]);
            if (result.rows.length > 0) {
                const fid = result.rows[0].fid;
                return `did:daemon:${fid}`;
            }
        } catch (error) {
            console.error(`[AggregationLayer] Failed to lookup DID from address:`, error);
        }
        return null;
    }
    async getProfile(did: string) {
        // Check cache
        if (this.redis) {
            const cached = await this.redis.get(`profile:${did}`);
            if (cached) {
                return JSON.parse(cached);
            }
        }
        // Query database by DID only
        const result = await this.db.query(`SELECT * FROM profiles WHERE did = $1`, [did]);
        if (result.rows.length === 0) {
            // Auto-create basic profile with DID as username if it doesn't exist
            try {
                const insertResult = await this.db.query(`
                    INSERT INTO profiles (did, username, display_name, created_at)
                    VALUES ($1, $2, $2, NOW())
                    RETURNING *
                `, [did, did]);
                const row = insertResult.rows[0];
                const profile = {
                    did: row.did || did,
                    username: row.username,
                    displayName: row.display_name,
                    bio: row.bio,
                    avatar: row.avatar_cid,
                    banner: row.banner_cid,
                    verified: row.verified
                };
                // Cache
                if (this.redis) {
                    await this.redis.setEx(`profile:${did}`, 1800, JSON.stringify(profile)); // 30 min cache
                }
                return profile;
            } catch (error) {
                console.error(`[AggregationLayer] Failed to auto-create profile for ${did}:`, error);
                // Return null if auto-creation fails
                return null;
            }
        }
        const row = result.rows[0];
        const profile = {
            did: row.did || did,
            username: row.username,
            displayName: row.display_name,
            bio: row.bio,
            avatar: row.avatar_cid,
            banner: row.banner_cid,
            verified: row.verified
        };
        // Cache
        if (this.redis) {
            await this.redis.setEx(`profile:${did}`, 1800, JSON.stringify(profile)); // 30 min cache
        }
        return profile;
    }
    async createFollow(followerDid: string, followingDid: string) {
        // Create follow on user's PDS
        const userPds = await this.getUserPDS(followerDid);
        if (!userPds) {
            throw new Error('User PDS not found');
        }
        await fetch(`${userPds}/xrpc/com.atproto.repo.createRecord`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                repo: followerDid,
                collection: 'app.daemon.graph.follow',
                record: {
                    $type: 'app.daemon.graph.follow',
                    subject: followingDid,
                    createdAt: new Date().toISOString()
                }
            })
        });
        // Update database using DIDs directly
        await this.db.query(`INSERT INTO follows (follower_did, following_did, timestamp, active)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (follower_did, following_did) DO UPDATE SET active = true`, [followerDid, followingDid, Math.floor(Date.now() / 1000)]);
        // Invalidate cache
        if (this.redis) {
            await this.redis.del(`follows:${followerDid}`);
        }
    }
    async deleteFollow(followerDid: string, followingDid: string) {
        await this.db.query(`UPDATE follows SET active = false
       WHERE follower_did = $1 AND following_did = $2`, [followerDid, followingDid]);
        // Invalidate cache
        if (this.redis) {
            await this.redis.del(`follows:${followerDid}`);
        }
    }
    async createReaction(did: string, targetHash: string, type: 'like' | 'repost' | 'quote'): Promise<Reaction> {
        // Store reaction in database - using DID
        await this.db.query(`INSERT INTO reactions (did, target_hash, reaction_type, timestamp, active)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (did, target_hash, reaction_type) DO UPDATE SET active = true`, [did, targetHash, type, Math.floor(Date.now() / 1000)]);
        return {
            type,
            targetHash,
            did: did,
            timestamp: Math.floor(Date.now() / 1000)
        };
    }
    async searchPosts(query: string, limit: number) {
        // Full-text search in database
        const result = await this.db.query(`SELECT * FROM messages
       WHERE deleted = false
       AND to_tsvector('english', text) @@ plainto_tsquery('english', $1)
       ORDER BY timestamp DESC
       LIMIT $2`, [query, limit]);
        return result.rows.map((row) => ({
            hash: row.hash,
            did: row.did,
            text: row.text,
            timestamp: parseInt(row.timestamp)
        }));
    }
    async searchUsers(query: string, limit: number) {
        const result = await this.db.query(`SELECT * FROM profiles
       WHERE username ILIKE $1 OR display_name ILIKE $1
       LIMIT $2`, [`%${query}%`, limit]);
        return result.rows.map((row) => ({
            did: row.did,
            username: row.username,
            displayName: row.display_name,
            bio: row.bio,
            avatar: row.avatar_cid,
            verified: row.verified
        }));
    }
    async getUserPDS(did: string) {
        // In production, would query user's PDS assignment
        // For now, return first PDS (direct URL for server-side requests)
        if (this.pdsEndpoints && this.pdsEndpoints.length > 0) {
            // Return direct URL (e.g., http://localhost:4002) for server-side requests
            return this.pdsEndpoints[0];
        }
        return null;
    }
    async getUnreadNotificationCount(did: string) {
        if (!this.config.databaseUrl || !this.db) {
            return 0;
        }
        try {
            // Count reactions on user's posts (likes, reposts, replies)
            // Count new follows
            // For now, we'll count reactions on posts created by this user in the last 7 days
            const sevenDaysAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);
            const result = await this.db.query(`SELECT COUNT(DISTINCT r.id) as count
         FROM reactions r
         INNER JOIN messages m ON r.target_hash = m.hash
         WHERE m.did = $1
           AND r.did != $1
           AND m.timestamp > $2
           AND r.active = true`, [did, sevenDaysAgo]);
            const reactionCount = parseInt(result.rows[0]?.count || '0');
            // Count new follows (people who followed you in last 7 days)
            const followResult = await this.db.query(`SELECT COUNT(*) as count
         FROM follows
         WHERE following_did = $1
           AND active = true
           AND timestamp > $2`, [did, sevenDaysAgo]);
            const followCount = parseInt(followResult.rows[0]?.count || '0');
            // For now, return sum of reactions and follows
            // In the future, we could track read/unread status
            return reactionCount + followCount;
        }
        catch (error) {
            console.error('Error getting notification count:', error);
            return 0;
        }
    }
    async ensurePDSAccount(did: string, walletAddress?: string) {
        // Check if user exists in PDS
        const userPds = await this.getUserPDS(did);
        if (!userPds) {
            throw new Error('PDS endpoint not available');
        }

        try {
            // Try to get profile from PDS
            const profileResponse = await fetch(`${userPds}/xrpc/com.atproto.repo.getProfile?did=${did}`);
            if (profileResponse.ok) {
                // User exists, return
                return;
            }
        } catch (error) {
            // Continue to create account
            console.log('[AggregationLayer] Profile check failed, will create account:', error);
        }

        // User doesn't exist, create account
        // Get profile from Gateway database to get handle
        const profileResult = await this.db.query(`SELECT username, display_name FROM profiles WHERE did = $1`, [did]);
        if (profileResult.rows.length === 0) {
            throw new Error('Profile not found in Gateway database');
        }

        const handle = profileResult.rows[0].username || did; // Use DID as fallback handle

        // Create account on PDS
        const createResponse = await fetch(`${userPds}/xrpc/com.atproto.server.createAccount`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                handle: handle,
                did: did,
                walletAddress: walletAddress || null
            })
        });

        if (!createResponse.ok) {
            const errorData: any = await createResponse.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(`Failed to create PDS account: ${errorData.error || 'Unknown error'}`);
        }

        console.log('[AggregationLayer] PDS account created successfully for:', did);
    }

    async createVote(did: string, targetHash: string, targetType: 'post' | 'comment', voteType: 'UP' | 'DOWN') {
        const timestamp = Math.floor(Date.now() / 1000);

        // Insert or update vote
        await this.db.query(`
            INSERT INTO votes (did, target_hash, target_type, vote_type, timestamp)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (did, target_hash)
            DO UPDATE SET vote_type = $4, timestamp = $5
        `, [did, targetHash, targetType, voteType, timestamp]);

        return {
            did,
            targetHash,
            targetType,
            voteType,
            timestamp
        };
    }

    async getPostVotes(targetHash: string) {
        const result = await this.db.query(`
            SELECT
                COUNT(*) as vote_count,
                SUM(CASE WHEN vote_type = 'UP' THEN 1 ELSE 0 END) as upvote_count,
                SUM(CASE WHEN vote_type = 'DOWN' THEN 1 ELSE 0 END) as downvote_count
            FROM votes
            WHERE target_hash = $1
        `, [targetHash]);

        const row = result.rows[0];
        return {
            voteCount: parseInt(row.vote_count || '0'),
            upvoteCount: parseInt(row.upvote_count || '0'),
            downvoteCount: parseInt(row.downvote_count || '0')
        };
    }

    async getUserVote(did: string, targetHash: string) {
        const result = await this.db.query(`
            SELECT vote_type FROM votes
            WHERE did = $1 AND target_hash = $2
        `, [did, targetHash]);

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0].vote_type;
    }

    async enrichPostWithVotes(post: any, userDid: string) {
        if (!post || !post.hash) {
            return post;
        }

        const votes = await this.getPostVotes(post.hash);
        const userVote = await this.getUserVote(userDid, post.hash);

        return {
            ...post,
            voteCount: votes.voteCount,
            upvoteCount: votes.upvoteCount,
            downvoteCount: votes.downvoteCount,
            currentVote: userVote || null
        };
    }

    async enrichPostsWithVotes(posts: any[], userDid: string) {
        if (!posts || !Array.isArray(posts)) {
            return posts;
        }

        return Promise.all(posts.map(post => this.enrichPostWithVotes(post, userDid)));
    }

    async updateProfile(did: string, updates: {
        username?: string;
        displayName?: string;
        bio?: string;
        avatar?: string;
        banner?: string;
        website?: string;
        walletAddress?: string;
    }) {
        // Use DID directly - no conversion needed

        // Build update query dynamically
        const updateFields = [];
        const values = [];
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
            // No updates, just return current profile
            return await this.getProfile(did);
        }

        // Add updated_at
        updateFields.push(`updated_at = NOW()`);

        // Ensure did is set
        updateFields.push(`did = $${paramIndex++}`);
        values.push(did);

        // Add did for WHERE clause
        values.push(did);

        // Update profile in database
        const updateQuery = `
            UPDATE profiles
            SET ${updateFields.join(', ')}
            WHERE did = $${paramIndex}
            RETURNING *
        `;

        const result = await this.db.query(updateQuery, values);

        if (result.rows.length === 0) {
            // Profile doesn't exist, create it
            const insertResult = await this.db.query(`
                INSERT INTO profiles (did, username, display_name, bio, avatar_cid, banner_cid, website, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                RETURNING *
            `, [
                did,
                updates.username || did,
                updates.displayName || updates.username || did,
                updates.bio || null,
                updates.avatar || null,
                updates.banner || null,
                updates.website || null
            ]);

            // Ensure PDS account exists if walletAddress provided
            if (updates.walletAddress) {
                try {
                    await this.ensurePDSAccount(did, updates.walletAddress);
                } catch (error) {
                    console.error('[AggregationLayer] Failed to ensure PDS account during profile update:', error);
                }
            }

            const row = insertResult.rows[0];
            return {
                did: row.did || did,
                username: row.username,
                displayName: row.display_name,
                bio: row.bio,
                avatar: row.avatar_cid,
                banner: row.banner_cid,
                verified: row.verified
            };
        }

        // Ensure PDS account exists if walletAddress provided
        if (updates.walletAddress) {
            try {
                await this.ensurePDSAccount(did, updates.walletAddress);
            } catch (error) {
                console.error('[AggregationLayer] Failed to ensure PDS account during profile update:', error);
            }
        }

        const row = result.rows[0];
        const profile = {
            did: row.did || did,
            username: row.username,
            displayName: row.display_name,
            bio: row.bio,
            avatar: row.avatar_cid,
            banner: row.banner_cid,
            verified: row.verified
        };

        // Invalidate cache
        if (this.redis) {
            await this.redis.del(`profile:${did}`);
        }

        return profile;
    }

    async getReactions(postHash: string, did: string): Promise<{ liked: boolean; reposted: boolean }> {
        try {
            const result = await this.db.query(`
                SELECT reaction_type FROM reactions
                WHERE did = $1 AND target_hash = $2 AND active = true
            `, [did, postHash]);

            const reactions = result.rows.map((row: any) => row.reaction_type);
            return {
                liked: reactions.includes('like'),
                reposted: reactions.includes('repost')
            };
        } catch (error) {
            console.error('Error getting reactions:', error);
            return { liked: false, reposted: false };
        }
    }

    async getNotifications(did: string): Promise<{ notifications: any[] }> {
        try {
            const sevenDaysAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);

            // Get reactions on user's posts
            const reactionsResult = await this.db.query(`
                SELECT r.*, m.text as post_text, m.hash as post_hash, r.did as from_did
                FROM reactions r
                INNER JOIN messages m ON r.target_hash = m.hash
                WHERE m.did = $1
                  AND r.did != $1
                  AND m.timestamp > $2
                  AND r.active = true
                ORDER BY r.timestamp DESC
                LIMIT 50
            `, [did, sevenDaysAgo]);

            // Get new follows
            const followsResult = await this.db.query(`
                SELECT f.*, f.follower_did as from_did
                FROM follows f
                WHERE f.following_did = $1
                  AND f.active = true
                  AND f.timestamp > $2
                ORDER BY f.timestamp DESC
                LIMIT 50
            `, [did, sevenDaysAgo]);

            // Get replies to user's posts
            const repliesResult = await this.db.query(`
                SELECT m.*, m.did as from_did, parent.hash as post_hash, parent.text as post_text
                FROM messages m
                INNER JOIN messages parent ON m.parent_hash = parent.hash
                WHERE parent.did = $1
                  AND m.did != $1
                  AND m.timestamp > $2
                  AND m.deleted = false
                ORDER BY m.timestamp DESC
                LIMIT 50
            `, [did, sevenDaysAgo]);

            const notifications: any[] = [];

            // Process reactions
            reactionsResult.rows.forEach((row: any) => {
                notifications.push({
                    id: `reaction_${row.id}`,
                    type: row.reaction_type === 'like' ? 'like' : row.reaction_type === 'repost' ? 'repost' : 'reaction',
                    from: { did: row.from_did },
                    post: { hash: row.post_hash, text: row.post_text },
                    timestamp: parseInt(row.timestamp),
                    read: false
                });
            });

            // Process follows
            followsResult.rows.forEach((row: any) => {
                notifications.push({
                    id: `follow_${row.id}`,
                    type: 'follow',
                    from: { did: row.from_did },
                    timestamp: parseInt(row.timestamp),
                    read: false
                });
            });

            // Process replies
            repliesResult.rows.forEach((row: any) => {
                notifications.push({
                    id: `reply_${row.hash}`,
                    type: 'reply',
                    from: { did: row.from_did },
                    post: { hash: row.post_hash, text: row.post_text },
                    timestamp: parseInt(row.timestamp),
                    read: false
                });
            });

            // Sort by timestamp (newest first)
            notifications.sort((a, b) => b.timestamp - a.timestamp);

            return { notifications: notifications.slice(0, 50) };
        } catch (error) {
            console.error('Error getting notifications:', error);
            return { notifications: [] };
        }
    }

    deduplicatePosts(posts: any[]) {
        const seen = new Set();
        return posts.filter((post: any) => {
            if (seen.has(post.hash)) {
                return false;
            }
            seen.add(post.hash);
            return true;
        });
    }
}
//# sourceMappingURL=aggregation-layer.js.map
