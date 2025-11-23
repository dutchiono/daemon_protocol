/**
 * @title PDS Service
 * @notice Core Personal Data Server service
 */

import { ethers } from 'ethers';
import IdRegistryABI from '../../../contracts/artifacts/contracts/IdRegistry.sol/IdRegistry.json' with { type: 'json' };
import { logger } from './logger.js';
import type { Config } from './config.js';
import { Database } from './database.js';
import { ReplicationEngine } from './replication-engine.js';
import type { Follow, Profile, Record } from './types.js';

export class PDSService {
  private db: Database;
  private replicationEngine: ReplicationEngine;
  private config: Config;
  private idRegistry: ethers.Contract | null = null;
  private provider: ethers.JsonRpcProvider;

  constructor(
    db: Database,
    replicationEngine: ReplicationEngine,
    config: Config
  ) {
    this.db = db;
    this.replicationEngine = replicationEngine;
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);

    // Initialize IdRegistry contract if address is provided
    if (process.env.ID_REGISTRY_ADDRESS) {
      this.idRegistry = new ethers.Contract(
        process.env.ID_REGISTRY_ADDRESS,
        IdRegistryABI.abi,
        this.provider
      );
      logger.info(`IdRegistry contract initialized at ${process.env.ID_REGISTRY_ADDRESS}`);
    } else {
      logger.warn('ID_REGISTRY_ADDRESS not set. Wallet signup will be disabled.');
    }
  }

  async start(): Promise<void> {
    // Start replication engine
    await this.replicationEngine.start();

    console.log('PDS service started');
  }

  async stop(): Promise<void> {
    await this.replicationEngine.stop();
    console.log('PDS service stopped');
  }

  async createAccount(
    handle: string,
    email: string,
    password: string,
    inviteCode?: string
  ): Promise<{ did: string; handle: string }> {
    // Validate handle
    if (!this.isValidHandle(handle)) {
      throw new Error('Invalid handle');
    }

    // Check if handle is available
    const existing = await this.db.getUserByHandle(handle);
    if (existing) {
      throw new Error('Handle already taken');
    }

    // Generate DID (Decentralized Identifier)
    const did = this.generateDID(handle);

    // Create user account
    await this.db.createUser(did, handle, email, password);

    // Create default profile
    await this.db.createProfile(did, handle);

    // Replicate to federation
    await this.replicationEngine.replicateUser(did);

    return { did, handle };
  }

  /**
   * @notice Create account using wallet (requires FID from IdRegistry)
   * @param walletAddress The wallet address
   * @param handle Optional handle (if not provided, will use FID)
   * @returns Account info with FID
   */
  async createAccountWithWallet(
    walletAddress: string,
    handle?: string
  ): Promise<{ fid: number; did: string; handle: string }> {
    if (!this.idRegistry) {
      throw new Error('IdRegistry not configured. Wallet signup unavailable.');
    }

    try {
      // Get FID from IdRegistry
      const fid = await this.idRegistry.fidOf(walletAddress);
      if (fid === 0n) {
        throw new Error('FID not registered. Please register FID first using IdRegistry.register()');
      }

      // Use handle if provided, otherwise use FID-based handle
      const finalHandle = handle || `fid-${fid.toString()}`;

      // Check if handle is available (if custom handle provided)
      if (handle) {
        if (!this.isValidHandle(handle)) {
          throw new Error('Invalid handle');
        }
        const existing = await this.db.getUserByHandle(handle);
        if (existing) {
          throw new Error('Handle already taken');
        }
      }

      // Generate DID from FID
      const did = `did:daemon:${fid.toString()}`;

      // Create user account (no email/password for wallet signup)
      await this.db.createUser(did, finalHandle, '', ''); // Empty email/password for wallet accounts

      // Create default profile
      await this.db.createProfile(did, finalHandle);

      // Link FID to account in database (if you have a fid column)
      // await this.db.linkFidToAccount(did, Number(fid));

      // Replicate to federation
      await this.replicationEngine.replicateUser(did);

      logger.info(`Wallet account created: ${walletAddress} -> FID ${fid}`);

      return { fid: Number(fid), did, handle: finalHandle };
    } catch (error) {
      logger.error(`Error creating wallet account: ${error}`);
      throw error;
    }
  }

  async getProfile(did: string): Promise<Profile | null> {
    return await this.db.getProfile(did);
  }

  async createRecord(
    repo: string,
    collection: string,
    record: Record
  ): Promise<{ uri: string; cid: string }> {
    // Validate user owns this repo
    const user = await this.db.getUserByDID(repo);
    if (!user) {
      throw new Error('User not found');
    }

    // Create record
    const result = await this.db.createRecord(repo, collection, record);

    // Replicate to federation
    await this.replicationEngine.replicateRecord(repo, collection, result.uri);

    return result;
  }

  async listRecords(
    repo: string,
    collection: string,
    limit: number,
    cursor?: string
  ): Promise<{ records: Record[]; cursor?: string }> {
    return await this.db.listRecords(repo, collection, limit, cursor);
  }

  async createFollow(repo: string, follow: Follow): Promise<{ uri: string; cid: string }> {
    // Create follow record
    const result = await this.db.createFollow(repo, follow);

    // Replicate to federation
    await this.replicationEngine.replicateFollow(repo, result.uri);

    return result;
  }

  async migrateAccount(did: string, newPds: string): Promise<{ success: boolean }> {
    // Export all user data
    const userData = await this.db.exportUserData(did);

    // Notify federation of migration
    await this.replicationEngine.notifyMigration(did, newPds);

    // Mark account as migrated
    await this.db.markAccountMigrated(did, newPds);

    return { success: true };
  }

  getPdsId(): string {
    return this.config.pdsId;
  }

  private isValidHandle(handle: string): boolean {
    // Handle validation (alphanumeric, dots, hyphens, 3-63 chars)
    return /^[a-z0-9]([a-z0-9-.]*[a-z0-9])?$/.test(handle) && handle.length >= 3 && handle.length <= 63;
  }

  private generateDID(handle: string): string {
    // Generate DID: did:at:handle or did:daemon:handle
    return `did:daemon:${handle}`;
  }
}

