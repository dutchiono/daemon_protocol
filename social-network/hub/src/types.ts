/**
 * @title Types
 * @notice Type definitions for hub
 */

export interface Message {
  hash: string;
  fid: number;
  text: string;
  messageType?: 'cast' | 'post' | 'reply';
  parentHash?: string;
  rootParentHash?: string;
  mentions?: number[];
  mentionsPositions?: number[];
  timestamp: number;
  deleted?: boolean;
  embeds?: Embed[];
  signature?: string; // Ed25519 signature
  signingKey?: string; // Ed25519 public key (bytes32)
}

export interface Embed {
  type: 'url' | 'cast' | 'image' | 'video' | 'audio';
  url?: string;
  castHash?: string;
  metadata?: {
    title?: string;
    description?: string;
    image?: string;
  };
}

export interface MessageResult {
  hash: string;
  status: 'accepted' | 'rejected';
  timestamp: number;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

