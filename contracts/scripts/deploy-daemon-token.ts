/**
 * @title Deploy DAEMON Test Token
 * @notice Deployment script for DAEMON token (test token for Base Sepolia)
 * @dev This token will be used as the base token for all other token pairs
 */

import { ethers } from 'hardhat';
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

    // Token configuration
    const tokenName = 'Daemon Protocol';
    const tokenSymbol = 'DAEMON';
    const initialSupply = ethers.parseEther('100000000000'); // 100 billion tokens
    const tokenAdmin = deployer.address; // Deployer is admin
    const image = 'ipfs://Qm...'; // TODO: Set actual IPFS hash for token image
    const metadata = JSON.stringify({
        name: tokenName,
        symbol: tokenSymbol,
        description: 'Daemon Protocol base token for Base Sepolia testnet'
    });
    const context = JSON.stringify({
        interface: 'Daemon SDK',
        platform: '',
        messageId: '',
        id: ''
    });
    const chainId = BigInt(84532); // Base Sepolia

    console.log('\nToken Configuration:');
    console.log('  Name:', tokenName);
    console.log('  Symbol:', tokenSymbol);
    console.log('  Initial Supply:', ethers.formatEther(initialSupply), 'DAEMON');
    console.log('  Admin:', tokenAdmin);
    console.log('  Chain ID:', chainId.toString());

    // TODO: Deploy token contract
    // The token contract should match the structure expected by DaemonFactory:
    // Constructor: (string name, string symbol, uint256 initialSupply, address tokenAdmin, string image, string metadata, string context, uint256 chainId)
    //
    // For now, this is a placeholder. You'll need to:
    // 1. Create the token contract (or use existing if available)
    // 2. Compile it: npx hardhat compile
    // 3. Deploy it using this script

    console.log('\n⚠️  Token contract not yet implemented.');
    console.log('   Please create and compile the token contract first.');
    console.log('   The token constructor should accept:');
    console.log('     - name (string)');
    console.log('     - symbol (string)');
    console.log('     - initialSupply (uint256)');
    console.log('     - tokenAdmin (address)');
    console.log('     - image (string)');
    console.log('     - metadata (string)');
    console.log('     - context (string)');
    console.log('     - chainId (uint256)');

    // Uncomment and update once token contract is available:
    /*
    console.log('\nDeploying DAEMON Token...');
    const DaemonToken = await ethers.getContractFactory('DaemonToken'); // or 'Token'
    const token = await DaemonToken.deploy(
        tokenName,
        tokenSymbol,
        initialSupply,
        tokenAdmin,
        image,
        metadata,
        context,
        chainId
    ) as Contract;
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();

    const tx = await token.deploymentTransaction();
    const receipt = await tx?.wait();

    console.log('DAEMON Token deployed to:', tokenAddress);
    console.log('Transaction hash:', receipt?.hash);
    console.log('Block number:', receipt?.blockNumber);

    // Update deployment info
    if (!deploymentInfo.contracts) {
        deploymentInfo.contracts = {};
    }
    deploymentInfo.contracts.daemonToken = {
        address: tokenAddress,
        txHash: receipt?.hash,
        blockNumber: receipt?.blockNumber,
    };

    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log('\nDeployment info updated in:', deploymentFile);
    */
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

