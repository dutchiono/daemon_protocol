/**
 * Deployment Script
 * Deploys all contracts for the builder reward system
 */

import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const deployer = new ethers.Wallet(process.env.PRIVATE_KEY || '', provider);

  console.log('Deploying from:', await deployer.getAddress());
  console.log('Balance:', ethers.formatEther(await provider.getBalance(deployer.address)));

  // Deploy ContributionRegistry
  console.log('\nDeploying ContributionRegistry...');
  const ContributionRegistry = await ethers.getContractFactory('ContributionRegistry');
  const registry = await ContributionRegistry.deploy(deployer.address);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log('ContributionRegistry deployed to:', registryAddress);

  // Deploy BuilderRewardDistributor
  console.log('\nDeploying BuilderRewardDistributor...');
  const rewardToken = process.env.REWARD_TOKEN_ADDRESS || '';
  if (!rewardToken) {
    throw new Error('REWARD_TOKEN_ADDRESS not set');
  }

  const BuilderRewardDistributor = await ethers.getContractFactory('BuilderRewardDistributor');
  const distributor = await BuilderRewardDistributor.deploy(
    registryAddress,
    rewardToken,
    deployer.address
  );
  await distributor.waitForDeployment();
  const distributorAddress = await distributor.getAddress();
  console.log('BuilderRewardDistributor deployed to:', distributorAddress);

  // Update registry to point to distributor
  console.log('\nUpdating registry...');
  const tx = await registry.setBuilderRewardDistributor(distributorAddress);
  await tx.wait();
  console.log('Registry updated');

  // Deploy FeeSplitter
  console.log('\nDeploying FeeSplitter...');
  const feeLocker = process.env.FEE_LOCKER_ADDRESS || '';
  if (!feeLocker) {
    throw new Error('FEE_LOCKER_ADDRESS not set');
  }

  const FeeSplitter = await ethers.getContractFactory('FeeSplitter');
  const feeSplitter = await FeeSplitter.deploy(
    distributorAddress,
    feeLocker,
    deployer.address
  );
  await feeSplitter.waitForDeployment();
  const feeSplitterAddress = await feeSplitter.getAddress();
  console.log('FeeSplitter deployed to:', feeSplitterAddress);

  // Save deployment addresses
  const deploymentInfo = {
    ContributionRegistry: registryAddress,
    BuilderRewardDistributor: distributorAddress,
    FeeSplitter: feeSplitterAddress,
    RewardToken: rewardToken,
    FeeLocker: feeLocker,
    Deployer: deployer.address,
    Network: (await provider.getNetwork()).chainId.toString(),
    Timestamp: new Date().toISOString(),
  };

  const outputPath = path.join(__dirname, '../deployments.json');
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log('\nDeployment info saved to:', outputPath);

  console.log('\n=== Deployment Complete ===');
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

