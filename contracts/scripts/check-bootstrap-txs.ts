import { ethers } from 'ethers';

const BOOTSTRAP_ADDRESS = '0xbC13A34E6fEd856e66a153a1ef8e2903E8963924';
const FEY_FACTORY_ADDRESS = '0x8eef0dc80adf57908bb1be0236c2a72a7e379c2d';
const FEY_TOKEN_ADDRESS = '0xD09cf0982A32DD6856e12d6BF2F08A822eA5D91D';

async function main() {
    const rpcUrl = process.env.ALCHEMY_API_KEY
        ? `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
        : 'https://mainnet.base.org';
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    console.log('Checking Bootstrap Transactions...\n');

    // Get bootstrap transaction count
    const txCount = await provider.getTransactionCount(BOOTSTRAP_ADDRESS);
    console.log(`Bootstrap has ${txCount} transactions\n`);

    // Get transactions from bootstrap address
    // We need to scan blocks to find transactions FROM bootstrap
    // Or check if bootstrap received transactions (ETH contributions)

    // Check recent blocks for transactions TO bootstrap (ETH contributions)
    console.log('Checking for transactions TO bootstrap (ETH contributions)...');
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 50000); // Check last 50k blocks

    try {
        // Get logs for ETH transfers to bootstrap
        const logs = await provider.getLogs({
            address: undefined, // All addresses
            topics: [
                ethers.id('Transfer(address,address,uint256)'), // Transfer event
                null, // from
                ethers.zeroPadValue(BOOTSTRAP_ADDRESS, 32), // to bootstrap
            ],
            fromBlock,
            toBlock: currentBlock,
        });

        console.log(`Found ${logs.length} Transfer events to bootstrap`);

        // Also check native ETH transfers by looking at transaction receipts
        // This is harder, so let's check if bootstrap has any contract interactions

    } catch (error) {
        console.log(`Error: ${error instanceof Error ? error.message : error}`);
    }

    // Check if bootstrap deployed FEY token
    console.log('\nChecking if bootstrap deployed FEY token...');
    try {
        // Get the block where FEY token was created
        // We can check the token's first transaction or check Factory events

        // Try to get token creation by checking if it was created by Factory
        const factory = new ethers.Contract(
            FEY_FACTORY_ADDRESS,
            ['event TokenCreated(address indexed tokenAddress, address indexed tokenAdmin, address indexed deployer, address pairedToken, int24 tickIfToken0IsFey)'],
            provider
        );

        // Query with token address filter - this should be more efficient
        const filter = factory.filters.TokenCreated(FEY_TOKEN_ADDRESS);

        // Try smaller chunks
        let found = false;
        for (let i = 0; i < 100; i++) {
            const startBlock = Math.max(0, currentBlock - (i + 1) * 10000);
            const endBlock = currentBlock - i * 10000;

            try {
                const events = await factory.queryFilter(filter, startBlock, endBlock);
                if (events.length > 0) {
                    found = true;
                    const event = events[0];
                    if ('args' in event && event.args) {
                        const args = event.args as any;
                        console.log(`✅ FEY token deployed via Factory at block ${event.blockNumber}`);
                        console.log(`   Transaction: ${event.transactionHash}`);
                        console.log(`   Deployer: ${args.deployer}`);
                        console.log(`   Admin: ${args.tokenAdmin}`);
                        console.log(`   Paired Token: ${args.pairedToken}`);

                        // Check if deployer is bootstrap
                        if (args.deployer?.toLowerCase() === BOOTSTRAP_ADDRESS.toLowerCase()) {
                            console.log(`   ✅ Bootstrap deployed FEY token!`);
                        }
                    }
                    break;
                }
            } catch (err) {
                // Continue to next chunk
            }
        }

        if (!found) {
            console.log('Could not find FEY token deployment via Factory');
        }
    } catch (error) {
        console.log(`Error: ${error instanceof Error ? error.message : error}`);
    }

    console.log('\n📋 Summary:');
    console.log(`   Bootstrap address: ${BOOTSTRAP_ADDRESS}`);
    console.log(`   Check on Basescan: https://basescan.org/address/${BOOTSTRAP_ADDRESS}`);
    console.log(`   Look for:`);
    console.log(`   - Transactions FROM bootstrap (what it did)`);
    console.log(`   - Transactions TO bootstrap (ETH contributions)`);
    console.log(`   - Contract interactions`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

