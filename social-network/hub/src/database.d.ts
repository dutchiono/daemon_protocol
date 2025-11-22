/**
 * @title Database
 * @notice Database interface for hub message storage
 */
import type { Message } from './types.js';
export declare class Database {
    private pool;
    constructor(connectionString: string);
    storeMessage(message: Message): Promise<void>;
    getMessage(hash: string): Promise<Message | null>;
    getMessagesByFid(fid: number, limit: number, offset: number): Promise<Message[]>;
    getLatestMessageTimestamp(): Promise<number>;
    getMessageCount(): Promise<number>;
}
//# sourceMappingURL=database.d.ts.map