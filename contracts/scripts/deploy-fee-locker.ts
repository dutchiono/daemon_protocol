/**
 * @title Deploy DaemonFeeLocker
 * @notice Deployment script for DaemonFeeLocker (no dependencies, but needs vault/bootstrap)
 */

import { ethers, upgrades } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log('Deploying with account:', deployer.address);
    console.log('Account balance:', ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

    // Get vault and bootstrap addresses (can be deployer initially)
    const vault = process.env.VAULT_ADDRESS || deployer.address;
    const bootstrap = process.env.BOOTSTRAP_ADDRESS || deployer.address;
    console.log('Vault address:', vault);
    console.log('Bootstrap address:', bootstrap);

    // Deploy DaemonFeeLocker
    console.log('\nDeploying DaemonFeeLocker...');
    const DaemonFeeLocker = await ethers.getContractFactory('DaemonFeeLocker');
    const feeLocker = await upgrades.deployProxy(
        DaemonFeeLocker,
        [vault, bootstrap, deployer.address],
        { kind: 'uups' }
    );
    await feeLocker.waitForDeployment();
    const feeLockerAddress = await feeLocker.getAddress();

    const tx = await feeLocker.deploymentTransaction();
    const receipt = await tx?.wait();

    console.log('DaemonFeeLocker deployed to:', feeLockerAddress);
    console.log('Transaction hash:', receipt?.hash);
    console.log('Block number:', receipt?.blockNumber);

    // Save deployment info
    const deploymentFile = path.join(__dirname, '../deployments/base-sepolia.json');
    let deploymentInfo: any = {};
    if (fs.existsSync(deploymentFile)) {
        deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf-8'));
    }

    if (!deploymentInfo.contracts) {
        deploymentInfo.contracts = {};
    }
    deploymentInfo.contracts.feeLocker = {
        address: feeLockerAddress,
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

