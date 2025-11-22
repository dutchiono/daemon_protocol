/**
 * @title Deploy DaemonPoolExtensionAllowlist
 * @notice Deployment script for DaemonPoolExtensionAllowlist (no dependencies)
 */

import { ethers, upgrades } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log('Deploying with account:', deployer.address);
    console.log('Account balance:', ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

    // Deploy DaemonPoolExtensionAllowlist
    console.log('\nDeploying DaemonPoolExtensionAllowlist...');
    const DaemonPoolExtensionAllowlist = await ethers.getContractFactory('DaemonPoolExtensionAllowlist');
    const allowlist = await upgrades.deployProxy(
        DaemonPoolExtensionAllowlist,
        [deployer.address],
        { kind: 'uups' }
    );
    await allowlist.waitForDeployment();
    const allowlistAddress = await allowlist.getAddress();

    const tx = await allowlist.deploymentTransaction();
    const receipt = await tx?.wait();

    console.log('DaemonPoolExtensionAllowlist deployed to:', allowlistAddress);
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
    deploymentInfo.contracts.poolExtensionAllowlist = {
        address: allowlistAddress,
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

