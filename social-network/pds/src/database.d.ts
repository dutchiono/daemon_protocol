/**
 * @title Database
 * @notice Database interface for PDS data storage
 */
import type { Profile, Record, Follow } from './types.js';
export declare class Database {
    private pool;
    constructor(connectionString: string);
    createUser(did: string, handle: string, email: string, password: string): Promise<void>;
    getUserByDID(did: string): Promise<any | null>;
    getUserByHandle(handle: string): Promise<any | null>;
    createProfile(did: string, handle: string): Promise<void>;
    getProfile(did: string): Promise<Profile | null>;
    createRecord(repo: string, collection: string, record: Record): Promise<{
        uri: string;
        cid: string;
    }>;
    getRecord(uri: string): Promise<Record | null>;
    listRecords(repo: string, collection: string, limit: number, cursor?: string): Promise<{
        records: Record[];
        cursor?: string;
    }>;
    createFollow(repo: string, follow: Follow): Promise<{
        uri: string;
        cid: string;
    }>;
    getFollow(uri: string): Promise<Follow | null>;
    exportUserData(did: string): Promise<any>;
    markAccountMigrated(did: string, newPds: string): Promise<void>;
    getLatestRecordTimestamp(): Promise<number>;
    private generateCID;
}
//# sourceMappingURL=database.d.ts.map