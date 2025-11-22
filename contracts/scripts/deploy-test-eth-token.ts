/**
 * @title Deploy Test ETH Token
 * @notice Deploy a test token that can be used instead of native ETH for TGE testing
 * @dev This is a workaround for testnet - allows testing TGE without needing real ETH
 *
 * NOTE: This requires modifying DaemonFactory to accept ERC20 tokens for TGE
 * OR creating a wrapper contract that converts ERC20 to ETH
 */

import { ethers } from 'hardhat';
import { Contract } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log('Deploying with account:', deployer.address);

    // Deploy a simple ERC20 token that acts like ETH for testing
    // This will be mintable so we can create 66.6 "ETH" worth for testing
    console.log('\nDeploying Test ETH Token...');
    console.log('  This token represents ETH for TGE testing');
    console.log('  Can be minted to simulate having ETH');

    // Simple mintable ERC20 token
    const TestETHToken = await ethers.getContractFactory('MockERC20');
    const testETH = await TestETHToken.deploy(
        'Test ETH',
        'tETH',
        18, // 18 decimals (same as ETH)
        deployer.address // Initial supply to deployer
    ) as Contract;
    await testETH.waitForDeployment();
    const testETHAddress = await testETH.getAddress();

    // Mint 1000 tETH (representing 1000 ETH) for testing
    const totalSupply = ethers.parseEther('1000');
    // If MockERC20 has mint function, use it
    // Otherwise, deployer already has initial supply

    const tx = await testETH.deploymentTransaction();
    const receipt = await tx?.wait();

    console.log('\n✅ Test ETH Token deployed:');
    console.log('  Address:', testETHAddress);
    console.log('  Name: Test ETH');
    console.log('  Symbol: tETH');
    console.log('  Decimals: 18');
    console.log('  Transaction:', receipt?.hash);
    console.log('  Block:', receipt?.blockNumber);

    // Save to deployment info
    const deploymentFile = path.join(__dirname, '../deployments/base-sepolia.json');
    let deploymentInfo: any = {};
    if (fs.existsSync(deploymentFile)) {
        deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf-8'));
    }

    if (!deploymentInfo.contracts) {
        deploymentInfo.contracts = {};
    }
    deploymentInfo.contracts.testETHToken = {
        address: testETHAddress,
        txHash: receipt?.hash,
        blockNumber: receipt?.blockNumber,
    };

    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log('\nDeployment info saved to:', deploymentFile);

    console.log('\n⚠️  IMPORTANT:');
    console.log('  Current TGE uses native ETH (msg.value)');
    console.log('  To use this test token, you need to either:');
    console.log('  1. Modify DaemonFactory.contributeToTGE() to accept ERC20 tokens');
    console.log('  2. Create a wrapper contract that converts ERC20 to ETH');
    console.log('  3. Use Hardhat local network (recommended) - can mint unlimited ETH');
    console.log('');
    console.log('  Recommended: Use Hardhat local network for full TGE simulation');
    console.log('    npx hardhat run scripts/simulate-tge.ts --network hardhat');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

