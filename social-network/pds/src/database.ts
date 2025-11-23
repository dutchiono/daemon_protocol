/**
 * @title Database
 * @notice Database interface for PDS data storage
 */

import pg from 'pg';
import type { Profile, Record, Follow } from './types.js';

const { Pool } = pg;

export class Database {
  private pool: pg.Pool;

  constructor(connectionString: string) {
    if (!connectionString || connectionString.trim() === '') {
      throw new Error('DATABASE_URL is required for PDS');
    }
    this.pool = new Pool({ connectionString });
  }

  async createUser(did: string, handle: string, email: string, password: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO pds_users (did, handle, email, password_hash, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [did, handle, email, password] // In production, hash password
    );
  }

  async getUserByDID(did: string): Promise<any | null> {
    const result = await this.pool.query(
      `SELECT * FROM pds_users WHERE did = $1`,
      [did]
    );
    return result.rows[0] || null;
  }

  async getUserByHandle(handle: string): Promise<any | null> {
    const result = await this.pool.query(
      `SELECT * FROM pds_users WHERE handle = $1`,
      [handle]
    );
    return result.rows[0] || null;
  }

  async createProfile(did: string, handle: string): Promise<void> {
    // Validate inputs
    if (!did || typeof did !== 'string') {
      throw new Error(`Invalid DID: ${did} (type: ${typeof did})`);
    }
    if (!handle || typeof handle !== 'string') {
      throw new Error(`Invalid handle: ${handle} (type: ${typeof handle})`);
    }

    // Extract FID from DID: did:daemon:1 -> 1
    const fidMatch = did.match(/^did:daemon:(\d+)$/);
    if (!fidMatch || !fidMatch[1]) {
      throw new Error(`Invalid DID format: ${did}. Expected format: did:daemon:<number>`);
    }

    const fid = parseInt(fidMatch[1], 10);
    if (isNaN(fid) || fid <= 0) {
      throw new Error(`Invalid FID extracted from DID: ${did}. Parsed FID: ${fidMatch[1]}`);
    }

    console.log(`[Database] Creating profile - DID: ${did}, FID: ${fid}, Handle: ${handle}`);

    try {
      await this.pool.query(
        `INSERT INTO profiles (fid, did, username, display_name, created_at)
         VALUES ($1, $2, $3, $3, NOW())
         ON CONFLICT (fid) DO UPDATE SET did = $2, username = $3, updated_at = NOW()`,
        [fid, did, handle]
      );
      console.log(`[Database] Profile created successfully - DID: ${did}, FID: ${fid}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Database] Failed to create profile - DID: ${did}, FID: ${fid}, Handle: ${handle}, Error: ${errorMessage}`);
      if (error instanceof Error && error.stack) {
        console.error(`[Database] Stack trace:`, error.stack);
      }
      throw error;
    }
  }

  async getProfile(did: string): Promise<Profile | null> {
    // Map DID to FID (simplified - would need proper mapping)
    const user = await this.getUserByDID(did);
    if (!user) return null;

    const result = await this.pool.query(
      `SELECT * FROM profiles WHERE username = $1`,
      [user.handle]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      did,
      handle: row.username,
      displayName: row.display_name,
      bio: row.bio,
      avatar: row.avatar_cid,
      banner: row.banner_cid,
      createdAt: row.created_at
    };
  }

  async createRecord(repo: string, collection: string, record: Record): Promise<{ uri: string; cid: string }> {
    // Generate URI and CID
    const uri = `at://${repo}/${collection}/${Date.now()}`;
    const cid = this.generateCID(record);

    await this.pool.query(
      `INSERT INTO pds_records (uri, repo, collection, record_data, cid, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [uri, repo, collection, JSON.stringify(record), cid]
    );

    return { uri, cid };
  }

  async getRecord(uri: string): Promise<Record | null> {
    const result = await this.pool.query(
      `SELECT * FROM pds_records WHERE uri = $1`,
      [uri]
    );

    if (result.rows.length === 0) return null;

    return JSON.parse(result.rows[0].record_data);
  }

  async listRecords(
    repo: string,
    collection: string,
    limit: number,
    cursor?: string
  ): Promise<{ records: Record[]; cursor?: string }> {
    let query = `SELECT * FROM pds_records
                 WHERE repo = $1 AND collection = $2
                 ORDER BY created_at DESC
                 LIMIT $3`;
    const params: any[] = [repo, collection, limit];

    if (cursor) {
      query += ` AND created_at < $4`;
      params.push(cursor);
    }

    const result = await this.pool.query(query, params);

    const records = result.rows.map((row: any) => JSON.parse(row.record_data));
    const newCursor = records.length > 0 ? result.rows[result.rows.length - 1].created_at : undefined;

    return { records, cursor: newCursor };
  }

  async createFollow(repo: string, follow: Follow): Promise<{ uri: string; cid: string }> {
    const uri = `at://${repo}/app.bsky.graph.follow/${Date.now()}`;
    const cid = this.generateCID(follow);

    await this.pool.query(
      `INSERT INTO pds_records (uri, repo, collection, record_data, cid, created_at)
       VALUES ($1, $2, 'app.bsky.graph.follow', $3, $4, NOW())`,
      [uri, repo, JSON.stringify(follow), cid]
    );

    // Also update follows table
    await this.pool.query(
      `INSERT INTO follows (follower_fid, following_fid, timestamp, active)
       VALUES ((SELECT fid FROM users WHERE address = $1),
               (SELECT fid FROM users WHERE address = $2),
               $3, true)
       ON CONFLICT (follower_fid, following_fid) DO UPDATE SET active = true`,
      [repo, follow.subject, Math.floor(Date.now() / 1000)]
    );

    return { uri, cid };
  }

  async getFollow(uri: string): Promise<Follow | null> {
    const result = await this.pool.query(
      `SELECT * FROM pds_records WHERE uri = $1 AND collection = 'app.bsky.graph.follow'`,
      [uri]
    );

    if (result.rows.length === 0) return null;

    return JSON.parse(result.rows[0].record_data);
  }

  async exportUserData(did: string): Promise<any> {
    const user = await this.getUserByDID(did);
    const profile = await this.getProfile(did);
    const records = await this.listRecords(did, 'app.bsky.feed.post', 1000);

    return {
      user,
      profile,
      records: records.records
    };
  }

  async markAccountMigrated(did: string, newPds: string): Promise<void> {
    await this.pool.query(
      `UPDATE pds_users SET migrated_to = $1, migrated_at = NOW() WHERE did = $2`,
      [newPds, did]
    );
  }

  async getLatestRecordTimestamp(): Promise<number> {
    const result = await this.pool.query(
      `SELECT MAX(created_at) as max_timestamp FROM pds_records`
    );

    return result.rows[0]?.max_timestamp?.getTime() || 0;
  }

  private generateCID(data: any): string {
    // In production, use IPFS to generate CID
    // For now, return a hash
    return `bafy${Buffer.from(JSON.stringify(data)).toString('base64').substring(0, 50)}`;
  }
}

