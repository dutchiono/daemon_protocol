/**
 * @title Gateway Service
 * @notice Core gateway service for API aggregation
 */
import { AggregationLayer } from './aggregation-layer.js';
import type { Config } from './config.js';
import type { Post, Profile, Feed, Reaction } from './types.js';
export declare class GatewayService {
    private aggregationLayer;
    private config;
    constructor(aggregationLayer: AggregationLayer, config: Config);
    getFeed(fid: number, type: string, limit: number, cursor?: string): Promise<Feed>;
    createPost(fid: number, text: string, parentHash?: string, embeds?: any[]): Promise<Post>;
    getPost(hash: string): Promise<Post | null>;
    getProfile(fid: number): Promise<Profile | null>;
    follow(followerFid: number, followingFid: number): Promise<{
        success: boolean;
    }>;
    unfollow(followerFid: number, followingFid: number): Promise<{
        success: boolean;
    }>;
    createReaction(fid: number, targetHash: string, type: 'like' | 'repost' | 'quote'): Promise<Reaction>;
    search(query: string, type: string, limit: number): Promise<any>;
    private rankPostsAlgorithmically;
    getGatewayId(): string;
}
//# sourceMappingURL=gateway-service.d.ts.map