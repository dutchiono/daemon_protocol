/**
 * @title Verify All Contracts on Basescan
 * @notice Verification script for all Daemon contracts on Base Sepolia
 * @dev Uses Hardhat verify plugin to verify contracts on Basescan
 */

import { run } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    const deploymentFile = path.join(__dirname, '../deployments/base-sepolia.json');

    if (!fs.existsSync(deploymentFile)) {
        throw new Error(`Deployment file not found: ${deploymentFile}`);
    }

    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf-8'));
    const contracts = deploymentInfo.contracts || {};

    console.log('Verifying contracts on Basescan...\n');

    // List of contracts to verify (in deployment order)
    const contractsToVerify = [
        { key: 'daemonToken', name: 'DAEMON Token', hasImplementation: false },
        { key: 'contributionRegistry', name: 'ContributionRegistry', hasImplementation: false },
        { key: 'builderRewardDistributor', name: 'BuilderRewardDistributor', hasImplementation: false },
        { key: 'feeLocker', name: 'DaemonFeeLocker', hasImplementation: true },
        { key: 'lpLocker', name: 'DaemonLpLocker', hasImplementation: true },
        { key: 'poolExtensionAllowlist', name: 'DaemonPoolExtensionAllowlist', hasImplementation: false },
        { key: 'feeSplitter', name: 'FeeSplitter', hasImplementation: false },
        { key: 'hook', name: 'DaemonHook', hasImplementation: true },
        { key: 'factory', name: 'DaemonFactory', hasImplementation: true },
    ];

    for (const contract of contractsToVerify) {
        const contractInfo = contracts[contract.key];
        if (!contractInfo || !contractInfo.address) {
            console.log(`⏭️  Skipping ${contract.name} - not deployed yet`);
            continue;
        }

        const address = contractInfo.address;
        console.log(`\n🔍 Verifying ${contract.name}...`);
        console.log(`   Address: ${address}`);

        try {
            // For UUPS proxies, verify both proxy and implementation
            if (contract.hasImplementation && contractInfo.implementation) {
                console.log(`   Implementation: ${contractInfo.implementation}`);

                // Verify implementation first
                await run('verify:verify', {
                    address: contractInfo.implementation,
                    constructorArguments: [], // UUPS implementations have no constructor args
                });
                console.log(`   ✅ Implementation verified`);
            }

            // Verify proxy (or regular contract)
            // Note: Constructor arguments depend on the contract
            // You may need to adjust these based on actual deployment parameters
            const constructorArgs: any[] = [];

            // Add contract-specific constructor args here if needed
            // Example for DaemonFactory:
            // if (contract.key === 'factory') {
            //     constructorArgs = [
            //         baseTokenAddress,
            //         hookAddress,
            //         bootstrapAddress,
            //         feeLockerAddress,
            //         teamFeeRecipientAddress,
            //         ownerAddress
            //     ];
            // }

            await run('verify:verify', {
                address: address,
                constructorArguments: constructorArgs,
            });

            console.log(`   ✅ ${contract.name} verified on Basescan`);
            console.log(`   🔗 https://sepolia.basescan.org/address/${address}`);
        } catch (error: any) {
            if (error.message?.includes('Already Verified')) {
                console.log(`   ✅ ${contract.name} already verified`);
            } else {
                console.error(`   ❌ Error verifying ${contract.name}:`, error.message);
                console.log(`   💡 You may need to verify manually with constructor arguments`);
            }
        }
    }

    console.log('\n✅ Verification complete!');
    console.log('\n📝 Note: Some contracts may require manual verification with specific constructor arguments.');
    console.log('   Check the deployment scripts for the exact constructor parameters.');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

