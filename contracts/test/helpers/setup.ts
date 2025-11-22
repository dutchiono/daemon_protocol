/**
 * @title Test Setup Helpers
 * @notice Helper functions for test setup
 */

import hre from 'hardhat';
import { ethers, upgrades } from 'hardhat';
import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

export interface TestSetup {
    hook: Contract;
    hookImplementation: Contract;
    proxy: Contract;
    poolManager: Contract;
    baseToken: string;
    weth: string;
    builderRewardDistributor: Contract;
    feeSplitter: Contract;
    owner: SignerWithAddress;
    user: SignerWithAddress;
    bootstrap: SignerWithAddress;
}

/**
 * Setup test environment
 */
export async function setupTest(): Promise<TestSetup> {
    const [owner, user, bootstrap] = await ethers.getSigners();

    const baseToken = '0x0000000000000000000000000000000000000001';
    const weth = '0x4200000000000000000000000000000000000006';
    const allowlist = ethers.ZeroAddress;

    // Deploy mock contracts for external dependencies only
    const MockPoolManager = await ethers.getContractFactory('MockPoolManager');
    const poolManager = await MockPoolManager.deploy();
    await poolManager.waitForDeployment();

    // Deploy REAL contracts we're testing
    // First, deploy ContributionRegistry (no dependencies)
    const ContributionRegistry = await ethers.getContractFactory('ContributionRegistry');
    const contributionRegistry = await ContributionRegistry.deploy();
    await contributionRegistry.waitForDeployment();

    // Deploy BuilderRewardDistributor (depends on ContributionRegistry)
    const BuilderRewardDistributor = await ethers.getContractFactory('BuilderRewardDistributor');
    const rewardToken = weth; // Use WETH as reward token for testing
    const builderRewardDistributor = await BuilderRewardDistributor.deploy(
        await contributionRegistry.getAddress(),
        rewardToken
    );
    await builderRewardDistributor.waitForDeployment();

    // Deploy FeeSplitter (depends on BuilderRewardDistributor)
    const FeeSplitter = await ethers.getContractFactory('FeeSplitter');
    const MockFeeLocker = await ethers.getContractFactory('MockFeeLocker');
    const feeLocker = await MockFeeLocker.deploy();
    await feeLocker.waitForDeployment();

    const feeSplitter = await FeeSplitter.deploy(
        await builderRewardDistributor.getAddress(),
        await feeLocker.getAddress(),
        owner.address
    );
    await feeSplitter.waitForDeployment();

    // Deploy implementation
    const DaemonHook = await ethers.getContractFactory('DaemonHook');
    const hookImplementation = await DaemonHook.deploy();
    await hookImplementation.waitForDeployment();

    // Deploy proxy using OpenZeppelin upgrades plugin
    const hook = await upgrades.deployProxy(
        DaemonHook,
        [
            await poolManager.getAddress(),
            baseToken,
            weth,
            allowlist,
            await builderRewardDistributor.getAddress(),
            await feeSplitter.getAddress(),
            owner.address,
        ],
        { kind: 'uups' }
    ) as Contract;
    await hook.waitForDeployment();

    // Get proxy address (same as hook address)
    const proxyAddress = await hook.getAddress();

    return {
        hook,
        hookImplementation,
        proxy: hook, // Proxy and hook are the same with UUPS
        poolManager,
        baseToken,
        weth,
        builderRewardDistributor,
        feeSplitter,
        owner,
        user,
        bootstrap,
    };
}

