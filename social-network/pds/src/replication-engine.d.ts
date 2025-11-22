/**
 * @title Replication Engine
 * @notice Handles data replication across PDS federation
 */
import { Database } from './database.js';
import type { Config } from './config.js';
export declare class ReplicationEngine {
    private db;
    private config;
    private replicationInterval?;
    constructor(db: Database, config: Config);
    start(): Promise<void>;
    stop(): Promise<void>;
    private syncWithFederation;
    private syncWithPeer;
    replicateUser(did: string): Promise<void>;
    replicateRecord(repo: string, collection: string, uri: string): Promise<void>;
    replicateFollow(repo: string, uri: string): Promise<void>;
    notifyMigration(did: string, newPds: string): Promise<void>;
    private sendToPeer;
}
//# sourceMappingURL=replication-engine.d.ts.map