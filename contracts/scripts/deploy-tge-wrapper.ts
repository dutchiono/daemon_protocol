/**
 * @title Deploy TGE Wrapper
 * @notice Deploy wrapper contract that allows TGE contributions using test ETH token
 * @dev This enables testing TGE on testnet without needing real ETH
 */

import { ethers } from 'hardhat';
import { Contract } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log('Deploying with account:', deployer.address);

    // Load deployment info
    const deploymentFile = path.join(__dirname, '../deployments/base-sepolia.json');
    let deploymentInfo: any = {};
    if (fs.existsSync(deploymentFile)) {
        deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf-8'));
    }

    const factoryAddress = deploymentInfo.contracts?.factory?.address;
    if (!factoryAddress) {
        throw new Error('Factory not deployed. Deploy factory first.');
    }

    // Check if daemonETH token already deployed
    const daemonETHAddress = deploymentInfo.contracts?.daemonETHToken?.address;
    let testETHAddress: string;

    if (daemonETHAddress) {
        console.log('\n✅ Using existing daemonETH token:', daemonETHAddress);
        testETHAddress = daemonETHAddress;
    } else {
        // Deploy TestETHToken (daemonETH) first
        console.log('\nDeploying daemonETH token...');
        const TestETHToken = await ethers.getContractFactory('TestETHToken');
        const testETH = await TestETHToken.deploy();
        await testETH.waitForDeployment();
        testETHAddress = await testETH.getAddress();

        console.log('✅ daemonETH token deployed:', testETHAddress);

        // Save to deployment info
        if (!deploymentInfo.contracts) {
            deploymentInfo.contracts = {};
        }
        deploymentInfo.contracts.daemonETHToken = {
            address: testETHAddress,
            txHash: await testETH.deploymentTransaction()?.hash,
            blockNumber: (await testETH.deploymentTransaction()?.wait())?.blockNumber,
        };
    }

    // Deploy TGEWrapper
    console.log('\nDeploying TGEWrapper...');
    const TGEWrapper = await ethers.getContractFactory('TGEWrapper');
    const wrapper = await TGEWrapper.deploy(factoryAddress, testETHAddress);
    await wrapper.waitForDeployment();
    const wrapperAddress = await wrapper.getAddress();

    const tx = await wrapper.deploymentTransaction();
    const receipt = await tx?.wait();

    console.log('✅ TGEWrapper deployed:', wrapperAddress);
    console.log('  Factory:', factoryAddress);
    console.log('  daemonETH Token:', testETHAddress);
    console.log('  Transaction:', receipt?.hash);

    // Save wrapper to deployment info
    if (!deploymentInfo.contracts) {
        deploymentInfo.contracts = {};
    }
    deploymentInfo.contracts.tgeWrapper = {
        address: wrapperAddress,
        txHash: receipt?.hash,
        blockNumber: receipt?.blockNumber,
    };

    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log('\nDeployment info saved');

    console.log('\n📝 Next Steps:');
    console.log('  1. Fund TGEWrapper with ETH (for testnet, use faucet)');
    console.log('  2. Mint TestETHToken to test contributors');
    console.log('  3. Contributors approve TGEWrapper to spend TestETHToken');
    console.log('  4. Contributors call wrapper.contributeToTGEWithToken()');
    console.log('  5. Wrapper converts test token to ETH and contributes to factory');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

