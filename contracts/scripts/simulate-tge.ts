/**
 * @title Simulate TGE with Test ETH
 * @notice Script to simulate a TGE with multiple contributors and test ETH
 * @dev For testnet testing - mints test ETH to multiple addresses and simulates contributions
 */

import { ethers } from 'hardhat';
import { Contract } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log('Simulating TGE with deployer:', deployer.address);

    // Load deployment info
    const deploymentFile = path.join(__dirname, '../deployments/base-sepolia.json');
    if (!fs.existsSync(deploymentFile)) {
        throw new Error('Deployment file not found. Deploy contracts first.');
    }
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf-8'));

    const factoryAddress = deploymentInfo.contracts?.factory?.address;
    if (!factoryAddress) {
        throw new Error('Factory not deployed. Deploy factory first.');
    }

    // Get token address (for testing, you'll deploy a test token first)
    const tokenAddress = process.env.TEST_TOKEN_ADDRESS;
    if (!tokenAddress) {
        throw new Error('TEST_TOKEN_ADDRESS environment variable required. Deploy a test token first.');
    }

    console.log('\nTGE Simulation Configuration:');
    console.log('  Factory:', factoryAddress);
    console.log('  Token:', tokenAddress);
    console.log('  Target: 66.6 ETH total');
    console.log('  Contributors: ~350 (0.19 ETH each)');
    console.log('');

    // Get factory contract
    const factoryABI = [
        'function contributeToTGE(address token) payable',
        'function isTGEActive(address token) view returns (bool)',
        'function getTGETotalContributed(address token) view returns (uint256)',
        'function getTGEContribution(address token, address contributor) view returns (uint256)',
    ];
    const factory = new ethers.Contract(factoryAddress, factoryABI, deployer);

    // Check if TGE is active
    const isActive = await factory.isTGEActive(tokenAddress);
    if (!isActive) {
        throw new Error('TGE is not active for this token. Deploy token with TGE enabled.');
    }

    console.log('✅ TGE is active');

    // For testnet, we have two options:
    // Option 1: Use Hardhat local network (can mint unlimited ETH)
    // Option 2: Use a test token that acts like ETH (requires contract modification)
    // Option 3: Use multiple testnet accounts with faucet ETH

    const network = await ethers.provider.getNetwork();
    console.log('  Network:', network.name, '(Chain ID:', network.chainId.toString(), ')');

    if (network.chainId === 31337n) {
        // Hardhat local network - can mint ETH
        console.log('\n📝 Using Hardhat local network - can mint test ETH');
        console.log('  Simulating 350 contributors with 0.19 ETH each = 66.5 ETH total');

        // Create test accounts
        const contributors: ethers.Wallet[] = [];
        for (let i = 0; i < 350; i++) {
            const wallet = ethers.Wallet.createRandom().connect(ethers.provider);
            contributors.push(wallet);
        }

        // Mint ETH to each contributor (Hardhat allows this)
        const contributionAmount = ethers.parseEther('0.19'); // 0.19 ETH per contributor
        console.log('\n💰 Minting test ETH to contributors...');

        for (let i = 0; i < contributors.length; i++) {
            // On Hardhat, we can send ETH directly from deployer
            // In real testnet, you'd need to fund these accounts from faucet
            const tx = await deployer.sendTransaction({
                to: contributors[i].address,
                value: contributionAmount,
            });
            await tx.wait();

            if ((i + 1) % 50 === 0) {
                console.log(`  Funded ${i + 1}/${contributors.length} contributors`);
            }
        }

        console.log('✅ All contributors funded');

        // Now have each contributor contribute to TGE
        console.log('\n🎯 Simulating TGE contributions...');
        let totalContributed = 0n;

        for (let i = 0; i < contributors.length; i++) {
            try {
                const tx = await factory.connect(contributors[i]).contributeToTGE(tokenAddress, {
                    value: contributionAmount,
                });
                await tx.wait();
                totalContributed += contributionAmount;

                if ((i + 1) % 50 === 0) {
                    console.log(`  ${i + 1}/${contributors.length} contributions (${ethers.formatEther(totalContributed)} ETH total)`);
                }
            } catch (error) {
                console.error(`  Error from contributor ${i + 1}:`, error instanceof Error ? error.message : error);
            }
        }

        const finalTotal = await factory.getTGETotalContributed(tokenAddress);
        console.log('\n✅ TGE Simulation Complete!');
        console.log('  Total Contributed:', ethers.formatEther(finalTotal), 'ETH');
        console.log('  Contributors:', contributors.length);

    } else     if (network.chainId === 84532n) {
        // Base Sepolia testnet - use TestETHToken with wrapper
        console.log('\n📝 Base Sepolia Testnet - Using TestETHToken + TGEWrapper');

        const wrapperAddress = deploymentInfo.contracts?.tgeWrapper?.address;
        const testETHAddress = deploymentInfo.contracts?.daemonETHToken?.address;

        if (!wrapperAddress || !testETHAddress) {
            console.log('  ⚠️  TGEWrapper or daemonETH token not deployed');
            console.log('  Deploy daemonETH token first:');
            console.log('    npx hardhat run scripts/deploy-daemon-eth-token.ts --network base-sepolia');
            console.log('  Then deploy wrapper:');
            console.log('    npx hardhat run scripts/deploy-tge-wrapper.ts --network base-sepolia');
            return;
        }

        console.log('  Wrapper:', wrapperAddress);
        console.log('  daemonETH Token:', testETHAddress);
        console.log('');

        // Get wrapper and test token contracts
        const wrapperABI = [
            'function contributeToTGEWithToken(address token, uint256 amount)',
            'function testETHToken() view returns (address)',
        ];
        const testETHABI = [
            'function mint(address to, uint256 amount)',
            'function approve(address spender, uint256 amount) returns (bool)',
        ];

        const wrapper = new ethers.Contract(wrapperAddress, wrapperABI, deployer);
        const testETH = new ethers.Contract(testETHAddress, testETHABI, deployer);

        // Create 350 test contributors
        const contributors: ethers.Wallet[] = [];
        for (let i = 0; i < 350; i++) {
            const wallet = ethers.Wallet.createRandom().connect(ethers.provider);
            contributors.push(wallet);
        }

        const contributionAmount = ethers.parseEther('0.19'); // 0.19 tETH per contributor
        const totalNeeded = contributionAmount * BigInt(contributors.length);

        console.log('💰 Minting TestETHToken to contributors...');
        console.log(`  Amount per contributor: ${ethers.formatEther(contributionAmount)} tETH`);
        console.log(`  Total needed: ${ethers.formatEther(totalNeeded)} tETH`);

        // Mint test tokens to each contributor
        for (let i = 0; i < contributors.length; i++) {
            const tx = await testETH.mint(contributors[i].address, contributionAmount);
            await tx.wait();

            if ((i + 1) % 50 === 0) {
                console.log(`  Minted to ${i + 1}/${contributors.length} contributors`);
            }
        }

        console.log('✅ All contributors have test ETH tokens');

        // Fund wrapper with real ETH (needs to be done manually or from deployer)
        const wrapperBalance = await ethers.provider.getBalance(wrapperAddress);
        if (wrapperBalance < totalNeeded) {
            console.log(`\n⚠️  Wrapper needs ${ethers.formatEther(totalNeeded - wrapperBalance)} more ETH`);
            console.log('  Fund wrapper:');
            console.log(`    Send ETH to: ${wrapperAddress}`);
            console.log('  Or use deployer to fund:');
            const fundTx = await deployer.sendTransaction({
                to: wrapperAddress,
                value: totalNeeded - wrapperBalance,
            });
            await fundTx.wait();
            console.log('  ✅ Wrapper funded');
        }

        // Approve and contribute
        console.log('\n🎯 Simulating TGE contributions...');
        let totalContributed = 0n;

        for (let i = 0; i < contributors.length; i++) {
            try {
                // Approve wrapper to spend test token
                const approveTx = await testETH.connect(contributors[i]).approve(wrapperAddress, contributionAmount);
                await approveTx.wait();

                // Contribute via wrapper
                const contributeTx = await wrapper.connect(contributors[i]).contributeToTGEWithToken(
                    tokenAddress,
                    contributionAmount
                );
                await contributeTx.wait();
                totalContributed += contributionAmount;

                if ((i + 1) % 50 === 0) {
                    console.log(`  ${i + 1}/${contributors.length} contributions (${ethers.formatEther(totalContributed)} tETH total)`);
                }
            } catch (error) {
                console.error(`  Error from contributor ${i + 1}:`, error instanceof Error ? error.message : error);
            }
        }

        const finalTotal = await factory.getTGETotalContributed(tokenAddress);
        console.log('\n✅ TGE Simulation Complete!');
        console.log('  Total Contributed:', ethers.formatEther(finalTotal), 'ETH');
        console.log('  Contributors:', contributors.length);

    } else {
        console.log('\n⚠️  Unknown network - cannot simulate TGE');
        console.log('  Use Hardhat local network for full simulation');
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

