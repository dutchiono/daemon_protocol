import '@nomicfoundation/hardhat-toolbox';
import * as dotenv from 'dotenv';
import { HardhatUserConfig } from 'hardhat/config';
import * as path from 'path';

// Load .env from root directory (one level up)
dotenv.config({ path: path.join(__dirname, '../.env') });

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.28',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true, // Fix "stack too deep" errors
        },
      },
      {
        version: '0.8.24',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
      {
        version: '0.8.22',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
      {
        version: '0.8.21',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
      {
        version: '0.8.20',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true, // Fix "stack too deep" errors
        },
      },
    ],
  },
  paths: {
    sources: './contracts', // All contracts now in contracts/contracts/ subdirectory
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
  networks: {
    'base-sepolia': {
      url: process.env.RPC_URL || 'https://sepolia.base.org',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 84532,
    },
    'base-mainnet': {
      url: process.env.MAINNET_RPC_URL || 'https://mainnet.base.org',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 8453,
    },
  },
  etherscan: {
    apiKey: {
      'base-sepolia': process.env.BASESCAN_API_KEY || '',
      'base-mainnet': process.env.BASESCAN_API_KEY || '',
    },
    customChains: [
      {
        network: 'base-sepolia',
        chainId: 84532,
        urls: {
          apiURL: 'https://api-sepolia.basescan.org/api',
          browserURL: 'https://sepolia.basescan.org',
        },
      },
    ],
  },
};

export default config;

