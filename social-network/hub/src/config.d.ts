/**
 * @title Config
 * @notice Configuration type for hub
 */
export interface Config {
    port: number;
    databaseUrl: string;
    nodeId: string;
    peers: string[];
    bootstrapNodes?: string[];
    rpcUrl: string;
    chainId: number;
    enableDHT?: boolean;
}
//# sourceMappingURL=config.d.ts.map