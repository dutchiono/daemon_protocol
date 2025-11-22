/**
 * @title Deploy daemonETH Token
 * @notice Deploy test ETH token named "daemonETH" for TGE simulation on testnet
 * @dev This token represents ETH for testing TGE without needing real ETH
 */

import { ethers } from 'hardhat';
import { Contract } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    const signers = await ethers.getSigners();
    if (signers.length === 0) {
        throw new Error('No signers available. Make sure BOT_WALLET_PRIVATE_KEY is set in .env file.');
    }
    const deployer = signers[0];
    console.log('Deploying with account:', deployer.address);
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log('Account balance:', ethers.formatEther(balance), 'ETH');

    // Load deployment info
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

    // Check if already deployed
    if (deploymentInfo.contracts && deploymentInfo.contracts.daemonETHToken && deploymentInfo.contracts.daemonETHToken.address) {
        console.log('\n⚠️  daemonETH token already deployed!');
        console.log('  Address:', deploymentInfo.contracts.daemonETHToken.address);
        console.log('  Skipping deployment...');
        return;
    }

    // Deploy TestETHToken (named "daemonETH")
    console.log('\nDeploying daemonETH token...');
    const TestETHToken = await ethers.getContractFactory('TestETHToken');
    const daemonETH = await TestETHToken.deploy();
    await daemonETH.waitForDeployment();
    const daemonETHAddress = await daemonETH.getAddress();

    const tx = await daemonETH.deploymentTransaction();
    const receipt = await tx?.wait();

    console.log('✅ daemonETH token deployed:', daemonETHAddress);
    console.log('  Name: daemonETH');
    console.log('  Symbol: dETH');
    console.log('  Transaction:', receipt?.hash);
    console.log('  Block:', receipt?.blockNumber);

    // Wait for transaction to be confirmed before checking balance
    await receipt.wait();

    // Check initial balance (should be 1000 from constructor)
    const deployerBalance = await daemonETH.balanceOf(deployer.address);
    console.log('  Deployer balance:', ethers.formatEther(deployerBalance), 'dETH');

    // Mint additional tokens if needed (constructor already mints 1000)
    if (deployerBalance < ethers.parseEther('1000')) {
        console.log('\nMinting additional tokens to reach 1000 dETH...');
        const mintAmount = ethers.parseEther('1000') - deployerBalance;
        const mintTx = await daemonETH.mint(deployer.address, mintAmount);
        await mintTx.wait();
        console.log('  ✅ Minted', ethers.formatEther(mintAmount), 'dETH to deployer');
    }

    const finalBalance = await daemonETH.balanceOf(deployer.address);
    console.log('  Final deployer balance:', ethers.formatEther(finalBalance), 'dETH');

    // Save to deployment info
    if (!deploymentInfo.contracts) {
        deploymentInfo.contracts = {};
    }
    deploymentInfo.contracts.daemonETHToken = {
        address: daemonETHAddress,
        name: 'daemonETH',
        symbol: 'dETH',
        txHash: receipt?.hash,
        blockNumber: receipt?.blockNumber,
        deployer: deployer.address,
        deployerBalance: finalBalance.toString(),
        timestamp: new Date().toISOString(),
    };

    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log('\n✅ Deployment info saved to:', deploymentFile);

    // Output for .env file
    console.log('\n📝 Add to your .env file:');
    console.log(`DAEMON_ETH_TOKEN_ADDRESS=${daemonETHAddress}`);
    console.log('\n📝 Update documentation:');
    console.log('  - daemon/ENV_SETUP.md');
    console.log('  - daemon/docs/private/DEPLOYMENT_TRACKING.md');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

