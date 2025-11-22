/**
 * @title Aggregation Layer
 * @notice Aggregates data from hubs and PDS
 */
import type { Config } from './config.js';
import type { Post, Profile, Reaction } from './types.js';
export declare class AggregationLayer {
    private db;
    private redis?;
    private config;
    private hubEndpoints;
    private pdsEndpoints;
    constructor(config: Config);
    getFollows(fid: number): Promise<number[]>;
    getPostsFromUsers(fids: number[], type: string, limit: number, cursor?: string): Promise<Post[]>;
    createPost(fid: number, text: string, parentHash?: string, embeds?: any[]): Promise<Post>;
    getPost(hash: string): Promise<Post | null>;
    getProfile(fid: number): Promise<Profile | null>;
    createFollow(followerFid: number, followingFid: number): Promise<void>;
    deleteFollow(followerFid: number, followingFid: number): Promise<void>;
    createReaction(fid: number, targetHash: string, type: 'like' | 'repost' | 'quote'): Promise<Reaction>;
    searchPosts(query: string, limit: number): Promise<Post[]>;
    searchUsers(query: string, limit: number): Promise<Profile[]>;
    private getUserPDS;
    private deduplicatePosts;
}
//# sourceMappingURL=aggregation-layer.d.ts.map