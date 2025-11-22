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
export declare class HubService {
    private node;
    private db;
    private validator;
    private syncEngine;
    private config;
    private messageCache;
    constructor(node: Libp2p, db: Database, validator: MessageValidator, syncEngine: SyncEngine, config: Config);
    start(): Promise<void>;
    stop(): Promise<void>;
    private connectToPeers;
    private setupMessageHandlers;
    submitMessage(message: Message): Promise<MessageResult>;
    getMessage(hash: string): Promise<Message | null>;
    getMessagesByFid(fid: number, limit: number, offset: number): Promise<Message[]>;
    private handleIncomingMessage;
    private propagateMessage;
    getSyncStatus(): Promise<{
        lastSyncTimestamp: number;
        peerCount: number;
        messageCount: number;
    }>;
    getPeers(): string[];
    getNodeId(): string;
}
//# sourceMappingURL=hub-service.d.ts.map