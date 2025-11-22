/**
 * @title Config
 * @notice Configuration type for hub
 */

export interface Config {
  port: number;
  databaseUrl: string;
  nodeId: string;
  peers: string[]; // Manual peer list (federated mode - legacy)
  bootstrapNodes?: string[]; // Bootstrap nodes for DHT (decentralized mode)
  rpcUrl: string;
  chainId: number;
  enableDHT?: boolean; // Enable/disable DHT
}

