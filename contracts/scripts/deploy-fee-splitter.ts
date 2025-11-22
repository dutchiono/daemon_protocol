/**
 * @title Deploy FeeSplitter
 * @notice Deployment script for FeeSplitter (depends on BuilderRewardDistributor and DaemonFeeLocker)
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

    const builderRewardDistributor = deploymentInfo.contracts?.builderRewardDistributor?.address;
    const feeLocker = deploymentInfo.contracts?.feeLocker?.address;
    const socialNetworkFund = deploymentInfo.contracts?.socialNetworkFund?.address || process.env.SOCIAL_NETWORK_FUND_ADDRESS;

    if (!builderRewardDistributor) {
        throw new Error('BuilderRewardDistributor not found. Deploy it first.');
    }
    if (!feeLocker) {
        throw new Error('DaemonFeeLocker not found. Deploy it first.');
    }

    console.log('BuilderRewardDistributor:', builderRewardDistributor);
    console.log('Fee Locker:', feeLocker);
    if (socialNetworkFund) {
        console.log('Social Network Fund:', socialNetworkFund);
    } else {
        console.log('⚠️  Social Network Fund not found - deploying without it (can be set later)');
    }

    // Deploy FeeSplitter
    console.log('\nDeploying FeeSplitter...');
    const FeeSplitter = await ethers.getContractFactory('FeeSplitter');
    const feeSplitter = await FeeSplitter.deploy(
        builderRewardDistributor,
        feeLocker,
        socialNetworkFund || ethers.ZeroAddress, // Use zero address if not deployed yet
        deployer.address
    );
    await feeSplitter.waitForDeployment();
    const feeSplitterAddress = await feeSplitter.getAddress();

    const tx = await feeSplitter.deploymentTransaction();
    const receipt = await tx?.wait();

    console.log('FeeSplitter deployed to:', feeSplitterAddress);
    console.log('Transaction hash:', receipt?.hash);
    console.log('Block number:', receipt?.blockNumber);

    // Update deployment info
    if (!deploymentInfo.contracts) {
        deploymentInfo.contracts = {};
    }
    deploymentInfo.contracts.feeSplitter = {
        address: feeSplitterAddress,
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

