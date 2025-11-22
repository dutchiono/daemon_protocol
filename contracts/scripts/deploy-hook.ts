/**
 * @title Deploy DaemonHook
 * @notice Deployment script for DaemonHook with UUPS proxy
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

    // Get addresses from environment or deployment info
    const poolManagerAddress = process.env.POOL_MANAGER_ADDRESS || process.env.TESTNET_POOL_MANAGER_ADDRESS;
    if (!poolManagerAddress) {
        throw new Error('POOL_MANAGER_ADDRESS or TESTNET_POOL_MANAGER_ADDRESS environment variable required');
    }

    // For bootstrap mode, baseToken can be 0x0 (will be set later)
    let baseTokenAddress = process.env.DAEMON_TOKEN_ADDRESS;
    if (!baseTokenAddress || baseTokenAddress === 'TBD' || baseTokenAddress === '') {
        baseTokenAddress = ethers.ZeroAddress; // Use 0x0 for bootstrap mode
    }

    const wethAddress = process.env.WETH_ADDRESS || '0x4200000000000000000000000000000000000006'; // Base Sepolia WETH
    const poolExtensionAllowlist = deploymentInfo.contracts?.poolExtensionAllowlist?.address;
    const builderRewardDistributor = deploymentInfo.contracts?.builderRewardDistributor?.address;
    const feeSplitter = deploymentInfo.contracts?.feeSplitter?.address;

    if (!poolExtensionAllowlist) {
        throw new Error('DaemonPoolExtensionAllowlist not found. Deploy it first.');
    }
    if (!builderRewardDistributor) {
        throw new Error('BuilderRewardDistributor not found. Deploy it first.');
    }
    if (!feeSplitter) {
        throw new Error('FeeSplitter not found. Deploy it first.');
    }

    console.log('Pool Manager:', poolManagerAddress);
    console.log('Base Token:', baseTokenAddress === ethers.ZeroAddress ? '0x0 (Bootstrap Mode)' : baseTokenAddress);
    console.log('WETH:', wethAddress);
    console.log('Pool Extension Allowlist:', poolExtensionAllowlist);
    console.log('Builder Reward Distributor:', builderRewardDistributor);
    console.log('Fee Splitter:', feeSplitter);

    // For bootstrap mode, factory address can be temporary (will be set after factory deployment)
    // But we need a factory address for initialize - use deployer address temporarily
    // Factory will be set properly after factory deployment
    const factoryAddress = process.env.FACTORY_ADDRESS || deployer.address; // Temporary for bootstrap

    console.log('Factory (temporary for bootstrap):', factoryAddress);

    // Deploy DaemonHook using upgrades plugin
    console.log('\nDeploying DaemonHook...');
    const DaemonHook = await ethers.getContractFactory('DaemonHook');
    const hook = await upgrades.deployProxy(
        DaemonHook,
        [
            poolManagerAddress,
            factoryAddress, // Factory address (can be temporary for bootstrap)
            baseTokenAddress, // Can be 0x0 for bootstrap mode
            wethAddress,
            poolExtensionAllowlist,
            builderRewardDistributor,
            feeSplitter,
            deployer.address, // owner
        ],
        { kind: 'uups' }
    ) as Contract;
    await hook.waitForDeployment();
    const hookAddress = await hook.getAddress();

    const tx = await hook.deploymentTransaction();
    const receipt = await tx?.wait();

    // Get implementation address
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(hookAddress);

    console.log('DaemonHook deployed to:', hookAddress);
    console.log('Implementation address:', implementationAddress);
    console.log('Transaction hash:', receipt?.hash);
    console.log('Block number:', receipt?.blockNumber);

    // Verify initialization
    const baseToken = await hook.baseToken();
    const owner = await hook.owner();

    console.log('\nVerification:');
    console.log('  Base Token:', baseToken);
    console.log('  Owner:', owner);

    // Update deployment info
    if (!deploymentInfo.contracts) {
        deploymentInfo.contracts = {};
    }
    deploymentInfo.contracts.hook = {
        address: hookAddress,
        implementation: implementationAddress,
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

