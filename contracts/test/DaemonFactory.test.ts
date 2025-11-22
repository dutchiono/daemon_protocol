import { expect } from 'chai';
import hre from 'hardhat';
const { ethers, upgrades } = hre;
import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

describe('DaemonFactory', () => {
    let factory: Contract;
    let baseToken: string;
    let hook: Contract;
    let feeLocker: Contract;
    let teamFeeRecipient: string;
    let owner: SignerWithAddress;
    let user: SignerWithAddress;
    let bootstrap: SignerWithAddress;

    beforeEach(async () => {
        [owner, user, bootstrap] = await ethers.getSigners();

        // Deploy REAL DaemonHook (the contract we're testing integration with)
        // First set up dependencies for the hook
        const MockPoolManager = await ethers.getContractFactory('MockPoolManager');
        const poolManager = await MockPoolManager.deploy();
        await poolManager.waitForDeployment();

        const ContributionRegistry = await ethers.getContractFactory('ContributionRegistry');
        const contributionRegistry = await ContributionRegistry.deploy();
        await contributionRegistry.waitForDeployment();

        const BuilderRewardDistributor = await ethers.getContractFactory('BuilderRewardDistributor');
        const MockERC20 = await ethers.getContractFactory('MockERC20');
        const rewardToken = await MockERC20.deploy('Reward Token', 'REWARD', ethers.parseEther('1000000'));
        await rewardToken.waitForDeployment();

        const builderRewardDistributor = await BuilderRewardDistributor.deploy(
            await contributionRegistry.getAddress(),
            await rewardToken.getAddress()
        );
        await builderRewardDistributor.waitForDeployment();

        const FeeSplitter = await ethers.getContractFactory('FeeSplitter');
        const MockFeeLocker = await ethers.getContractFactory('MockFeeLocker');
        feeLocker = await MockFeeLocker.deploy();
        await feeLocker.waitForDeployment();

        const feeSplitter = await FeeSplitter.deploy(
            await builderRewardDistributor.getAddress(),
            await feeLocker.getAddress(),
            owner.address
        );
        await feeSplitter.waitForDeployment();

        // Deploy REAL DaemonHook
        const DaemonHook = await ethers.getContractFactory('DaemonHook');
        baseToken = '0x0000000000000000000000000000000000000001';
        const weth = '0x4200000000000000000000000000000000000006';

        hook = await upgrades.deployProxy(
            DaemonHook,
            [
                await poolManager.getAddress(),
                baseToken,
                weth,
                ethers.ZeroAddress, // allowlist
                await builderRewardDistributor.getAddress(),
                await feeSplitter.getAddress(),
                owner.address,
            ],
            { kind: 'uups' }
        ) as Contract;
        await hook.waitForDeployment();

        teamFeeRecipient = owner.address;

        // Deploy REAL DaemonFactory (the contract we're testing)
        const DaemonFactory = await ethers.getContractFactory('DaemonFactory');
        factory = await upgrades.deployProxy(
            DaemonFactory,
            [
                baseToken,
                await hook.getAddress(),
                bootstrap.address,
                await feeLocker.getAddress(),
                teamFeeRecipient,
                owner.address,
            ],
            { kind: 'uups' }
        ) as Contract;
        await factory.waitForDeployment();
    });

    describe('Initialization', () => {
        it('should deploy and initialize factory', async () => {
            expect(await factory.baseToken()).to.equal(baseToken);
            expect(await factory.hook()).to.equal(await hook.getAddress());
            expect(await factory.bootstrap()).to.equal(bootstrap.address);
        });

        it('should set base token correctly', async () => {
            expect(await factory.baseToken()).to.equal(baseToken);
        });

        it('should set bootstrap address correctly', async () => {
            expect(await factory.bootstrap()).to.equal(bootstrap.address);
        });
    });

    describe('Token Ordering', () => {
        it('should verify token address < baseToken address before deployment', async () => {
            // This test would require actual token deployment
            // For now, test the wouldBeToken0 function
            const tokenBelow = '0x0000000000000000000000000000000000000000';
            const tokenAbove = '0x0000000000000000000000000000000000000002';

            expect(await factory.wouldBeToken0(tokenBelow)).to.be.true;
            expect(await factory.wouldBeToken0(tokenAbove)).to.be.false;
        });

        it('should correctly predict token address from salt', async () => {
            const salt = ethers.randomBytes(32);
            const initCodeHash = ethers.keccak256('0x1234');

            const predicted = await factory.predictTokenAddress(salt, initCodeHash);
            expect(predicted).to.not.equal(ethers.ZeroAddress);
        });
    });

    describe('TGE (Token Generation Event)', () => {
        it('should start TGE when token is deployed with TGE enabled', async () => {
            // This would require actual token deployment
            // Placeholder for now
        });

        it('should track TGE contributions', async () => {
            // Placeholder - requires deployed token
        });

        it('should allow bootstrap to complete TGE', async () => {
            // Placeholder - requires deployed token
        });
    });

    describe('Access Control', () => {
        it('should allow owner to update base token', async () => {
            const newBaseToken = '0x0000000000000000000000000000000000000002';
            await factory.connect(owner).setBaseToken(newBaseToken);
            expect(await factory.baseToken()).to.equal(newBaseToken);
        });

        it('should reject non-owner from updating base token', async () => {
            const newBaseToken = '0x0000000000000000000000000000000000000002';
            await expect(
                factory.connect(user).setBaseToken(newBaseToken)
            ).to.be.revertedWithCustomError(factory, 'OwnableUnauthorizedAccount');
        });
    });
});
