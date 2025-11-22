import { ethers } from 'ethers';

const FEY_FACTORY_ADDRESS = '0x8eef0dc80adf57908bb1be0236c2a72a7e379c2d';
const FEY_TOKEN_ADDRESS = '0xD09cf0982A32DD6856e12d6BF2F08A822eA5D91D';
const BOOTSTRAP_ADDRESS = '0xbC13A34E6fEd856e66a153a1ef8e2903E8963924';

async function main() {
    const rpcUrl = process.env.ALCHEMY_API_KEY
        ? `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
        : 'https://mainnet.base.org';
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    console.log('Analyzing Fey Protocol Deployment...\n');

    // 1. Get Factory info
    console.log('1. Factory Contract:');
    const factory = new ethers.Contract(
        FEY_FACTORY_ADDRESS,
        [
            'function bootstrap() view returns (address)',
            'function baseToken() view returns (address)',
            'function owner() view returns (address)',
        ],
        provider
    );

    const [bootstrap, baseToken, owner] = await Promise.all([
        factory.bootstrap(),
        factory.baseToken(),
        factory.owner(),
    ]);

    console.log(`   Bootstrap: ${bootstrap}`);
    console.log(`   BaseToken: ${baseToken}`);
    console.log(`   Owner: ${owner}`);

    // 2. Get current block and query recent blocks only
    console.log('\n2. Checking recent TokenCreated events...');
    try {
        const currentBlock = await provider.getBlockNumber();
        console.log(`   Current block: ${currentBlock}`);

        // Query last 10k blocks first (much smaller range)
        const fromBlock = Math.max(0, currentBlock - 10000);
        console.log(`   Querying blocks ${fromBlock} to ${currentBlock}...`);

        const factoryWithEvents = new ethers.Contract(
            FEY_FACTORY_ADDRESS,
            ['event TokenCreated(address indexed tokenAddress, address indexed tokenAdmin, address indexed deployer, address pairedToken, int24 tickIfToken0IsFey)'],
            provider
        );

        // Query without filter first to see how many events
        const allEvents = await factoryWithEvents.queryFilter(
            factoryWithEvents.filters.TokenCreated(),
            fromBlock,
            currentBlock
        );

        console.log(`   Found ${allEvents.length} TokenCreated events in last 10k blocks`);

        // Check if FEY token is in the list
        const feyEvent = allEvents.find(e => {
            if ('args' in e && e.args) {
                const args = e.args as any;
                return args.tokenAddress?.toLowerCase() === FEY_TOKEN_ADDRESS.toLowerCase();
            }
            return false;
        });

        if (feyEvent) {
            console.log(`   ✅ FEY token WAS deployed via Factory`);
            if ('args' in feyEvent && feyEvent.args) {
                const args = feyEvent.args as any;
                console.log(`   Block: ${feyEvent.blockNumber}`);
                console.log(`   Transaction: ${feyEvent.transactionHash}`);
                console.log(`   Admin: ${args.tokenAdmin}`);
                console.log(`   Deployer: ${args.deployer}`);
                console.log(`   Paired Token: ${args.pairedToken}`);
            }
        } else {
            console.log(`   ❌ FEY token not found in last 10k blocks`);
            console.log(`   It may have been deployed earlier or separately`);
        }
    } catch (error) {
        console.log(`   Error: ${error instanceof Error ? error.message : error}`);
    }

    // 3. Check bootstrap address
    console.log('\n3. Bootstrap Address:');
    try {
        const bootstrapBalance = await provider.getBalance(BOOTSTRAP_ADDRESS);
        console.log(`   Balance: ${ethers.formatEther(bootstrapBalance)} ETH`);

        // Get transaction count to see activity
        const txCount = await provider.getTransactionCount(BOOTSTRAP_ADDRESS);
        console.log(`   Transaction count: ${txCount}`);
    } catch (error) {
        console.log(`   Error: ${error instanceof Error ? error.message : error}`);
    }

    // 4. Get Fey token info
    console.log('\n4. Fey Token:');
    try {
        const token = new ethers.Contract(
            FEY_TOKEN_ADDRESS,
            [
                'function name() view returns (string)',
                'function symbol() view returns (string)',
            ],
            provider
        );
        const [name, symbol] = await Promise.all([
            token.name(),
            token.symbol(),
        ]);
        console.log(`   ${name} (${symbol})`);
    } catch (error) {
        console.log(`   Error: ${error instanceof Error ? error.message : error}`);
    }

    console.log('\n✅ Analysis complete');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
