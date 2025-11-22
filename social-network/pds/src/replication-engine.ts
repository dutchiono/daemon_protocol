/**
 * @title Replication Engine
 * @notice Handles data replication across PDS federation
 */

import { Database } from './database.js';
import type { Config } from './config.js';

export class ReplicationEngine {
  private db: Database;
  private config: Config;
  private replicationInterval?: NodeJS.Timeout;

  constructor(db: Database, config: Config) {
    this.db = db;
    this.config = config;
  }

  async start(): Promise<void> {
    // Initial replication sync
    await this.syncWithFederation();

    // Setup periodic replication (every 10 minutes)
    this.replicationInterval = setInterval(() => {
      this.syncWithFederation().catch(console.error);
    }, 10 * 60 * 1000);
  }

  async stop(): Promise<void> {
    if (this.replicationInterval) {
      clearInterval(this.replicationInterval);
    }
  }

  private async syncWithFederation(): Promise<void> {
    for (const peerPds of this.config.federationPeers) {
      try {
        await this.syncWithPeer(peerPds);
      } catch (error) {
        console.error(`Failed to sync with PDS ${peerPds}:`, error);
      }
    }
  }

  private async syncWithPeer(peerPds: string): Promise<void> {
    // Get our latest records
    const ourLatest = await this.db.getLatestRecordTimestamp();

    // Request records from peer since our latest
    // This would use HTTP API to fetch from peer PDS
    // For now, placeholder implementation
  }

  async replicateUser(did: string): Promise<void> {
    // Replicate user creation to federation
    const user = await this.db.getUserByDID(did);
    if (!user) return;

    // Send to federation peers
    for (const peerPds of this.config.federationPeers) {
      try {
        await this.sendToPeer(peerPds, 'user', user);
      } catch (error) {
        console.error(`Failed to replicate user to ${peerPds}:`, error);
      }
    }
  }

  async replicateRecord(repo: string, collection: string, uri: string): Promise<void> {
    // Replicate record to federation
    const record = await this.db.getRecord(uri);
    if (!record) return;

    // Send to federation peers
    for (const peerPds of this.config.federationPeers) {
      try {
        await this.sendToPeer(peerPds, 'record', { repo, collection, record });
      } catch (error) {
        console.error(`Failed to replicate record to ${peerPds}:`, error);
      }
    }
  }

  async replicateFollow(repo: string, uri: string): Promise<void> {
    // Replicate follow to federation
    const follow = await this.db.getFollow(uri);
    if (!follow) return;

    // Send to federation peers
    for (const peerPds of this.config.federationPeers) {
      try {
        await this.sendToPeer(peerPds, 'follow', { repo, follow });
      } catch (error) {
        console.error(`Failed to replicate follow to ${peerPds}:`, error);
      }
    }
  }

  async notifyMigration(did: string, newPds: string): Promise<void> {
    // Notify federation of account migration
    for (const peerPds of this.config.federationPeers) {
      try {
        await fetch(`${peerPds}/xrpc/com.atproto.server.handleMigration`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ did, newPds })
        });
      } catch (error) {
        console.error(`Failed to notify migration to ${peerPds}:`, error);
      }
    }
  }

  private async sendToPeer(peerPds: string, type: string, data: any): Promise<void> {
    // Send data to peer PDS
    await fetch(`${peerPds}/xrpc/com.atproto.replication.receive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data })
    });
  }
}

