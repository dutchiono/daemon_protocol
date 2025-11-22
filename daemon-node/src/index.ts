#!/usr/bin/env node
/**
 * @title Daemon Social Network Node
 * @notice Unified node runner - runs Hub, PDS, and Gateway together
 */

// Polyfill for Node.js < 22 compatibility (must be first import)
import './polyfill.js';

// Load .env file from root directory
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root directory (two levels up from daemon-node/src)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { Command } from 'commander';
import { startHub } from './hub.js';
import { startPDS } from './pds.js';
import { startGateway } from './gateway.js';
import { startAll } from './all.js';

const program = new Command();

program
  .name('daemon-node')
  .description('Daemon Social Network Node Runner')
  .version('1.0.0');

program
  .command('hub')
  .description('Run Hub node (message relay with DHT)')
  .option('-p, --port <port>', 'Port number', '4001')
  .option('-d, --database <url>', 'Database URL', process.env.DATABASE_URL || '')
  .option('-r, --rpc <url>', 'RPC URL', process.env.RPC_URL || 'https://sepolia.base.org')
  .option('-b, --bootstrap <nodes>', 'Bootstrap nodes (comma-separated)', '')
  .action(async (options) => {
    await startHub({
      port: parseInt(options.port),
      databaseUrl: options.database,
      rpcUrl: options.rpc,
      bootstrapNodes: options.bootstrap ? options.bootstrap.split(',') : [],
    });
  });

program
  .command('pds')
  .description('Run PDS node (Personal Data Server)')
  .option('-p, --port <port>', 'Port number', '4002')
  .option('-d, --database <url>', 'Database URL', process.env.DATABASE_URL || '')
  .option('-f, --federation <peers>', 'Federation peers (comma-separated)', '')
  .action(async (options) => {
    await startPDS({
      port: parseInt(options.port),
      databaseUrl: options.database,
      federationPeers: options.federation ? options.federation.split(',') : [],
    });
  });

program
  .command('gateway')
  .description('Run Gateway node (API gateway)')
  .option('-p, --port <port>', 'Port number', '4003')
  .option('-d, --database <url>', 'Database URL', process.env.DATABASE_URL || '')
  .option('-h, --hubs <endpoints>', 'Hub endpoints (comma-separated)', 'http://localhost:4001')
  .option('-pds, --pds <endpoints>', 'PDS endpoints (comma-separated)', 'http://localhost:4002')
  .action(async (options) => {
    await startGateway({
      port: parseInt(options.port),
      databaseUrl: options.database,
      hubEndpoints: options.hubs.split(','),
      pdsEndpoints: options.pds.split(','),
    });
  });

program
  .command('all')
  .description('Run all nodes together (Hub + PDS + Gateway) - RECOMMENDED')
  .option('-d, --database <url>', 'Database URL', process.env.DATABASE_URL || '')
  .option('-r, --rpc <url>', 'RPC URL', process.env.RPC_URL || 'https://sepolia.base.org')
  .option('-b, --bootstrap <nodes>', 'Bootstrap nodes for DHT (comma-separated)', '')
  .action(async (options) => {
    await startAll({
      databaseUrl: options.database,
      rpcUrl: options.rpc,
      bootstrapNodes: options.bootstrap ? options.bootstrap.split(',') : [],
    });
  });

program.parse();
