/**
 * @title Config
 * @notice Configuration type for PDS
 */

export interface Config {
  port: number;
  databaseUrl: string;
  pdsId: string;
  federationPeers: string[];
  ipfsGateway: string;
  rpcUrl?: string; // Optional for wallet signup
}

