/**
 * Simple script to check Fey token deployment
 * Uses Basescan API to get deployment transaction
 */

import { ethers } from 'ethers';

const FEY_TOKEN_ADDRESS = '0xD09cf0982A32DD6856e12d6BF2F08A822eA5D91D';
const FEY_FACTORY_ADDRESS = '0x8eef0dc80adf57908bb1be0236c2a72a7e379c2d';

async function main() {
    const rpcUrl = process.env.ALCHEMY_API_KEY
        ? `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
        : 'https://mainnet.base.org';
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    console.log('Checking Fey token deployment...\n');

    // Get token contract code
    const tokenCode = await provider.getCode(FEY_TOKEN_ADDRESS);
    if (tokenCode === '0x') {
        console.log('❌ Token has no code - not a contract');
        return;
    }

    // Get token info
    const tokenABI = [
        'function name() view returns (string)',
        'function symbol() view returns (string)',
        'function totalSupply() view returns (uint256)',
    ];
    const token = new ethers.Contract(FEY_TOKEN_ADDRESS, tokenABI, provider);
    const [name, symbol, supply] = await Promise.all([
        token.name(),
        token.symbol(),
        token.totalSupply()
    ]);

    console.log(`Token: ${name} (${symbol})`);
    console.log(`Total Supply: ${ethers.formatEther(supply)}`);
    console.log(`\n📋 Key Information:`);
    console.log(`   Token Address: ${FEY_TOKEN_ADDRESS}`);
    console.log(`   Factory Address: ${FEY_FACTORY_ADDRESS}`);
    console.log(`\n🔍 To understand the ceremony:`);
    console.log(`   1. Check Basescan for token creation transaction:`);
    console.log(`      https://basescan.org/address/${FEY_TOKEN_ADDRESS}#code`);
    console.log(`   2. Check if token was deployed via Factory or separately`);
    console.log(`   3. Look for any TGE/ceremony contract that collected ETH`);
    console.log(`   4. Check Factory's deployToken function - it's payable, so ETH can be sent`);
    console.log(`\n💡 Hypothesis:`);
    console.log(`   - Fey token may have been deployed via Factory.deployToken() with ETH value`);
    console.log(`   - The ETH sent during deployment could have been used for initial liquidity`);
    console.log(`   - OR there was a separate ceremony contract that collected ETH first`);
    console.log(`   - Then the token was deployed and liquidity was added`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

