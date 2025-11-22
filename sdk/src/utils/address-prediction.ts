/**
 * @title Address Prediction Utilities
 * @notice Utilities for predicting and generating CREATE2 addresses to ensure token ordering
 * @dev Based on FEY SDK patterns - ensures new tokens are token0 when paired with DAEMON
 */

import { ethers } from 'ethers';
import { DAEMON_TOKEN_ADDRESS, DAEMON_FACTORY_ADDRESS } from '../contract/address.js';

/**
 * Compute factory salt from admin and innerSalt
 * Matches FEY pattern: keccak256(abi.encode(admin, innerSalt))
 */
export function computeFactorySalt(admin: string, innerSalt: string): string {
    const abi = ethers.AbiCoder.defaultAbiCoder();
    const encoded = abi.encode(['address', 'bytes32'], [admin, innerSalt]);
    return ethers.keccak256(encoded);
}

/**
 * Compute CREATE2 address for token deployment
 * CREATE2 formula: keccak256(0xff || deployer || factorySalt || initCodeHash)[12:]
 */
export function computeCreate2Address(
    factoryAddress: string,
    factorySalt: string,
    initCodeHash: string
): string {
    const factoryNoPrefix = factoryAddress.slice(2);
    const saltNoPrefix = factorySalt.slice(2);
    const initCodeHashNoPrefix = initCodeHash.slice(2);

    const preimage = `0xff${factoryNoPrefix}${saltNoPrefix}${initCodeHashNoPrefix}`;
    const hash = ethers.keccak256(preimage);
    return `0x${hash.slice(-40)}`;
}

/**
 * Generate vanity salt that ensures token0 ordering
 *
 * This function iteratively searches for a salt that produces a CREATE2 address
 * less than the DAEMON token address, ensuring the deployed token will be token0.
 *
 * Token ordering in Uniswap:
 * - token0 = lower address (numerically)
 * - token1 = higher address (numerically)
 *
 * So if NewToken address < DAEMON address:
 * - NewToken becomes token0
 * - DAEMON becomes token1
 * - Pool is: NewToken/DAEMON
 *
 * @param tokenAdmin Token admin address
 * @param initCodeHash Hash of init code (keccak256 of encoded deploy data)
 * @param targetAddress Target address (typically DAEMON_TOKEN_ADDRESS)
 * @param factoryAddress Factory address (defaults to mainnet)
 * @param maxAttempts Maximum attempts (default: 500,000)
 * @returns Object with salt and predicted address, or null if max attempts exceeded
 */
export async function findAddressBelowTarget(
    tokenAdmin: string,
    initCodeHash: string,
    targetAddress: string = DAEMON_TOKEN_ADDRESS,
    factoryAddress: string = DAEMON_FACTORY_ADDRESS,
    maxAttempts: number = 500_000
): Promise<{ salt: string; token: string } | null> {
    const targetBigInt = BigInt(targetAddress);
    const factoryNoPrefix = factoryAddress.slice(2);
    const initCodeHashNoPrefix = initCodeHash.slice(2);

    let attempts = 0;
    let salt = 0n; // Start at 0n to match successful transaction format (salt 0x0)

    while (attempts < maxAttempts) {
        // Pad salt to 32 bytes (bytes32)
        const innerSalt = ethers.toBeHex(salt, 32);

        // Compute factory salt: keccak256(abi.encode(admin, innerSalt))
        const factorySalt = computeFactorySalt(tokenAdmin, innerSalt);
        const factorySaltNoPrefix = factorySalt.slice(2);

        // CREATE2 preimage: 0xff || deployer || factorySalt || initCodeHash
        const preimage = `0xff${factoryNoPrefix}${factorySaltNoPrefix}${initCodeHashNoPrefix}`;
        const hash = ethers.keccak256(preimage);
        const addr = `0x${hash.slice(-40)}`;

        // Check if address is less than target
        if (BigInt(addr) < targetBigInt) {
            return { salt: innerSalt, token: addr };
        }

        salt++;
        attempts++;

        // Log progress every 50k attempts
        if (attempts % 50_000 === 0) {
            console.log(`Searched salts: ${attempts.toLocaleString()}`);
        }
    }

    return null; // Could not find suitable salt within max attempts
}

/**
 * Predict token address from salt and init code hash
 */
export function predictTokenAddressFromSalt(
    salt: string,
    tokenAdmin: string,
    initCodeHash: string,
    factoryAddress: string = DAEMON_FACTORY_ADDRESS
): string {
    const factorySalt = computeFactorySalt(tokenAdmin, salt);
    return computeCreate2Address(factoryAddress, factorySalt, initCodeHash);
}

/**
 * Generate salt for token0 ordering using token artifact
 *
 * This is the main function used during token deployment.
 * It ensures the deployed token will be token0 when paired with DAEMON.
 */
export async function generateSaltForToken0FromArtifact(
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
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();

    // Encode constructor arguments in exact order:
    // [name, symbol, initialSupply, tokenAdmin, image, metadata, context, chainId]
    const DEFAULT_INITIAL_SUPPLY = 100_000_000_000n * 10n ** 18n;

    const constructorArgs = abiCoder.encode(
        ['string', 'string', 'uint256', 'address', 'string', 'string', 'string', 'uint256'],
        [
            tokenConfig.name,
            tokenConfig.symbol,
            DEFAULT_INITIAL_SUPPLY,
            tokenConfig.tokenAdmin,
            tokenConfig.image,
            tokenConfig.metadata,
            tokenConfig.context,
            tokenConfig.originatingChainId,
        ]
    );

    // Compute init code hash: keccak256(bytecode + constructor args)
    const initCode = tokenArtifact.bytecode + constructorArgs.slice(2); // Remove 0x from constructor args
    const initCodeHash = ethers.keccak256(initCode);

    // Find salt that produces address < DAEMON address
    return findAddressBelowTarget(
        tokenConfig.tokenAdmin,
        initCodeHash,
        DAEMON_TOKEN_ADDRESS,
        DAEMON_FACTORY_ADDRESS,
        options?.maxAttempts || 500_000
    );
}

