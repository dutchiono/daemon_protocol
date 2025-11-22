/**
 * @title Deploy DaemonFactory
 * @notice Deployment script for DaemonFactory (depends on DaemonHook, DaemonFeeLocker, DaemonLpLocker)
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

    // For bootstrap mode, baseToken can be address(0)
    // After bootstrap deployment, setBaseToken() will be called
    let baseTokenAddress = process.env.DAEMON_TOKEN_ADDRESS;
    if (!baseTokenAddress || baseTokenAddress === 'TBD' || baseTokenAddress === '') {
        baseTokenAddress = ethers.ZeroAddress; // Use 0x0 for bootstrap mode
    }
    const isBootstrap = baseTokenAddress === ethers.ZeroAddress;

    if (isBootstrap) {
        console.log('⚠️  Bootstrap mode: Factory will be deployed without baseToken');
        console.log('   After deploying DAEMON token, call setBaseToken() to transition to regular mode');
    }

    const hook = deploymentInfo.contracts?.hook?.address;
    const feeLocker = deploymentInfo.contracts?.feeLocker?.address;
    const lpLocker = deploymentInfo.contracts?.lpLocker?.address;

    if (!hook) {
        throw new Error('DaemonHook not found. Deploy it first.');
    }
    if (!feeLocker) {
        throw new Error('DaemonFeeLocker not found. Deploy it first.');
    }
    if (!lpLocker) {
        throw new Error('DaemonLpLocker not found. Deploy it first.');
    }

    const bootstrap = process.env.BOOTSTRAP_ADDRESS || deployer.address;
    const teamFeeRecipient = process.env.TEAM_FEE_RECIPIENT || deployer.address;

    // WETH address
    // For testnet: Can use daemonETH (dETH) if we don't have enough testnet ETH
    // For mainnet: Must use real WETH (0x4200000000000000000000000000000000000006 on Base)
    let wethAddress = process.env.WETH_ADDRESS;

    // If no WETH_ADDRESS set, check if we should use dETH for testnet
    if (!wethAddress) {
        const network = process.env.NETWORK || 'base-sepolia';
        const isTestnet = network.includes('sepolia') || network.includes('testnet');

        if (isTestnet) {
            // Check if daemonETH is deployed and use it as WETH for testnet
            const daemonETH = deploymentInfo.contracts?.daemonETHToken?.address;
            if (daemonETH) {
                console.log('⚠️  TESTNET MODE: Using daemonETH as WETH for bootstrap pairing');
                console.log('   This is testnet-only. Mainnet must use real WETH.');
                wethAddress = daemonETH;
            } else {
                // Fallback to real WETH on testnet
                wethAddress = '0x4200000000000000000000000000000000000006';
            }
        } else {
            // Mainnet: use real WETH
            wethAddress = '0x4200000000000000000000000000000000000006';
        }
    }

    console.log('Base Token:', isBootstrap ? '0x0 (Bootstrap Mode)' : baseTokenAddress);
    console.log('Hook:', hook);
    console.log('Bootstrap:', bootstrap);
    console.log('Fee Locker:', feeLocker);
    console.log('LP Locker:', lpLocker);
    console.log('Team Fee Recipient:', teamFeeRecipient);
    console.log('WETH:', wethAddress);

    // Deploy DaemonFactory
    console.log('\nDeploying DaemonFactory...');
    const DaemonFactory = await ethers.getContractFactory('DaemonFactory');
    const factory = await upgrades.deployProxy(
        DaemonFactory,
        [
            baseTokenAddress, // Can be 0x0 for bootstrap mode
            hook,
            bootstrap,
            feeLocker,
            teamFeeRecipient,
            wethAddress, // WETH address (required for bootstrap mode)
            deployer.address, // owner
        ],
        {
            kind: 'uups',
            unsafeAllow: ['constructor', 'state-variable-immutable']
        }
    ) as Contract;
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();

    const tx = await factory.deploymentTransaction();
    const receipt = await tx?.wait();

    // Get implementation address
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(factoryAddress);

    console.log('DaemonFactory deployed to:', factoryAddress);
    console.log('Implementation address:', implementationAddress);
    console.log('Transaction hash:', receipt?.hash);
    console.log('Block number:', receipt?.blockNumber);

    // Verify initialization
    const baseToken = await factory.baseToken();
    const owner = await factory.owner();
    const weth = await factory.WETH();

    console.log('\nVerification:');
    console.log('  Base Token:', baseToken === ethers.ZeroAddress ? '0x0 (Bootstrap Mode)' : baseToken);
    console.log('  WETH:', weth);
    console.log('  Owner:', owner);

    if (isBootstrap) {
        console.log('\n📋 Next Steps (Bootstrap Mode):');
        console.log('  1. Deploy DAEMON token via factory.deployToken() with pairedToken=WETH');
        console.log('  2. Call factory.setBaseToken(daemonTokenAddress) to transition to regular mode');
        console.log('  3. After setBaseToken(), all future tokens will pair with DAEMON');
    }

    // Update deployment info
    if (!deploymentInfo.contracts) {
        deploymentInfo.contracts = {};
    }
    deploymentInfo.contracts.factory = {
        address: factoryAddress,
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

    // Update LP Locker with factory address
    console.log('\nUpdating LP Locker with factory address...');
    const DaemonLpLocker = await ethers.getContractFactory('DaemonLpLocker');
    const lpLockerContract = DaemonLpLocker.attach(lpLocker);
    const updateTx = await lpLockerContract.setFactory(factoryAddress);
    await updateTx.wait();
    console.log('LP Locker factory updated');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

