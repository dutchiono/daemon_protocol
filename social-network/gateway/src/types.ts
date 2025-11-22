/**
 * @title Types
 * @notice Type definitions for gateway
 */

export interface Post {
  hash: string;
  fid: number;
  text: string;
  parentHash?: string;
  timestamp: number;
  embeds?: any[];
}

export interface Profile {
  fid: number;
  username?: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  banner?: string;
  verified: boolean;
}

export interface Feed {
  posts: Post[];
  cursor?: string;
}

export interface Reaction {
  type: 'like' | 'repost' | 'quote';
  targetHash: string;
  fid: number;
  timestamp: number;
}

