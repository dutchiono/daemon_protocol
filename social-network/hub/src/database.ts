/**
 * @title Database
 * @notice Database interface for hub message storage
 */

import pg from 'pg';
import type { Message } from './types.js';

const { Pool } = pg;

export class Database {
  private pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async storeMessage(message: Message): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Ensure user exists (create if not) - using DID as primary key
      await client.query(
        `INSERT INTO users (did, address, created_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (did) DO NOTHING`,
        [message.did, message.did] // Use DID as address placeholder for now
      );

      // Insert message - using DID
      await client.query(
        `INSERT INTO messages (
          hash, did, text, message_type, parent_hash, root_parent_hash,
          mentions, mentions_positions, timestamp, deleted
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (hash) DO NOTHING`,
        [
          message.hash,
          message.did,
          message.text,
          message.messageType || 'cast',
          message.parentHash || null,
          message.rootParentHash || null,
          message.mentions || [],
          message.mentionsPositions || [],
          message.timestamp,
          message.deleted || false
        ]
      );

      // Insert embeds if any
      if (message.embeds && message.embeds.length > 0) {
        for (const embed of message.embeds) {
          await client.query(
            `INSERT INTO message_embeds (
              message_hash, embed_type, url, cast_hash, metadata
            ) VALUES ($1, $2, $3, $4, $5)`,
            [
              message.hash,
              embed.type,
              embed.url || null,
              embed.castHash || null,
              embed.metadata ? JSON.stringify(embed.metadata) : null
            ]
          );
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getMessage(hash: string): Promise<Message | null> {
    const result = await this.pool.query(
      `SELECT * FROM messages WHERE hash = $1 AND deleted = false`,
      [hash]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    // Get embeds
    const embedsResult = await this.pool.query(
      `SELECT * FROM message_embeds WHERE message_hash = $1`,
      [hash]
    );

    return {
      hash: row.hash,
      did: row.did,
      text: row.text,
      messageType: row.message_type,
      parentHash: row.parent_hash,
      rootParentHash: row.root_parent_hash,
      mentions: row.mentions || [],
      mentionsPositions: row.mentions_positions || [],
      timestamp: parseInt(row.timestamp),
      deleted: row.deleted,
      embeds: embedsResult.rows.map((e: any) => ({
        type: e.embed_type,
        url: e.url,
        castHash: e.cast_hash,
        metadata: e.metadata ? JSON.parse(e.metadata) : undefined
      }))
    };
  }

  async getMessagesByDid(did: string, limit: number, offset: number): Promise<Message[]> {
    const result = await this.pool.query(
      `SELECT * FROM messages
       WHERE did = $1 AND deleted = false
       ORDER BY timestamp DESC
       LIMIT $2 OFFSET $3`,
      [did, limit, offset]
    );

    // Load embeds for each message
    const messages: Message[] = [];
    for (const row of result.rows) {
      const embedsResult = await this.pool.query(
        `SELECT * FROM message_embeds WHERE message_hash = $1`,
        [row.hash]
      );

      messages.push({
        hash: row.hash,
        did: row.did,
        text: row.text,
        messageType: row.message_type,
        parentHash: row.parent_hash,
        rootParentHash: row.root_parent_hash,
        mentions: row.mentions || [],
        mentionsPositions: row.mentions_positions || [],
        timestamp: parseInt(row.timestamp),
        deleted: row.deleted,
        embeds: embedsResult.rows.map((e: any) => ({
          type: e.embed_type,
          url: e.url,
          castHash: e.cast_hash,
          metadata: e.metadata ? JSON.parse(e.metadata) : undefined
        }))
      });
    }

    return messages;
  }

  async getMessagesByDids(dids: string[], limit: number): Promise<Message[]> {
    if (dids.length === 0) {
      return [];
    }

    // Query messages from multiple DIDs
    const placeholders = dids.map((_, i) => `$${i + 1}`).join(',');
    const result = await this.pool.query(
      `SELECT * FROM messages
       WHERE did = ANY($1::varchar[]) AND deleted = false
       ORDER BY timestamp DESC
       LIMIT $2`,
      [dids, limit]
    );

    // Load embeds for each message
    const messages: Message[] = [];
    for (const row of result.rows) {
      const embedsResult = await this.pool.query(
        `SELECT * FROM message_embeds WHERE message_hash = $1`,
        [row.hash]
      );

      messages.push({
        hash: row.hash,
        did: row.did,
        text: row.text,
        messageType: row.message_type,
        parentHash: row.parent_hash,
        rootParentHash: row.root_parent_hash,
        mentions: row.mentions || [],
        mentionsPositions: row.mentions_positions || [],
        timestamp: parseInt(row.timestamp),
        deleted: row.deleted,
        embeds: embedsResult.rows.map((e: any) => ({
          type: e.embed_type,
          url: e.url,
          castHash: e.cast_hash,
          metadata: e.metadata ? JSON.parse(e.metadata) : undefined
        }))
      });
    }

    return messages;
  }

  async getLatestMessageTimestamp(): Promise<number> {
    const result = await this.pool.query(
      `SELECT MAX(timestamp) as max_timestamp FROM messages`
    );

    return result.rows[0]?.max_timestamp || 0;
  }

  async getMessageCount(): Promise<number> {
    const result = await this.pool.query(
      `SELECT COUNT(*) as count FROM messages WHERE deleted = false`
    );

    return parseInt(result.rows[0].count);
  }
}

