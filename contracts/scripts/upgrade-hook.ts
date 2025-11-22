/**
 * @title Upgrade DaemonHook
 * @notice Upgrades the hook implementation to ensure setFactory is available
 */

import { ethers, upgrades } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log('Upgrading with account:', deployer.address);

    // Load deployment info
    const deploymentFile = path.join(__dirname, '../deployments/base-sepolia.json');
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf-8'));

    const hookAddress = deploymentInfo.contracts?.hook?.address;
    if (!hookAddress) {
        throw new Error('Hook address not found');
    }

    console.log('Hook:', hookAddress);

    // Upgrade hook
    console.log('\nUpgrading DaemonHook...');
    const DaemonHook = await ethers.getContractFactory('DaemonHook');
    const hook = await upgrades.upgradeProxy(hookAddress, DaemonHook);
    await hook.waitForDeployment();

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(hookAddress);
    console.log('Hook upgraded');
    console.log('New implementation:', implementationAddress);

    // Update deployment info
    if (deploymentInfo.contracts.hook) {
        deploymentInfo.contracts.hook.implementation = implementationAddress;
    }
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log('Deployment info updated');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
