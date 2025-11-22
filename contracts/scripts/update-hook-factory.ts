/**
 * @title Update Hook Factory Address
 * @notice Updates the hook's factory address after factory deployment
 */

import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log('Updating with account:', deployer.address);

    // Load deployment info
    const deploymentFile = path.join(__dirname, '../deployments/base-sepolia.json');
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf-8'));

    const hookAddress = deploymentInfo.contracts?.hook?.address;
    const factoryAddress = deploymentInfo.contracts?.factory?.address;

    if (!hookAddress) {
        throw new Error('Hook address not found');
    }
    if (!factoryAddress) {
        throw new Error('Factory address not found');
    }

    console.log('Hook:', hookAddress);
    console.log('Factory:', factoryAddress);

    // Update hook's factory address
    const DaemonHook = await ethers.getContractFactory('DaemonHook');
    const hook = DaemonHook.attach(hookAddress);

    console.log('\nUpdating hook factory address...');
    const tx = await hook.setFactory(factoryAddress);
    await tx.wait();

    console.log('Hook factory address updated');
    console.log('Transaction hash:', tx.hash);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

