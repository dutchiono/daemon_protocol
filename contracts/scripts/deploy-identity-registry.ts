/**
 * @title Deploy Identity Registry
 * @notice Deploy to Optimism (or Base for testing)
 */

import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  // Base Sepolia Testnet Configuration
  const network = 'base-sepolia';
  const rpcUrl = process.env.RPC_URL || 'https://sepolia.base.org';
  const privateKey = process.env.PRIVATE_KEY || '';

  if (!privateKey) {
    throw new Error('PRIVATE_KEY environment variable required');
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log('========================================');
  console.log('Deploying Identity Registry to Base Sepolia');
  console.log('========================================');
  console.log(`Network: ${network}`);
  console.log(`RPC URL: ${rpcUrl}`);
  console.log(`Deployer: ${wallet.address}`);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    console.warn('\n⚠️  WARNING: Wallet has no ETH!');
    console.warn('Get testnet ETH from: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet');
  }

  // Deploy contract
  console.log('\nDeploying IdentityRegistry contract...');

  // In production, you would:
  // 1. Compile contract first: npx hardhat compile
  // 2. Get ABI and bytecode from artifacts
  // 3. Deploy using ethers.ContractFactory

  // For now, this is a template - you'll need to compile first
  console.log('\n✅ Deployment script ready');
  console.log('\n📋 Steps to deploy:');
  console.log('1. Compile contract: npx hardhat compile');
  console.log('2. Run: npx hardhat run scripts/deploy-identity-registry.ts --network base-sepolia');
  console.log('3. Save deployed address to .env:');
  console.log('   IDENTITY_REGISTRY_ADDRESS=0x...');
  console.log('\n🔗 Base Sepolia Explorer: https://sepolia.basescan.org');
}

main().catch(console.error);

