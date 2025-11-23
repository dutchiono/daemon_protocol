/**
 * @title Types
 * @notice Type definitions for PDS
 */

export interface Profile {
  did: string;
  handle: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  banner?: string;
  createdAt: string;
}

export interface Record {
  $type: string;
  text: string;
  createdAt: string;
  [key: string]: any;
}

export interface Follow {
  $type: 'app.daemon.graph.follow';
  subject: string; // DID of followed user
  createdAt: string;
}

