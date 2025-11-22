/**
 * @title Deploy Test Token with TGE Enabled
 * @notice Deploy a test token via DaemonFactory with TGE enabled for testing
 * @dev This token will be used for TGE simulation testing
 */

import { ethers } from 'hardhat';
import { Contract } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log('Deploying with account:', deployer.address);
    console.log('Account balance:', ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

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

    const daemonTokenAddress = process.env.DAEMON_TOKEN_ADDRESS;
    if (!daemonTokenAddress) {
        throw new Error('DAEMON_TOKEN_ADDRESS environment variable required');
    }

    console.log('\nTest Token Configuration:');
    console.log('  Factory:', factoryAddress);
    console.log('  DAEMON Token:', daemonTokenAddress);
    console.log('  TGE Target: 66.6 ETH');
    console.log('  Expected Contributors: ~350');
    console.log('  Contribution per person: ~0.19 ETH');
    console.log('');

    // Get factory contract
    const factoryABI = [
        'function deployToken(bytes32 salt, bytes calldata initCode, address tokenAdmin, address pairedToken, int24 tickIfToken0IsFey, bool enableTGE, uint256 tgeDuration) returns (address token)',
        'function baseToken() view returns (address)',
    ];
    const factory = new ethers.Contract(factoryAddress, factoryABI, deployer);

    // TODO: This needs the actual token bytecode and salt generation
    // For now, this is a placeholder showing what needs to be done

    console.log('⚠️  Token deployment requires:');
    console.log('  1. Token bytecode (from compiled token contract)');
    console.log('  2. Salt generation (using factory service)');
    console.log('  3. Init code construction');
    console.log('');
    console.log('  Recommended: Use factory service to deploy:');
    console.log('    cd backend');
    console.log('    npm run test:launch');
    console.log('');
    console.log('  Or use the SDK directly to build the deployment transaction');
    console.log('');
    console.log('  TGE Configuration:');
    console.log('    enableTGE: true');
    console.log('    tgeDuration: 7 days (604800 seconds)');
    console.log('    minContribution: 0 (no minimum)');
    console.log('    maxContribution: type(uint256).max (no maximum)');

    // Uncomment and complete once token bytecode is available:
    /*
    // Generate salt (use factory service or SDK)
    const salt = '0x...'; // Generated via factory service

    // Build init code (bytecode + constructor args)
    const initCode = '0x...'; // Token bytecode + encoded constructor args

    // Deploy token with TGE enabled
    const tgeDuration = 7 * 24 * 60 * 60; // 7 days in seconds
    const tx = await factory.deployToken(
        salt,
        initCode,
        deployer.address, // tokenAdmin
        daemonTokenAddress, // pairedToken
        0, // tickIfToken0IsFey (not used for new tokens)
        true, // enableTGE
        tgeDuration
    );

    const receipt = await tx.wait();

    // Parse TokenCreated event to get token address
    const tokenAddress = '0x...'; // From event

    console.log('\n✅ Test Token deployed with TGE enabled:');
    console.log('  Token Address:', tokenAddress);
    console.log('  Transaction:', receipt.hash);
    console.log('  TGE Duration:', tgeDuration, 'seconds (7 days)');
    console.log('');
    console.log('  Next: Run TGE simulation');
    console.log('    npx hardhat run scripts/simulate-tge.ts --network hardhat');
    */
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

