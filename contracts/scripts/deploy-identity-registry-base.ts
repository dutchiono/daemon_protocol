/**
 * @title Deploy Identity Registry to Base Sepolia
 * @notice Full deployment script for Base testnet
 */

import * as dotenv from 'dotenv';
import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

// Load .env file from root directory
// Try multiple paths since __dirname might vary
const possiblePaths = [
  path.resolve(__dirname, '../../.env'),  // From contracts/scripts/
  path.resolve(process.cwd(), '.env'),     // From where command is run
  path.resolve(process.cwd(), '../.env'),  // One level up
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

// If still not loaded, try default
if (!loaded) {
  dotenv.config();
}

async function main() {
  // Base Sepolia Testnet
  const network = 'base-sepolia';
  const rpcUrl = process.env.RPC_URL || 'https://sepolia.base.org';
  // Check for PRIVATE_KEY or BOT_WALLET_PRIVATE_KEY (common name in this project)
  const privateKey = process.env.PRIVATE_KEY || process.env.BOT_WALLET_PRIVATE_KEY || '';

  if (!privateKey) {
    console.error(`\n❌ PRIVATE_KEY not found!`);
    console.error(`   Tried loading from: ${possiblePaths.join(', ')}`);
    console.error(`   Loaded from: ${loadedPath || 'none'}`);
    console.error(`   Available env vars: ${Object.keys(process.env).filter(k => k.includes('PRIVATE') || k.includes('KEY')).join(', ') || 'none'}`);
    throw new Error('PRIVATE_KEY or BOT_WALLET_PRIVATE_KEY environment variable required');
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
    return;
  }

  // Read compiled contract
  const artifactsPath = path.join(__dirname, '../artifacts/contracts/social/IdentityRegistry.sol/IdentityRegistry.json');

  if (!fs.existsSync(artifactsPath)) {
    console.log('\n⚠️  Contract artifacts not found. Compiling...');
    const { execSync } = require('child_process');
    try {
      execSync('npx hardhat compile', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
    } catch (error) {
      console.error('\n❌ Compilation failed!');
      return;
    }

    // Check again
    if (!fs.existsSync(artifactsPath)) {
      console.error('\n❌ Contract still not compiled after compilation attempt!');
      console.error(`   Expected artifact at: ${artifactsPath}`);
      return;
    }
  }

  const contractArtifact = JSON.parse(fs.readFileSync(artifactsPath, 'utf8'));
  const factory = new ethers.ContractFactory(
    contractArtifact.abi,
    contractArtifact.bytecode,
    wallet
  );

  console.log('\nDeploying IdentityRegistry...');
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`\n✅ Contract deployed!`);
  console.log(`Address: ${address}`);
  console.log(`Explorer: https://sepolia.basescan.org/address/${address}`);

  // Save to .env
  const envPath = path.join(__dirname, '../../.env');
  const envContent = `IDENTITY_REGISTRY_ADDRESS=${address}\nBASE_SEPOLIA_RPC_URL=${rpcUrl}\n`;

  if (fs.existsSync(envPath)) {
    fs.appendFileSync(envPath, envContent);
  } else {
    fs.writeFileSync(envPath, envContent);
  }

  console.log('\n📝 Saved to .env file');
  console.log('\nNext steps:');
  console.log('1. Update Hub config with IDENTITY_REGISTRY_ADDRESS');
  console.log('2. Update PDS config for wallet signup');
  console.log('3. Test FID registration');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

