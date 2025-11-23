/**
 * @title Types
 * @notice Type definitions for gateway
 */

export interface Post {
  hash: string;
  did: string; // did:daemon:X (Daemon DID)
  text: string;
  parentHash?: string;
  timestamp: number;
  embeds?: any[];
  voteCount?: number; // Net votes (upvotes - downvotes)
  upvoteCount?: number;
  downvoteCount?: number;
  currentVote?: 'UP' | 'DOWN' | null; // Current user's vote
}

export interface Profile {
  did: string; // did:daemon:X (Daemon DID)
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
  did: string; // did:daemon:X (Daemon DID)
  timestamp: number;
}

export interface Vote {
  did: string; // did:daemon:X (Daemon DID)
  targetHash: string;
  targetType: 'post' | 'comment';
  voteType: 'UP' | 'DOWN';
  timestamp: number;
}

export interface PostWithVotes extends Post {
  voteCount?: number; // Net votes (upvotes - downvotes)
  upvoteCount?: number;
  downvoteCount?: number;
  currentVote?: 'UP' | 'DOWN' | null; // Current user's vote
}

