/**
 * @title Deploy DaemonLpLocker
 * @notice Deployment script for DaemonLpLocker (depends on DaemonFeeLocker)
 */

import { ethers, upgrades } from 'hardhat';
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

    const feeLocker = deploymentInfo.contracts?.feeLocker?.address;
    if (!feeLocker) {
        throw new Error('DaemonFeeLocker not found. Deploy it first.');
    }

    // Get addresses (can be zero initially, will be set later)
    const factory = ethers.ZeroAddress; // Will be set after factory deployment
    const positionManager = process.env.POSITION_MANAGER_ADDRESS || ethers.ZeroAddress;
    const permit2 = process.env.PERMIT2_ADDRESS || ethers.ZeroAddress;

    console.log('Fee Locker:', feeLocker);
    console.log('Factory (will be set later):', factory);
    console.log('Position Manager:', positionManager);
    console.log('Permit2:', permit2);

    // Deploy DaemonLpLocker
    console.log('\nDeploying DaemonLpLocker...');
    const DaemonLpLocker = await ethers.getContractFactory('DaemonLpLocker');
    const lpLocker = await upgrades.deployProxy(
        DaemonLpLocker,
        [factory, feeLocker, positionManager, permit2, deployer.address],
        { kind: 'uups' }
    );
    await lpLocker.waitForDeployment();
    const lpLockerAddress = await lpLocker.getAddress();

    const tx = await lpLocker.deploymentTransaction();
    const receipt = await tx?.wait();

    console.log('DaemonLpLocker deployed to:', lpLockerAddress);
    console.log('Transaction hash:', receipt?.hash);
    console.log('Block number:', receipt?.blockNumber);

    // Update deployment info
    if (!deploymentInfo.contracts) {
        deploymentInfo.contracts = {};
    }
    deploymentInfo.contracts.lpLocker = {
        address: lpLockerAddress,
        txHash: receipt?.hash,
        blockNumber: receipt?.blockNumber,
    };

    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log('\nDeployment info updated in:', deploymentFile);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

