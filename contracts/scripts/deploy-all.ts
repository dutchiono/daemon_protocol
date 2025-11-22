/**
 * @title Deploy All Daemon Contracts
 * @notice Orchestrates deployment of all contracts in correct order
 */

import { execSync } from 'child_process';
import * as path from 'path';

async function main() {
    const scriptsDir = path.join(__dirname);
    const network = process.env.NETWORK || 'base-sepolia';

    console.log('========================================');
    console.log('Daemon Protocol Deployment');
    console.log('Network:', network);
    console.log('========================================\n');

    const scripts = [
        { name: 'ContributionRegistry', file: 'deploy-contribution-registry.ts' },
        { name: 'BuilderRewardDistributor', file: 'deploy-builder-reward-distributor.ts' },
        { name: 'DaemonFeeLocker', file: 'deploy-fee-locker.ts' },
        { name: 'DaemonLpLocker', file: 'deploy-lp-locker.ts' },
        { name: 'DaemonPoolExtensionAllowlist', file: 'deploy-pool-extension-allowlist.ts' },
        { name: 'FeeSplitter', file: 'deploy-fee-splitter.ts' },
        { name: 'DaemonHook', file: 'deploy-hook.ts' },
        { name: 'DaemonFactory', file: 'deploy-factory.ts' },
    ];

    for (const script of scripts) {
        console.log(`\n[${scripts.indexOf(script) + 1}/${scripts.length}] Deploying ${script.name}...`);
        console.log('----------------------------------------');
        
        try {
            execSync(`npx hardhat run ${script.file} --network ${network}`, {
                cwd: scriptsDir,
                stdio: 'inherit',
            });
            console.log(`✅ ${script.name} deployed successfully`);
        } catch (error) {
            console.error(`❌ Failed to deploy ${script.name}`);
            console.error(error);
            process.exit(1);
        }
    }

    console.log('\n========================================');
    console.log('✅ All contracts deployed successfully!');
    console.log('========================================');
    console.log('\nDeployment info saved to: deployments/base-sepolia.json');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

