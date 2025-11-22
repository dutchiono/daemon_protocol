import { expect } from 'chai';
import hre from 'hardhat';
const { ethers, upgrades } = hre;
import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { setupTest } from './helpers/setup';

describe('DaemonHook', () => {
    let hook: Contract;
    let hookImplementation: Contract;
    let proxy: Contract;
    let poolManager: Contract;
    let baseToken: string;
    let weth: string;
    let builderRewardDistributor: Contract;
    let feeSplitter: Contract;
    let owner: SignerWithAddress;
    let user: SignerWithAddress;
    let bootstrap: SignerWithAddress;

    beforeEach(async () => {
        const setup = await setupTest();
        hook = setup.hook;
        hookImplementation = setup.hookImplementation;
        proxy = setup.proxy;
        poolManager = setup.poolManager;
        baseToken = setup.baseToken;
        weth = setup.weth;
        builderRewardDistributor = setup.builderRewardDistributor;
        feeSplitter = setup.feeSplitter;
        owner = setup.owner;
        user = setup.user;
        bootstrap = setup.bootstrap;
    });

    describe('Initialization', () => {
        it('should deploy implementation contract', async () => {
            const DaemonHook = await ethers.getContractFactory('DaemonHook');
            const implementation = await DaemonHook.deploy();
            await implementation.waitForDeployment();

            const address = await implementation.getAddress();
            expect(address).to.not.equal(ethers.ZeroAddress);
        });

        it('should deploy and initialize proxy', async () => {
            const DaemonHook = await ethers.getContractFactory('DaemonHook');
            const implementation = await DaemonHook.deploy();
            await implementation.waitForDeployment();

            // Deploy mock contracts for initialization
            const MockPoolManager = await ethers.getContractFactory('MockPoolManager');
            const mockPoolManager = await MockPoolManager.deploy();
            await mockPoolManager.waitForDeployment();

            const MockBuilderRewardDistributor = await ethers.getContractFactory('MockBuilderRewardDistributor');
            const mockDistributor = await MockBuilderRewardDistributor.deploy();
            await mockDistributor.waitForDeployment();

            const MockFeeSplitter = await ethers.getContractFactory('MockFeeSplitter');
            const mockFeeSplitter = await MockFeeSplitter.deploy();
            await mockFeeSplitter.waitForDeployment();

            const baseTokenAddr = '0x0000000000000000000000000000000000000001';
            const wethAddr = '0x4200000000000000000000000000000000000006';
            const allowlist = ethers.ZeroAddress;

            // Deploy proxy
            const proxy = await upgrades.deployProxy(
                DaemonHook,
                [
                    await mockPoolManager.getAddress(),
                    baseTokenAddr,
                    wethAddr,
                    allowlist,
                    await mockDistributor.getAddress(),
                    await mockFeeSplitter.getAddress(),
                    owner.address,
                ],
                { kind: 'uups' }
            );
            await proxy.waitForDeployment();

            // Verify initialization
            expect(await hook.baseToken()).to.equal(baseTokenAddr);
            expect(await hook.weth()).to.equal(wethAddr);
        });

        it('should set correct base token', async () => {
            expect(await hook.baseToken()).to.equal(baseToken);
        });

        it('should set correct builder reward distributor', async () => {
            expect(await hook.builderRewardDistributor()).to.not.equal(ethers.ZeroAddress);
        });

        it('should revert if initialized twice', async () => {
            const DaemonHook = await ethers.getContractFactory('DaemonHook');
            const implementation = await DaemonHook.deploy();
            await implementation.waitForDeployment();

            const MockPoolManager = await ethers.getContractFactory('MockPoolManager');
            const mockPoolManager = await MockPoolManager.deploy();
            await mockPoolManager.waitForDeployment();

            const proxy = await upgrades.deployProxy(
                DaemonHook,
                [
                    await mockPoolManager.getAddress(),
                    baseToken,
                    weth,
                    ethers.ZeroAddress,
                    await builderRewardDistributor.getAddress(),
                    await feeSplitter.getAddress(),
                    owner.address,
                ],
                { kind: 'uups' }
            );
            await proxy.waitForDeployment();

            // Try to initialize again - should revert
            await expect(
                hook.initialize(
                    await mockPoolManager.getAddress(),
                    baseToken,
                    weth,
                    ethers.ZeroAddress,
                    await builderRewardDistributor.getAddress(),
                    await feeSplitter.getAddress(),
                    owner.address
                )
            ).to.be.revertedWith('Initializable: contract is already initialized');
        });
    });

    describe('Upgradeability', () => {
        it('should allow owner to upgrade implementation', async () => {
            const DaemonHookV2 = await ethers.getContractFactory('DaemonHookV2');
            const hookV2 = await upgrades.upgradeProxy(
                await hook.getAddress(),
                DaemonHookV2
            );
            await hookV2.waitForDeployment();

            // Verify upgrade
            expect(await hookV2.getAddress()).to.equal(await hook.getAddress());
        });

        it('should reject non-owner from upgrading', async () => {
            const DaemonHookV2 = await ethers.getContractFactory('DaemonHookV2');

            await expect(
                upgrades.upgradeProxy(
                    await hook.getAddress(),
                    DaemonHookV2,
                    { signer: user }
                )
            ).to.be.reverted;
        });

        it('should preserve storage after upgrade', async () => {
            const baseTokenBefore = await hook.baseToken();
            const wethBefore = await hook.weth();

            const DaemonHookV2 = await ethers.getContractFactory('DaemonHookV2');
            const hookV2 = await upgrades.upgradeProxy(
                await hook.getAddress(),
                DaemonHookV2
            );
            await hookV2.waitForDeployment();

            // Verify storage preserved
            expect(await hookV2.baseToken()).to.equal(baseTokenBefore);
            expect(await hookV2.weth()).to.equal(wethBefore);
        });
    });

    describe('Access Control', () => {
        it('should allow owner to update builder reward distributor', async () => {
            const newDistributor = '0x0000000000000000000000000000000000000009';
            await hook.connect(owner).setBuilderRewardDistributor(newDistributor);
            expect(await hook.builderRewardDistributor()).to.equal(newDistributor);
        });

        it('should reject non-owner from updating distributor', async () => {
            const newDistributor = '0x0000000000000000000000000000000000000009';
            await expect(
                hook.connect(user).setBuilderRewardDistributor(newDistributor)
            ).to.be.revertedWithCustomError(hook, 'OwnableUnauthorizedAccount');
        });

        it('should allow owner to update protocol fee', async () => {
            const newFee = 100;
            await hook.connect(owner).setProtocolFee(newFee);
            expect(await hook.protocolFee()).to.equal(newFee);
        });
    });

    describe('Edge Cases', () => {
        it('should handle zero address validations', async () => {
            await expect(
                hook.connect(owner).setBuilderRewardDistributor(ethers.ZeroAddress)
            ).to.be.revertedWith('Invalid address');
        });
    });
});
