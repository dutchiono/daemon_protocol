/**
 * @title Deploy DAEMON Token in Bootstrap Mode
 * @notice Deploys DAEMON token via Factory in bootstrap mode (pairs with WETH)
 * @dev This matches Fey's ceremony pattern:
 *      1. Factory is deployed with baseToken = 0x0 (bootstrap mode)
 *      2. Bootstrap deploys DAEMON token paired with WETH
 *      3. Bootstrap calls setBaseToken(daemonTokenAddress)
 *      4. Factory transitions to regular mode (all future tokens pair with DAEMON)
 */

import { ethers } from 'hardhat';
import { Contract } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log('Deploying DAEMON token in bootstrap mode...');
    console.log('Deployer:', deployer.address);
    console.log('Balance:', ethers.formatEther(await ethers.provider.getBalance(deployer.address)), 'ETH');

    // Load deployment info
    const deploymentFile = path.join(__dirname, '../deployments/base-sepolia.json');
    let deploymentInfo: any = {};
    if (fs.existsSync(deploymentFile)) {
        deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf-8'));
    }

    const factoryAddress = deploymentInfo.contracts?.factory?.address;
    if (!factoryAddress) {
        throw new Error('Factory not deployed. Deploy factory first in bootstrap mode (baseToken=0x0).');
    }

    const factory = await ethers.getContractAt('DaemonFactory', factoryAddress);

    // Verify factory is in bootstrap mode
    const baseToken = await factory.baseToken();
    if (baseToken !== ethers.ZeroAddress) {
        throw new Error('Factory is not in bootstrap mode. baseToken is already set.');
    }

    const weth = await factory.WETH();
    const bootstrap = await factory.bootstrap();

    console.log('\nFactory Status:');
    console.log('  Address:', factoryAddress);
    console.log('  BaseToken:', baseToken, '(Bootstrap Mode)');
    console.log('  WETH:', weth);
    console.log('  Bootstrap:', bootstrap);
    console.log('  Deployer is bootstrap:', deployer.address.toLowerCase() === bootstrap.toLowerCase());

    // Verify deployer is bootstrap or owner
    const owner = await factory.owner();
    if (deployer.address.toLowerCase() !== bootstrap.toLowerCase() &&
        deployer.address.toLowerCase() !== owner.toLowerCase()) {
        throw new Error('Only bootstrap or owner can deploy in bootstrap mode');
    }

    // TODO: Generate salt and initCode for DAEMON token
    // This requires the token bytecode and proper salt generation
    // For now, this is a placeholder showing the flow

    console.log('\n⚠️  TODO: Implement DAEMON token deployment');
    console.log('  1. Generate salt (ensure token address < WETH address)');
    console.log('  2. Build initCode (token bytecode + constructor args)');
    console.log('  3. Call factory.deployToken(salt, initCode, admin, WETH, tick, false, 0)');
    console.log('  4. After deployment, call factory.setBaseToken(daemonTokenAddress)');

    console.log('\n📋 Bootstrap Flow:');
    console.log('  1. ✅ Factory deployed in bootstrap mode');
    console.log('  2. ⏳ Deploy DAEMON token (this script)');
    console.log('  3. ⏳ Call setBaseToken() to transition to regular mode');
    console.log('  4. ⏳ Test regular token deployment');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

