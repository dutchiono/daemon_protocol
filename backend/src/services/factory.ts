import { ethers } from 'ethers';
import type { Provider } from 'ethers';
import { getRpcUrl, getChainId } from '../config/env.js';
import { getStartingTick, getTickSpacing } from '../config/ticks.js';
import * as fs from 'fs';
import * as path from 'path';
import {
  generateSaltForToken0FromArtifact,
  getFactoryContract,
  DAEMON_FACTORY_ADDRESS,
  DAEMON_TOKEN_ADDRESS,
  DAEMON_HOOK_ADDRESS,
  WETH_ADDRESS
} from '../../../sdk/src/index.js';
import { uploadMetadata } from './metadata.js';

// Default tick spacing (matches Uniswap V4 standard)
const DEFAULT_TICK_SPACING = 200;

// Default starting tick (will be calculated based on market cap)
const DEFAULT_STARTING_TICK = -10400;

// Default tick range width for liquidity
const TICK_RANGE_WIDTH = 110400;

/**
 * Build unsigned transaction for token deployment
 * NOTE: This needs a token artifact/bytecode to work properly
 * For now, it's a placeholder that can be completed once token contract is available
 */
export async function buildDeployTransaction(
  payload: {
    creator: string;
    name: string;
    symbol: string;
    metadata: {
      image: string;
      description?: string;
    };
    fee_share_bps?: number;
  },
  ownerAddress: string,
  options?: {
    // Future: Add tick calculation options
  }
): Promise<{ unsignedTx: string; nonce: number }> {
  // Ensure owner matches creator
  if (payload.creator.toLowerCase() !== ownerAddress.toLowerCase()) {
    throw new Error('Owner address mismatch');
  }

  // Validate addresses
  if (!ethers.isAddress(ownerAddress)) {
    throw new Error('Invalid owner address');
  }

  // Create provider
  const provider = new ethers.JsonRpcProvider(getRpcUrl());

  // Get factory contract
  const factoryContract = getFactoryContract(provider, DAEMON_FACTORY_ADDRESS);

  // Load token artifact/bytecode
  // Try loading from Hardhat artifacts first, then fall back to environment variable
  let tokenBytecode = '';

  // Try to load from Hardhat artifacts
  // Path: daemon/contracts/artifacts/contracts/core/Token.sol/Token.json
  // Or: daemon/contracts/artifacts/contracts/Token.sol/DaemonToken.json
  const possibleArtifactPaths = [
    path.join(process.cwd(), 'contracts', 'artifacts', 'contracts', 'core', 'Token.sol', 'Token.json'),
    path.join(process.cwd(), 'contracts', 'artifacts', 'contracts', 'core', 'DaemonToken.sol', 'DaemonToken.json'),
    path.join(process.cwd(), 'contracts', 'artifacts', 'contracts', 'Token.sol', 'Token.json'),
    path.join(process.cwd(), 'daemon', 'contracts', 'artifacts', 'contracts', 'core', 'Token.sol', 'Token.json'),
    path.join(process.cwd(), 'daemon', 'contracts', 'artifacts', 'contracts', 'core', 'DaemonToken.sol', 'DaemonToken.json'),
  ];

  for (const artifactPath of possibleArtifactPaths) {
    if (fs.existsSync(artifactPath)) {
      try {
        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));
        tokenBytecode = artifact.bytecode?.object || artifact.bytecode || '';
        if (tokenBytecode && tokenBytecode !== '0x' && tokenBytecode.length > 100) {
          console.log(`   ✅ Loaded token bytecode from artifact: ${artifactPath}`);
          break;
        }
      } catch (error) {
        // Continue to next path
      }
    }
  }

  // Fall back to environment variable
  if (!tokenBytecode || tokenBytecode === '0x' || tokenBytecode.length < 100) {
    tokenBytecode = process.env.TOKEN_BYTECODE || '';
  }

  if (!tokenBytecode || tokenBytecode === '0x' || tokenBytecode.length < 100) {
    throw new Error(
      'Token bytecode not found. Options:\n' +
      '1. Compile token contract: cd contracts && npx hardhat compile\n' +
      '2. Set TOKEN_BYTECODE environment variable\n' +
      '3. Ensure token artifact exists in contracts/artifacts/'
    );
  }

  const tokenArtifact = {
    bytecode: tokenBytecode,
  };

  // Generate salt using token artifact to ensure token0 ordering and uniqueness
  // This matches the Fey deployer's salt generation algorithm exactly
  // Salt generator now starts at 0 (matching successful transaction format)
  // Also checks on-chain for collisions to avoid conflicts with other deployers
  console.log('   🔑 Generating salt using token bytecode (starting from salt 0)...');

  // Use the same context format as successful transactions (empty messageId/id)
  // This matches the format used in production deployments
  // For collision avoidance: if collision detected, we'll add a unique ID to context
  const baseContext = {
    interface: 'Daemon SDK',
    platform: '',
    messageId: '',
    id: ''
  };

  // Generate salt - try with base context first (matches successful transaction format)
  // If collision detected, retry with unique context to get different initCodeHash
  let saltResult: { salt: string; token: string } | null = null;
  let attempts = 0;
  const maxCollisionRetries = 3;

  while (!saltResult && attempts <= maxCollisionRetries) {
    // First attempt: use base context (matches successful transaction)
    // Retries: add unique ID to context to get different initCodeHash (avoids collision)
    const contextData = attempts === 0
      ? baseContext
      : {
          interface: 'Daemon SDK',
          platform: '',
          messageId: `daemon-${Date.now()}-${attempts}`,
          id: `collision-${attempts}`
        };

    const candidate = await generateSaltForToken0FromArtifact(
      tokenArtifact as any,
      {
        name: payload.name,
        symbol: payload.symbol,
        tokenAdmin: ownerAddress,
        image: payload.metadata.image,
        metadata: JSON.stringify(payload.metadata),
        context: JSON.stringify(contextData),
        originatingChainId: BigInt(getChainId()), // Base mainnet or Sepolia
      },
      {
        maxAttempts: 100_000, // Reasonable limit for salt generation
      }
    );

    if (!candidate) {
      throw new Error('Failed to generate salt: could not find a salt that ensures token0 ordering within max attempts');
    }

    // Check on-chain if this specific token address already exists (collision detection)
    // Collision = same admin + same salt + same initCodeHash already deployed
    console.log(`   🔍 Checking for collision at predicted address: ${candidate.token}...`);
    const existingCode = await provider.getCode(candidate.token);

    if (existingCode && existingCode !== '0x') {
      if (attempts === 0) {
        console.log(`   ⚠️  Collision detected with base context format!`);
        console.log(`   💡 This exact combination (admin + salt + config) was already deployed.`);
        console.log(`   🔄 Retrying with unique context to avoid collision...`);
      } else {
        console.log(`   ⚠️  Collision still detected (attempt ${attempts + 1})`);
        console.log(`   🔄 Trying different context...`);
      }
      attempts++;
      continue;
    }

    // No collision found - use this salt
    saltResult = candidate;
    if (attempts > 0) {
      console.log(`   ✅ No collision - using salt with collision-avoidance context (attempt ${attempts + 1})`);
    } else {
      console.log(`   ✅ No collision - salt is safe to use`);
    }
    break;
  }

  if (!saltResult) {
    throw new Error(`Failed to find collision-free salt after ${maxCollisionRetries + 1} attempts. This may indicate very high deployment activity or a configuration issue.`);
  }

  const salt = saltResult.salt;

  console.log(`   ✅ Generated salt: ${salt}`);
  console.log(`   📍 Predicted token address: ${saltResult.token}`);

  // Load ticks from config file (generated by daemon_launch_ticks.py)
  // Falls back to default if config file doesn't exist
  const tickIfToken0IsFey = getStartingTick();
  const tickSpacing = getTickSpacing();

  console.log(`   📊 Using tick configuration:`);
  console.log(`      Starting tick (tickIfToken0IsFey): ${tickIfToken0IsFey}`);
  console.log(`      Tick spacing: ${tickSpacing}`);

  // Build init code (bytecode + constructor args)
  // TODO: This needs the actual token bytecode
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  const DEFAULT_INITIAL_SUPPLY = 100_000_000_000n * 10n ** 18n;

  const constructorArgs = abiCoder.encode(
    ['string', 'string', 'uint256', 'address', 'string', 'string', 'string', 'uint256'],
    [
      payload.name,
      payload.symbol,
      DEFAULT_INITIAL_SUPPLY,
      ownerAddress,
      payload.metadata.image,
      JSON.stringify(payload.metadata),
      JSON.stringify({
        interface: 'Daemon SDK',
        platform: '',
        messageId: '',
        id: ''
      }),
      BigInt(getChainId()), // Base mainnet or Sepolia
    ]
  );

  // TODO: Combine token bytecode with constructor args to create initCode
  const initCode = tokenArtifact.bytecode + constructorArgs.slice(2);

  // Build transaction to call factory.deployToken
  const factoryInterface = new ethers.Interface([
    'function deployToken(bytes32 salt, bytes calldata initCode, address tokenAdmin, address pairedToken, int24 tickIfToken0IsFey, bool enableTGE, uint256 tgeDuration) returns (address token)',
  ]);

  // Use DAEMON token as paired token
  const pairedToken = DAEMON_TOKEN_ADDRESS;

  // TGE configuration (can be enabled/disabled)
  const enableTGE = false; // Default: no TGE
  const tgeDuration = 0; // Not used if TGE disabled

  const data = factoryInterface.encodeFunctionData('deployToken', [
    salt,
    initCode,
    ownerAddress,
    pairedToken,
    tickIfToken0IsFey,
    enableTGE,
    tgeDuration,
  ]);

  // Build transaction request
  const txRequest: ethers.TransactionRequest = {
    to: DAEMON_FACTORY_ADDRESS,
    data,
    value: 0n,
    gasLimit: 500000n, // Default gas limit
  };

  // Build unsigned transaction (get nonce, chainId, fee data)
  const network = await provider.getNetwork();
  const nonce = await provider.getTransactionCount(ownerAddress, 'pending');
  const feeData = await provider.getFeeData();

  // Build transaction object
  const transaction: ethers.TransactionLike = {
    to: DAEMON_FACTORY_ADDRESS,
    data,
    value: 0n,
    gasLimit: txRequest.gasLimit,
    nonce,
    chainId: network.chainId,
    type: 2, // EIP-1559
    maxFeePerGas: feeData.maxFeePerGas || 0n,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || 0n,
  };

  // Estimate gas before serializing
  try {
    console.log('   ⛽ Estimating gas...');
    const estimatedGas = await provider.estimateGas(transaction);
    console.log('   ✅ Gas estimate:', estimatedGas.toString());
    const gasWithBuffer = (estimatedGas * 120n) / 100n; // 20% buffer
    transaction.gasLimit = gasWithBuffer > (transaction.gasLimit || 0n)
      ? gasWithBuffer
      : transaction.gasLimit || 500000n;
    console.log('   ✅ Gas limit set to:', transaction.gasLimit.toString());
  } catch (error) {
    console.error('   ⚠️  Gas estimation failed:', error instanceof Error ? error.message : 'Unknown error');
    // Use default gas limit
    if (!transaction.gasLimit) {
      transaction.gasLimit = 500000n;
    }
  }

  // Serialize unsigned transaction
  // Remove 'from' field if present (unsigned transactions can't have 'from')
  const txCopy: any = { ...transaction };
  delete txCopy.from;
  const unsignedTx = ethers.Transaction.from(txCopy).unsignedSerialized;

  return { unsignedTx, nonce };
}

/**
 * Broadcast a signed transaction and wait for TokenCreated event
 */
export async function broadcastTransaction(signedTx: string): Promise<{
  txHash: string;
  tokenAddress: string | null;
}> {
  try {
    console.log('   📡 Broadcasting transaction...');

    const provider = new ethers.JsonRpcProvider(getRpcUrl());
    const tx = ethers.Transaction.from(signedTx);

    console.log('   🔍 Transaction details:');
    console.log('      To:', tx.to);
    console.log('      Value:', ethers.formatEther(tx.value || 0n), 'ETH');
    console.log('      Gas Limit:', tx.gasLimit?.toString());
    console.log('      Nonce:', tx.nonce);

    // Send transaction
    const response = await provider.broadcastTransaction(signedTx);
    console.log('   ✅ Transaction broadcast:', response.hash);

    // Wait for receipt
    const receipt = await response.wait();
    console.log('   ✅ Transaction confirmed:', receipt?.hash);

    // Parse TokenCreated event from receipt
    let tokenAddress: string | null = null;
    if (receipt) {
      const factoryInterface = new ethers.Interface([
        'event TokenCreated(address indexed token, address indexed admin, address indexed creator, address pairedToken, int24 tickIfToken0IsFey)',
      ]);

      for (const log of receipt.logs) {
        try {
          const parsed = factoryInterface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          });
          if (parsed && parsed.name === 'TokenCreated') {
            tokenAddress = parsed.args.token;
            console.log('   ✅ Token address:', tokenAddress);
            break;
          }
        } catch {
          // Not the event we're looking for
        }
      }
    }

    return {
      txHash: receipt?.hash || response.hash,
      tokenAddress,
    };
  } catch (error) {
    console.error('   ❌ Error broadcasting transaction:', error);
    throw error;
  }
}

