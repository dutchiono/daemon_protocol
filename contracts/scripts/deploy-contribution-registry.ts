/**
 * @title Deploy ContributionRegistry
 * @notice Deployment script for ContributionRegistry (no dependencies)
 */

import { ethers, upgrades } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log('Deploying with account:', deployer.address);
    console.log('Account balance:', ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

    // Deploy ContributionRegistry
    console.log('\nDeploying ContributionRegistry...');
    const ContributionRegistry = await ethers.getContractFactory('ContributionRegistry');
    const registry = await ContributionRegistry.deploy(deployer.address);
    await registry.waitForDeployment();
    const registryAddress = await registry.getAddress();

    const tx = await registry.deploymentTransaction();
    const receipt = await tx?.wait();
    
    console.log('ContributionRegistry deployed to:', registryAddress);
    console.log('Transaction hash:', receipt?.hash);
    console.log('Block number:', receipt?.blockNumber);

    // Save deployment info
    const deploymentInfo = {
        network: 'base-sepolia',
        chainId: 84532,
        deployedAt: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {
            contributionRegistry: {
                address: registryAddress,
                txHash: receipt?.hash,
                blockNumber: receipt?.blockNumber,
            },
        },
    };

    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentFile = path.join(deploymentsDir, 'base-sepolia.json');
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

    console.log('\nDeployment info saved to:', deploymentFile);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

