import { expect } from 'chai';
import hre from 'hardhat';
const { ethers } = hre;
import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

describe('FeeSplitter', () => {
    let feeSplitter: Contract;
    let builderRewardDistributor: Contract;
    let feeLocker: Contract;
    let token: Contract;
    let owner: SignerWithAddress;
    let tokenDev: SignerWithAddress;
    let staker: SignerWithAddress;

    beforeEach(async () => {
        [owner, tokenDev, staker] = await ethers.getSigners();

        // Deploy REAL contracts we're testing
        // First, deploy ContributionRegistry
        const ContributionRegistry = await ethers.getContractFactory('ContributionRegistry');
        const contributionRegistry = await ContributionRegistry.deploy();
        await contributionRegistry.waitForDeployment();

        // Deploy BuilderRewardDistributor (real contract, not mock)
        const BuilderRewardDistributor = await ethers.getContractFactory('BuilderRewardDistributor');
        const MockERC20 = await ethers.getContractFactory('MockERC20');
        const rewardToken = await MockERC20.deploy('Reward Token', 'REWARD', ethers.parseEther('1000000'));
        await rewardToken.waitForDeployment();

        builderRewardDistributor = await BuilderRewardDistributor.deploy(
            await contributionRegistry.getAddress(),
            await rewardToken.getAddress()
        );
        await builderRewardDistributor.waitForDeployment();

        // Deploy mock for external dependency (fee locker)
        const MockFeeLocker = await ethers.getContractFactory('MockFeeLocker');
        feeLocker = await MockFeeLocker.deploy();
        await feeLocker.waitForDeployment();

        // Deploy ERC20 token for testing fees
        token = await MockERC20.deploy('Test Token', 'TEST', ethers.parseEther('1000000'));
        await token.waitForDeployment();

        // Deploy FeeSplitter (REAL contract we're testing)
        const FeeSplitter = await ethers.getContractFactory('FeeSplitter');
        feeSplitter = await FeeSplitter.deploy(
            await builderRewardDistributor.getAddress(),
            await feeLocker.getAddress(),
            owner.address
        );
        await feeSplitter.waitForDeployment();
    });

    describe('Initialization', () => {
        it('should set builder reward distributor', async () => {
            expect(await feeSplitter.builderRewardDistributor()).to.equal(
                await builderRewardDistributor.getAddress()
            );
        });

        it('should set fee locker', async () => {
            expect(await feeSplitter.feeLocker()).to.equal(await feeLocker.getAddress());
        });
    });

    describe('Fee Splitting', () => {
        it('should take 5% builder cut', async () => {
            const totalFees = ethers.parseEther('1000');
            const builderCut = (totalFees * BigInt(500)) / BigInt(10000); // 5%
            const remaining = totalFees - builderCut;

            // Verify calculation
            expect(builderCut).to.equal(ethers.parseEther('50'));
            expect(remaining).to.equal(ethers.parseEther('950'));

            // Test actual splitFees function
            const tokenAddress = await token.getAddress();

            // Transfer tokens to fee splitter
            await token.transfer(await feeSplitter.getAddress(), totalFees);

            // Set token dev address so fees can be split
            await feeSplitter.connect(owner).setTokenDevAddress(tokenAddress, tokenDev.address);
            await feeSplitter.connect(owner).setTokenFeeSplit(tokenAddress, 0); // 0% to stakers, 100% to dev

            // Call splitFees
            await feeSplitter.splitFees(tokenAddress, totalFees);

            // Verify builder reward distributor received 5%
            const distributorBalance = await token.balanceOf(await builderRewardDistributor.getAddress());
            expect(distributorBalance).to.equal(builderCut);
        });

        it('should split remaining 95% based on token config', async () => {
            const tokenAddress = await token.getAddress();
            const stakerShareBps = 7000; // 70% to stakers, 30% to dev

            await feeSplitter.connect(owner).setTokenFeeSplit(tokenAddress, stakerShareBps);
            await feeSplitter.connect(owner).setTokenDevAddress(tokenAddress, tokenDev.address);

            const totalFees = ethers.parseEther('1000');
            const builderCut = (totalFees * BigInt(500)) / BigInt(10000);
            const remaining = totalFees - builderCut;
            const stakerShare = (remaining * BigInt(stakerShareBps)) / BigInt(10000);
            const devShare = remaining - stakerShare;

            expect(stakerShare).to.equal(ethers.parseEther('665')); // 70% of 950
            expect(devShare).to.equal(ethers.parseEther('285')); // 30% of 950

            // Test actual split
            await token.transfer(await feeSplitter.getAddress(), totalFees);
            await feeSplitter.splitFees(tokenAddress, totalFees);

            // Verify distributions
            const distributorBalance = await token.balanceOf(await builderRewardDistributor.getAddress());
            const devBalance = await token.balanceOf(tokenDev.address);
            const lockerBalance = await token.balanceOf(await feeLocker.getAddress());

            expect(distributorBalance).to.equal(builderCut);
            expect(devBalance).to.equal(devShare);
            expect(lockerBalance).to.equal(stakerShare);
        });
    });

    describe('Access Control', () => {
        it('should allow owner to update builder reward distributor', async () => {
            const newDistributor = '0x0000000000000000000000000000000000000009';
            await feeSplitter.connect(owner).setBuilderRewardDistributor(newDistributor);
            expect(await feeSplitter.builderRewardDistributor()).to.equal(newDistributor);
        });

        it('should reject non-owner from updating distributor', async () => {
            const newDistributor = '0x0000000000000000000000000000000000000009';
            await expect(
                feeSplitter.connect(tokenDev).setBuilderRewardDistributor(newDistributor)
            ).to.be.revertedWithCustomError(feeSplitter, 'OwnableUnauthorizedAccount');
        });
    });
});

