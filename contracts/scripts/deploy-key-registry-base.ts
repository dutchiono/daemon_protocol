/**
 * @title Deploy KeyRegistry to Base Sepolia
 * @notice Deployment script for KeyRegistry contract (requires IdRegistry address)
 */

import * as dotenv from 'dotenv';
import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Load .env file
const possiblePaths = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env'),
];

let loadedPath = '';
let loaded = false;
for (const envPath of possiblePaths) {
  if (fs.existsSync(envPath)) {
    const result = dotenv.config({ path: envPath });
    if (!result.error) {
      loaded = true;
      loadedPath = envPath;
      break;
    }
  }
}

if (!loaded) {
  dotenv.config();
}

async function main() {
  const network = 'base-sepolia';
  const rpcUrl = process.env.RPC_URL || 'https://sepolia.base.org';
  const privateKey = process.env.PRIVATE_KEY || process.env.BOT_WALLET_PRIVATE_KEY || '';
  const idRegistryAddress = process.env.ID_REGISTRY_ADDRESS || '';

  if (!privateKey) {
    console.error(`\n❌ PRIVATE_KEY not found!`);
    throw new Error('PRIVATE_KEY or BOT_WALLET_PRIVATE_KEY environment variable required');
  }

  if (!idRegistryAddress) {
    console.error(`\n❌ ID_REGISTRY_ADDRESS not found!`);
    console.error(`   Please deploy IdRegistry first using: npx hardhat run scripts/deploy-id-registry-base.ts --network base-sepolia`);
    throw new Error('ID_REGISTRY_ADDRESS environment variable required');
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log('========================================');
  console.log('Deploying KeyRegistry to Base Sepolia');
  console.log('========================================');
  console.log(`Network: ${network}`);
  console.log(`RPC URL: ${rpcUrl}`);
  console.log(`Deployer: ${wallet.address}`);
  console.log(`IdRegistry: ${idRegistryAddress}`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    console.warn('\n⚠️  WARNING: Wallet has no ETH!');
    return;
  }

  // Read compiled contract
  const artifactsPath = path.join(__dirname, '../artifacts/contracts/KeyRegistry.sol/KeyRegistry.json');

  if (!fs.existsSync(artifactsPath)) {
    console.warn('\n⚠️  Contract artifacts not found. Compiling...');
    try {
      execSync('npx hardhat compile', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    } catch (compileError) {
      console.error('❌ Hardhat compile failed:', compileError);
      return;
    }
  }

  const contractArtifact = JSON.parse(fs.readFileSync(artifactsPath, 'utf8'));
  const factory = new ethers.ContractFactory(
    contractArtifact.abi,
    contractArtifact.bytecode,
    wallet
  );

  console.log('\nDeploying KeyRegistry...');
  const contract = await factory.deploy(idRegistryAddress);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`\n✅ Contract deployed!`);
  console.log(`Address: ${address}`);
  console.log(`Explorer: https://sepolia.basescan.org/address/${address}`);

  // Save to .env
  const rootEnvPath = path.resolve(__dirname, '../../.env');
  let envContent = '';
  if (fs.existsSync(rootEnvPath)) {
    envContent = fs.readFileSync(rootEnvPath, 'utf8');
  }

  const newEnvVar = `KEY_REGISTRY_ADDRESS=${address}`;
  if (envContent.includes('KEY_REGISTRY_ADDRESS')) {
    envContent = envContent.replace(/KEY_REGISTRY_ADDRESS=.*/, newEnvVar);
  } else {
    envContent += `\n${newEnvVar}`;
  }

  fs.writeFileSync(rootEnvPath, envContent);
  console.log(`\nContract address saved to ${rootEnvPath}`);
}

main().catch(console.error);

