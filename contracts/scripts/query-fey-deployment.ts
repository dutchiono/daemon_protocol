/**
 * Query Fey Protocol deployment information to understand how Fey token was deployed
 * and how the ceremony/TGE worked
 */

import { ethers } from 'ethers';

const FEY_FACTORY_ADDRESS = '0x8eef0dc80adf57908bb1be0236c2a72a7e379c2d';
const FEY_TOKEN_ADDRESS = '0xD09cf0982A32DD6856e12d6BF2F08A822eA5D91D';

// Minimal ABI for queries
const FACTORY_ABI = [
    'function baseToken() view returns (address)',
    'event TokenCreated(address indexed tokenAddress, address indexed tokenAdmin, address indexed deployer, address pairedToken, int24 tickIfToken0IsFey)',
    'event SetBaseToken(address indexed oldBaseToken, address indexed newBaseToken)',
];

const TOKEN_ABI = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function totalSupply() view returns (uint256)',
];

async function main() {
    // Use Alchemy or public RPC
    const rpcUrl = process.env.ALCHEMY_API_KEY
        ? `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
        : 'https://mainnet.base.org';
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    console.log('Querying Fey Protocol deployment information...\n');

    // 1. Check Factory deployment
    console.log('1. Fey Factory:', FEY_FACTORY_ADDRESS);
    const factoryCode = await provider.getCode(FEY_FACTORY_ADDRESS);
    console.log('   Has code:', factoryCode !== '0x' ? 'Yes' : 'No');

    // 2. Check Fey Token deployment
    console.log('\n2. Fey Token:', FEY_TOKEN_ADDRESS);
    const tokenCode = await provider.getCode(FEY_TOKEN_ADDRESS);
    console.log('   Has code:', tokenCode !== '0x' ? 'Yes' : 'No');

    // 3. Query Factory for baseToken
    const factory = new ethers.Contract(FEY_FACTORY_ADDRESS, FACTORY_ABI, provider);
    try {
        const baseToken = await factory.baseToken();
        console.log('\n3. Factory baseToken:', baseToken);
        console.log('   Matches FEY_TOKEN_ADDRESS:', baseToken.toLowerCase() === FEY_TOKEN_ADDRESS.toLowerCase());
    } catch (error) {
        console.log('\n3. Could not query baseToken:', error instanceof Error ? error.message : error);
    }

    // 4. Get Fey Token info
    console.log('\n4. Fey Token Info:');
    try {
        const tokenContract = new ethers.Contract(FEY_TOKEN_ADDRESS, TOKEN_ABI, provider);
        const [name, symbol, totalSupply] = await Promise.all([
            tokenContract.name(),
            tokenContract.symbol(),
            tokenContract.totalSupply()
        ]);
        console.log('   Name:', name);
        console.log('   Symbol:', symbol);
        console.log('   Total Supply:', ethers.formatEther(totalSupply));
    } catch (error) {
        console.log('   Error:', error instanceof Error ? error.message : error);
    }

    // 5. Check when baseToken was set
    console.log('\n5. Checking when baseToken was set on Factory...');
    try {
        const setBaseTokenFilter = factory.filters.SetBaseToken();
        const setBaseTokenEvents = await factory.queryFilter(setBaseTokenFilter);
        console.log('   SetBaseToken events found:', setBaseTokenEvents.length);
        for (const event of setBaseTokenEvents) {
            if ('args' in event && event.args) {
                const args = event.args as any;
                console.log(`   Block ${event.blockNumber}: ${args.oldBaseToken} -> ${args.newBaseToken}`);
                if (args.newBaseToken.toLowerCase() === FEY_TOKEN_ADDRESS.toLowerCase()) {
                    console.log(`   ✅ FEY token set as baseToken at block ${event.blockNumber}`);
                    console.log(`   Transaction: ${event.transactionHash}`);
                }
            }
        }
    } catch (error) {
        console.log('   Error querying SetBaseToken events:', error instanceof Error ? error.message : error);
    }

    // 6. Check if Fey token was deployed by Factory
    console.log('\n6. Checking if Fey token was deployed by Factory...');
    try {
        // Get current block
        const currentBlock = await provider.getBlockNumber();
        // Try querying in smaller chunks
        const chunkSize = 50000;
        let allEvents: any[] = [];
        let fromBlock = 0;

        console.log('   Querying TokenCreated events in chunks...');
        while (fromBlock < currentBlock) {
            const toBlock = Math.min(fromBlock + chunkSize, currentBlock);
            try {
                const filter = factory.filters.TokenCreated();
                const events = await factory.queryFilter(filter, fromBlock, toBlock);
                allEvents = allEvents.concat(events);
                console.log(`   Blocks ${fromBlock}-${toBlock}: ${events.length} tokens found`);
                fromBlock = toBlock + 1;
            } catch (error) {
                console.log(`   Error querying blocks ${fromBlock}-${toBlock}, skipping...`);
                fromBlock = toBlock + 1;
            }
        }

        console.log('   Total tokens deployed via Factory:', allEvents.length);

        // Check if Fey token is in the list
        const feyTokenEvent = allEvents.find(e => {
            if ('args' in e && e.args) {
                const args = e.args as any;
                return args &&
                    typeof args.tokenAddress === 'string' &&
                    args.tokenAddress.toLowerCase() === FEY_TOKEN_ADDRESS.toLowerCase();
            }
            return false;
        });

        if (feyTokenEvent && 'args' in feyTokenEvent) {
            console.log('   ✅ FEY token WAS deployed via Factory');
            console.log('   Block:', feyTokenEvent.blockNumber);
            console.log('   Transaction:', feyTokenEvent.transactionHash);
            const args = feyTokenEvent.args as any;
            console.log('   Token Admin:', args.tokenAdmin);
            console.log('   Deployer:', args.deployer);
            console.log('   Paired Token:', args.pairedToken);
        } else {
            console.log('   ❌ FEY token was NOT deployed via Factory');
            console.log('   This means FEY token was deployed separately, then set as baseToken');
        }

        // Show first few tokens for reference
        if (allEvents.length > 0) {
            console.log('\n   First 3 tokens deployed via Factory:');
            for (let i = 0; i < Math.min(3, allEvents.length); i++) {
                const event = allEvents[i];
                if ('args' in event && event.args) {
                    const args = event.args as any;
                    console.log(`   ${i + 1}. ${args.tokenAddress} (admin: ${args.tokenAdmin}, block: ${event.blockNumber})`);
                }
            }
        }
    } catch (error) {
        console.log('   Error:', error instanceof Error ? error.message : error);
    }

    console.log('\n✅ Query complete. Check Basescan for detailed transaction history:');
    console.log(`   Factory: https://basescan.org/address/${FEY_FACTORY_ADDRESS}`);
    console.log(`   Fey Token: https://basescan.org/address/${FEY_TOKEN_ADDRESS}`);
    console.log(`\n   To understand the ceremony, check:`);
    console.log(`   - Factory creation transaction`);
    console.log(`   - Fey token creation transaction`);
    console.log(`   - When baseToken was set on Factory`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
