#!/usr/bin/env node
/**
 * Test token launch script for Daemon Protocol
 * Tests the improved factory service with collision detection and proper salt generation
 */

import { ethers } from 'ethers';
import { buildDeployTransaction, broadcastTransaction } from './src/services/factory.js';
import { getRpcUrl, getChainId } from './src/config/env.js';

async function testLaunch() {
  console.log('\n🚀 Starting test token launch on', process.env.NETWORK || 'sepolia', '...\n');

  // Test parameters
  const testFid = BigInt(123456); // Test FID
  const tokenName = 'TestToken';
  const tokenSymbol = 'TEST';
  const ownerAddress = process.env.BOT_WALLET_ADDRESS || process.env.OWNER_ADDRESS;

  if (!ownerAddress) {
    throw new Error('BOT_WALLET_ADDRESS or OWNER_ADDRESS environment variable required');
  }

  console.log('📋 Test Configuration:');
  console.log('   Network:', process.env.NETWORK || 'sepolia');
  console.log('   Chain ID:', getChainId());
  console.log('   Owner Address:', ownerAddress);
  console.log('   Token Name:', tokenName);
  console.log('   Token Symbol:', tokenSymbol);
  console.log('');

  // Test metadata
  const metadata = {
    image: 'ipfs://QmTest123...', // Test IPFS hash
    description: 'This is a test token for Daemon Protocol'
  };

  try {
    // Build deployment transaction
    console.log('🔨 Building deployment transaction...');
    const { unsignedTx, nonce } = await buildDeployTransaction(
      {
        creator: ownerAddress,
        name: tokenName,
        symbol: tokenSymbol,
        metadata,
        fee_share_bps: 0, // No fee share for test
      },
      ownerAddress
    );

    console.log('✅ Transaction built successfully');
    console.log('   Nonce:', nonce);
    console.log('');

    // Note: In a real scenario, you would:
    // 1. Sign the transaction with the owner's private key
    // 2. Broadcast it using broadcastTransaction()
    //
    // For testing, we'll just verify the transaction was built correctly
    const provider = new ethers.JsonRpcProvider(getRpcUrl());
    const tx = ethers.Transaction.from(unsignedTx);

    console.log('📋 Transaction Details:');
    console.log('   To:', tx.to);
    console.log('   Value:', ethers.formatEther(tx.value || 0n), 'ETH');
    console.log('   Gas Limit:', tx.gasLimit?.toString());
    console.log('   Nonce:', tx.nonce);
    console.log('   Chain ID:', tx.chainId?.toString());
    console.log('');

    // Check if we should actually broadcast (set TEST_BROADCAST=true to broadcast)
    if (process.env.TEST_BROADCAST === 'true') {
      console.log('⚠️  TEST_BROADCAST=true - This will actually deploy a token!');
      console.log('   Signing and broadcasting transaction...\n');

      const privateKey = process.env.BOT_WALLET_PRIVATE_KEY;
      if (!privateKey) {
        throw new Error('BOT_WALLET_PRIVATE_KEY required for broadcasting');
      }

      const wallet = new ethers.Wallet(privateKey, provider);
      const signedTx = await wallet.signTransaction(tx);

      const result = await broadcastTransaction(signedTx);
      console.log('\n✅ Token deployed successfully!');
      console.log('   Transaction Hash:', result.txHash);
      console.log('   Token Address:', result.tokenAddress);
      console.log(`   🔗 View on Basescan: https://sepolia.basescan.org/tx/${result.txHash}`);
    } else {
      console.log('ℹ️  Transaction built but not broadcast (TEST_BROADCAST not set to true)');
      console.log('   Set TEST_BROADCAST=true to actually deploy the token');
      console.log('   This is a safety measure to prevent accidental deployments');
    }

    console.log('\n✅ Test launch completed successfully!');
  } catch (error) {
    console.error('\n❌ Error during test launch:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
}

testLaunch().catch(console.error);

