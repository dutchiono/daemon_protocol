/**
 * @title PDS Service
 * @notice Core Personal Data Server service
 */
import type { Config } from './config.js';
import { Database } from './database.js';
import { ReplicationEngine } from './replication-engine.js';
import type { Follow, Profile, Record } from './types.js';
export declare class PDSService {
    private db;
    private replicationEngine;
    private config;
    private idRegistry;
    private provider;
    constructor(db: Database, replicationEngine: ReplicationEngine, config: Config);
    start(): Promise<void>;
    stop(): Promise<void>;
    createAccount(handle: string, email: string, password: string, inviteCode?: string): Promise<{
        did: string;
        handle: string;
    }>;
    /**
     * @notice Create account using wallet (requires FID from IdRegistry)
     * @param walletAddress The wallet address
     * @param handle Optional handle (if not provided, will use FID)
     * @returns Account info with FID
     */
    createAccountWithWallet(walletAddress: string, handle?: string): Promise<{
        fid: number;
        did: string;
        handle: string;
    }>;
    getProfile(did: string): Promise<Profile | null>;
    createRecord(repo: string, collection: string, record: Record): Promise<{
        uri: string;
        cid: string;
    }>;
    listRecords(repo: string, collection: string, limit: number, cursor?: string): Promise<{
        records: Record[];
        cursor?: string;
    }>;
    createFollow(repo: string, follow: Follow): Promise<{
        uri: string;
        cid: string;
    }>;
    migrateAccount(did: string, newPds: string): Promise<{
        success: boolean;
    }>;
    getPdsId(): string;
    private isValidHandle;
    private generateDID;
}
//# sourceMappingURL=pds-service.d.ts.map