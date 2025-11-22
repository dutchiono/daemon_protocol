/**
 * @title Sync Engine
 * @notice Handles synchronization with other hubs
 */
import type { Libp2p } from 'libp2p';
import { Database } from './database.js';
import type { Config } from './config.js';
export declare class SyncEngine {
    private node;
    private db;
    private config;
    private syncInterval?;
    private lastSyncTimestamp;
    constructor(node: Libp2p, db: Database, config: Config);
    start(): Promise<void>;
    stop(): Promise<void>;
    private syncWithPeers;
    private syncWithPeer;
    getStatus(): Promise<{
        lastSyncTimestamp: number;
    }>;
}
//# sourceMappingURL=sync-engine.d.ts.map