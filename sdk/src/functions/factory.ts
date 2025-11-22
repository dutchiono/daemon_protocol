/**
 * @title Factory SDK Functions
 * @notice Functions for interacting with DaemonFactory contract
 * @dev Based on fey-sdk factory functions, adapted for daemon
 */

import { ethers } from 'ethers';
import type { Provider, Signer } from 'ethers';
import { DAEMON_FACTORY_ADDRESS } from '../contract/address.js';
import * as addressPrediction from '../utils/address-prediction.js';

/**
 * Factory ABI
 */
const FACTORY_ABI = [
    'function baseToken() view returns (address)',
    'function hook() view returns (address)',
    'function bootstrap() view returns (address)',
    'function feeLocker() view returns (address)',
    'function teamFeeRecipient() view returns (address)',
    'function deployedTokens(address) view returns (bool)',
    'function predictTokenAddress(bytes32 salt, bytes32 initCodeHash) view returns (address)',
    'function wouldBeToken0(address token) view returns (bool)',
    'function isTGEActive(address token) view returns (bool)',
    'function getTGEContribution(address token, address contributor) view returns (uint256)',
    'function getTGETotalContributed(address token) view returns (uint256)',
    'function deployToken(bytes32 salt, bytes initCode, address tokenAdmin, address pairedToken, int24 tickIfToken0IsFey, bool enableTGE, uint256 tgeDuration) returns (address)',
    'function contributeToTGE(address token) payable',
    'function completeTGE(address token)',
] as const;

/**
 * Get Factory contract instance
 */
export function getFactoryContract(
    providerOrSigner: Provider | Signer,
    factoryAddress?: string
): ethers.Contract {
    return new ethers.Contract(
        factoryAddress || DAEMON_FACTORY_ADDRESS,
        FACTORY_ABI,
        providerOrSigner
    );
}

/**
 * Get factory base token (DAEMON)
 */
export async function getFactoryBaseToken(
    provider: Provider,
    factoryAddress?: string
): Promise<string | null> {
    try {
        const factoryContract = getFactoryContract(provider, factoryAddress);
        return await factoryContract.baseToken();
    } catch (error) {
        console.error('Error fetching base token:', error);
        return null;
    }
}

/**
 * Check if a token address would be token0 when paired with baseToken
 */
export async function wouldBeToken0(
    provider: Provider,
    tokenAddress: string,
    factoryAddress?: string
): Promise<boolean | null> {
    try {
        const factoryContract = getFactoryContract(provider, factoryAddress);
        return await factoryContract.wouldBeToken0(tokenAddress);
    } catch (error) {
        console.error('Error checking token0 status:', error);
        return null;
    }
}

/**
 * Predict token address from salt
 */
export async function predictTokenAddress(
    provider: Provider,
    salt: string,
    initCodeHash: string,
    factoryAddress?: string
): Promise<string | null> {
    try {
        const factoryContract = getFactoryContract(provider, factoryAddress);
        return await factoryContract.predictTokenAddress(salt, initCodeHash);
    } catch (error) {
        console.error('Error predicting token address:', error);
        return null;
    }
}

/**
 * Generate salt for token0 ordering
 * This ensures the deployed token will be token0 when paired with DAEMON
 */
export async function generateSaltForToken0(
    tokenArtifact: { bytecode: string },
    tokenConfig: {
        name: string;
        symbol: string;
        tokenAdmin: string;
        image: string;
        metadata: string;
        context: string;
        originatingChainId: bigint;
    },
    options?: {
        maxAttempts?: number;
    }
): Promise<{ salt: string; token: string } | null> {
    return addressPrediction.generateSaltForToken0FromArtifact(
        tokenArtifact,
        tokenConfig,
        options
    );
}

/**
 * Check if TGE is active for a token
 */
export async function isTGEActive(
    provider: Provider,
    tokenAddress: string,
    factoryAddress?: string
): Promise<boolean | null> {
    try {
        const factoryContract = getFactoryContract(provider, factoryAddress);
        return await factoryContract.isTGEActive(tokenAddress);
    } catch (error) {
        console.error('Error checking TGE status:', error);
        return null;
    }
}

/**
 * Get TGE contribution for a token and contributor
 */
export async function getTGEContribution(
    provider: Provider,
    tokenAddress: string,
    contributor: string,
    factoryAddress?: string
): Promise<bigint | null> {
    try {
        const factoryContract = getFactoryContract(provider, factoryAddress);
        const contribution = await factoryContract.getTGEContribution(tokenAddress, contributor);
        return BigInt(contribution.toString());
    } catch (error) {
        console.error('Error fetching TGE contribution:', error);
        return null;
    }
}

/**
 * Contribute to TGE
 */
export async function contributeToTGE(
    signer: Signer,
    tokenAddress: string,
    amount: bigint,
    factoryAddress?: string
): Promise<ethers.TransactionResponse | null> {
    try {
        const factoryContract = getFactoryContract(signer, factoryAddress);
        const tx = await factoryContract.contributeToTGE(tokenAddress, { value: amount });
        return tx;
    } catch (error) {
        console.error('Error contributing to TGE:', error);
        return null;
    }
}
