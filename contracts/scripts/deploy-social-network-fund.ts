/**
 * @title Deploy SocialNetworkFund
 * @notice Deployment script for SocialNetworkFund contract
 */

import { ethers, upgrades } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log('Deploying with account:', deployer.address);
    console.log('Account balance:', ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

    // Load existing deployment info
    const deploymentFile = path.join(__dirname, '../deployments/base-sepolia.json');
    let deploymentInfo: any = {};
    if (fs.existsSync(deploymentFile)) {
        try {
            deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf-8'));
        } catch (error) {
            console.log('⚠️  Could not parse deployment file, creating new one...');
            deploymentInfo = {};
        }
    }

    // Get DAEMON token address (required for initialization)
    const daemonTokenAddress = process.env.DAEMON_TOKEN_ADDRESS || deploymentInfo.contracts?.daemonToken?.address;
    if (!daemonTokenAddress) {
        throw new Error('DAEMON_TOKEN_ADDRESS not set in environment or deployment file');
    }

    console.log('\nDeploying SocialNetworkFund...');
    console.log('  DAEMON Token:', daemonTokenAddress);

    // Deploy SocialNetworkFund as upgradeable proxy
    const SocialNetworkFund = await ethers.getContractFactory('SocialNetworkFund');
    const socialNetworkFund = await upgrades.deployProxy(
        SocialNetworkFund,
        [daemonTokenAddress, deployer.address],
        { initializer: 'initialize' }
    );
    await socialNetworkFund.waitForDeployment();
    const socialNetworkFundAddress = await socialNetworkFund.getAddress();

    const tx = await socialNetworkFund.deploymentTransaction();
    const receipt = await tx?.wait();

    console.log('\n✅ SocialNetworkFund deployed:');
    console.log('  Proxy Address:', socialNetworkFundAddress);
    console.log('  Transaction:', receipt?.hash);
    console.log('  Block:', receipt?.blockNumber);

    // Save to deployment info
    if (!deploymentInfo.contracts) {
        deploymentInfo.contracts = {};
    }
    deploymentInfo.contracts.socialNetworkFund = {
        address: socialNetworkFundAddress,
        txHash: receipt?.hash,
        blockNumber: receipt?.blockNumber,
    };

    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log('\nDeployment info saved to:', deploymentFile);

    console.log('\n📝 Next steps:');
    console.log('  1. Update FeeSplitter to include socialNetworkFund (if not already done)');
    console.log('  2. Update DaemonHook to set socialNetworkFund address');
    console.log('  3. Register operators in SocialNetworkFund');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

