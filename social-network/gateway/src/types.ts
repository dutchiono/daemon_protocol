/**
 * @title Types
 * @notice Type definitions for gateway
 */

export interface Post {
  hash: string;
  did: string; // did:daemon:${fid}
  text: string;
  parentHash?: string;
  timestamp: number;
  embeds?: any[];
}

export interface Profile {
  did: string; // did:daemon:${fid}
  username?: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  banner?: string;
  website?: string;
  verified: boolean;
}

export interface Feed {
  posts: Post[];
  cursor?: string;
}

export interface Reaction {
  type: 'like' | 'repost' | 'quote';
  targetHash: string;
  did: string; // did:daemon:${fid}
  timestamp: number;
}

