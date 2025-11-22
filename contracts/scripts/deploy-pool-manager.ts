/**
 * @title Deploy Uniswap V4 PoolManager
 * @notice Deployment script for Uniswap V4 PoolManager (if needed on Base Sepolia)
 * @dev Uniswap V4 may already be deployed on Base Sepolia. Check first before deploying.
 */

import { ethers, upgrades } from 'hardhat';
import { Contract } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log('Deploying with account:', deployer.address);
    console.log('Account balance:', ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

    // Load previous deployment
    const deploymentFile = path.join(__dirname, '../deployments/base-sepolia.json');
    let deploymentInfo: any = {};
    if (fs.existsSync(deploymentFile)) {
        deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf-8'));
    }

    console.log('\n⚠️  Uniswap V4 PoolManager deployment');
    console.log('   IMPORTANT: Uniswap V4 PoolManager is a SINGLETON contract.');
    console.log('   - One PoolManager instance handles ALL pools on the network');
    console.log('   - Fey Protocol uses Uniswap\'s deployed PoolManager (they don\'t deploy their own)');
    console.log('   - Check Uniswap documentation for official PoolManager address on Base Sepolia');
    console.log('   - If available, use that address (set POOL_MANAGER_ADDRESS in .env)');
    console.log('   - Only deploy your own if Uniswap hasn\'t deployed one yet');
    console.log('   - Update daemon/docs/private/NETWORKS.md with the PoolManager address.');

    // Check if PoolManager is already in deployment info
    if (deploymentInfo.contracts?.poolManager?.address) {
        console.log('\n✅ PoolManager already deployed:');
        console.log('   Address:', deploymentInfo.contracts.poolManager.address);
        console.log('   Using existing deployment.');
        return;
    }

    // TODO: Deploy Uniswap V4 PoolManager
    // The PoolManager is from @uniswap/v4-core
    // You may need to:
    // 1. Import PoolManager from @uniswap/v4-core
    // 2. Deploy it (no constructor args typically)
    // 3. Save address to deployment info

    console.log('\n⚠️  PoolManager deployment not yet implemented.');
    console.log('   Options:');
    console.log('   1. Use existing Uniswap V4 PoolManager on Base Sepolia (recommended)');
    console.log('   2. Deploy your own PoolManager from @uniswap/v4-core');
    console.log('   3. Check Uniswap documentation for Base Sepolia deployment');

    // Uncomment and update once ready to deploy:
    /*
    console.log('\nDeploying Uniswap V4 PoolManager...');
    // Import PoolManager from @uniswap/v4-core
    // const PoolManager = await ethers.getContractFactory('PoolManager');
    // const poolManager = await PoolManager.deploy();
    // await poolManager.waitForDeployment();
    // const poolManagerAddress = await poolManager.getAddress();

    const tx = await poolManager.deploymentTransaction();
    const receipt = await tx?.wait();

    console.log('PoolManager deployed to:', poolManagerAddress);
    console.log('Transaction hash:', receipt?.hash);
    console.log('Block number:', receipt?.blockNumber);

    // Update deployment info
    if (!deploymentInfo.contracts) {
        deploymentInfo.contracts = {};
    }
    deploymentInfo.contracts.poolManager = {
        address: poolManagerAddress,
        txHash: receipt?.hash,
        blockNumber: receipt?.blockNumber,
    };

    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log('\nDeployment info updated in:', deploymentFile);
    */
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

