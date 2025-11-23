/**
 * @title Hub Service
 * @notice Core hub service for message relay and validation
 */

import type { Libp2p } from 'libp2p';
import { Database } from './database.js';
import { MessageValidator } from './message-validator.js';
import { SyncEngine } from './sync-engine.js';
import type { Config } from './config.js';
import type { Message, MessageResult } from './types.js';

export class HubService {
  private node: Libp2p;
  private db: Database;
  private validator: MessageValidator;
  private syncEngine: SyncEngine;
  private config: Config;
  private messageCache: Map<string, Message> = new Map();

  constructor(
    node: Libp2p,
    db: Database,
    validator: MessageValidator,
    syncEngine: SyncEngine,
    config: Config
  ) {
    this.node = node;
    this.db = db;
    this.validator = validator;
    this.syncEngine = syncEngine;
    this.config = config;
  }

  async start(): Promise<void> {
    // Start libp2p node
    await this.node.start();

    // Connect to peer hubs
    await this.connectToPeers();

    // Start sync engine
    await this.syncEngine.start();

    // Setup message handlers
    this.setupMessageHandlers();

    console.log('Hub service started');
  }

  async stop(): Promise<void> {
    await this.syncEngine.stop();
    await this.node.stop();
    console.log('Hub service stopped');
  }

  private async connectToPeers(): Promise<void> {
    for (const peerAddress of this.config.peers) {
      try {
        const multiaddr = peerAddress as any;
        await this.node.dial(multiaddr);
        console.log(`Connected to peer: ${peerAddress}`);
      } catch (error) {
        console.error(`Failed to connect to peer ${peerAddress}:`, error);
      }
    }
  }

  private setupMessageHandlers(): void {
    // Handle incoming messages from peers
    // Note: peer:message event may not exist in this libp2p version
    // Using any to bypass type checking for now
    (this.node as any).addEventListener('peer:message', async (event: any) => {
      const message = event.detail;
      await this.handleIncomingMessage(message);
    });
  }

  async submitMessage(message: Message): Promise<MessageResult> {
    // Validate message
    const validation = await this.validator.validate(message);
    if (!validation.valid) {
      throw new Error(`Invalid message: ${validation.error}`);
    }

    // Store message
    await this.db.storeMessage(message);

    // Cache message
    this.messageCache.set(message.hash, message);

    // Propagate to peers
    await this.propagateMessage(message);

    return {
      hash: message.hash,
      status: 'accepted',
      timestamp: Date.now()
    };
  }

  async getMessage(hash: string): Promise<Message | null> {
    // Check cache first
    if (this.messageCache.has(hash)) {
      return this.messageCache.get(hash)!;
    }

    // Query database
    const message = await this.db.getMessage(hash);
    if (message) {
      this.messageCache.set(hash, message);
    }

    return message;
  }

  async getMessagesByFid(fid: number, limit: number, offset: number): Promise<Message[]> {
    return await this.db.getMessagesByFid(fid, limit, offset);
  }

  async getMessagesByFids(fids: number[], limit: number): Promise<Message[]> {
    return await this.db.getMessagesByFids(fids, limit);
  }

  private async handleIncomingMessage(message: Message): Promise<void> {
    // Check if we already have this message
    const existing = await this.getMessage(message.hash);
    if (existing) {
      return; // Already have it
    }

    // Validate message
    const validation = await this.validator.validate(message);
    if (!validation.valid) {
      console.warn(`Invalid message received: ${validation.error}`);
      return;
    }

    // Store message
    await this.db.storeMessage(message);
    this.messageCache.set(message.hash, message);

    // Propagate to other peers (gossip)
    await this.propagateMessage(message);
  }

  private async propagateMessage(message: Message): Promise<void> {
    // Get connected peers
    const peers = this.node.getPeers();

    // Send message to all peers
    for (const peerId of peers) {
      try {
        const stream = await this.node.dialProtocol(peerId, '/daemon/message/1.0.0');
        // Send message over stream
        // Implementation depends on libp2p stream API
      } catch (error) {
        console.error(`Failed to propagate message to peer ${peerId}:`, error);
      }
    }
  }

  async getSyncStatus(): Promise<{
    lastSyncTimestamp: number;
    peerCount: number;
    messageCount: number;
  }> {
    const status = await this.syncEngine.getStatus();
    const messageCount = await this.db.getMessageCount();

    return {
      lastSyncTimestamp: status.lastSyncTimestamp,
      peerCount: this.node.getPeers().length,
      messageCount
    };
  }

  getPeers(): string[] {
    return this.node.getPeers().map((peerId: any) => peerId.toString());
  }

  getNodeId(): string {
    return this.node.peerId.toString();
  }
}

