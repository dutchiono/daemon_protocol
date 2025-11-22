/**
 * @title Deploy BuilderRewardDistributor
 * @notice Deployment script for BuilderRewardDistributor (depends on ContributionRegistry)
 */

import { ethers } from 'hardhat';
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

    const contributionRegistry = deploymentInfo.contracts?.contributionRegistry?.address;
    if (!contributionRegistry) {
        throw new Error('ContributionRegistry not found. Deploy it first.');
    }

    // Get reward token address (WETH on Base Sepolia)
    const rewardToken = process.env.WETH_ADDRESS || '0x4200000000000000000000000000000000000006';
    console.log('Using reward token (WETH):', rewardToken);

    // Deploy BuilderRewardDistributor
    console.log('\nDeploying BuilderRewardDistributor...');
    const BuilderRewardDistributor = await ethers.getContractFactory('BuilderRewardDistributor');
    const distributor = await BuilderRewardDistributor.deploy(
        contributionRegistry,
        rewardToken,
        deployer.address
    );
    await distributor.waitForDeployment();
    const distributorAddress = await distributor.getAddress();

    const tx = await distributor.deploymentTransaction();
    const receipt = await tx?.wait();

    console.log('BuilderRewardDistributor deployed to:', distributorAddress);
    console.log('Transaction hash:', receipt?.hash);
    console.log('Block number:', receipt?.blockNumber);

    // Update deployment info
    if (!deploymentInfo.contracts) {
        deploymentInfo.contracts = {};
    }
    deploymentInfo.contracts.builderRewardDistributor = {
        address: distributorAddress,
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

