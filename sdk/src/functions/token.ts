/**
 * @title Token SDK Functions
 * @notice Functions for interacting with token contracts
 * @dev Based on fey-sdk token functions, adapted for daemon
 */

import { ethers } from 'ethers';
import type { Provider } from 'ethers';

/**
 * Token ABI (simplified - full ABI would be imported)
 */
const TOKEN_ABI = [
    'function admin() view returns (address)',
    'function originalAdmin() view returns (address)',
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function totalSupply() view returns (uint256)',
] as const;

/**
 * Get token contract instance
 */
export function getTokenContract(
    provider: Provider,
    tokenAddress: string
): ethers.Contract {
    return new ethers.Contract(tokenAddress, TOKEN_ABI, provider);
}

/**
 * Get token admin address
 */
export async function getTokenAdmin(
    provider: Provider,
    tokenAddress: string
): Promise<string | null> {
    try {
        const tokenContract = getTokenContract(provider, tokenAddress);
        return await tokenContract.admin();
    } catch (error) {
        console.error('Error fetching token admin:', error);
        return null;
    }
}

/**
 * Get token original admin address
 */
export async function getTokenOriginalAdmin(
    provider: Provider,
    tokenAddress: string
): Promise<string | null> {
    try {
        const tokenContract = getTokenContract(provider, tokenAddress);
        return await tokenContract.originalAdmin();
    } catch (error) {
        console.error('Error fetching original admin:', error);
        return null;
    }
}

/**
 * Get token metadata
 */
export async function getTokenMetadata(
    provider: Provider,
    tokenAddress: string
): Promise<{ name: string; symbol: string; totalSupply: bigint } | null> {
    try {
        const tokenContract = getTokenContract(provider, tokenAddress);
        const [name, symbol, totalSupply] = await Promise.all([
            tokenContract.name(),
            tokenContract.symbol(),
            tokenContract.totalSupply(),
        ]);

        return {
            name,
            symbol,
            totalSupply: BigInt(totalSupply.toString()),
        };
    } catch (error) {
        console.error('Error fetching token metadata:', error);
        return null;
    }
}

