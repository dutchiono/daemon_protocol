/**
 * @title Config
 * @notice Configuration type for gateway
 */

export interface Config {
  port: number;
  gatewayId: string;
  hubEndpoints: string[];
  pdsEndpoints: string[];
  databaseUrl: string;
  redisUrl: string;
  x402ServiceUrl: string;
  rpcUrl?: string; // For StorageRegistry integration
}

