import { ethers } from 'ethers';

const BOOTSTRAP_ADDRESS = '0xbC13A34E6fEd856e66a153a1ef8e2903E8963924';

async function main() {
    const rpcUrl = process.env.ALCHEMY_API_KEY
        ? `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
        : 'https://mainnet.base.org';
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    console.log('Getting Bootstrap Transaction Details...\n');

    const txCount = await provider.getTransactionCount(BOOTSTRAP_ADDRESS);
    console.log(`Bootstrap has ${txCount} transactions\n`);

    // Get the actual transactions by checking blocks
    // Since we know there are only 4, we can find them by checking recent blocks
    const currentBlock = await provider.getBlockNumber();

    console.log('Scanning recent blocks for bootstrap transactions...');
    console.log('(This may take a moment)\n');

    // Check last 1000 blocks for transactions from bootstrap
    const fromBlock = Math.max(0, currentBlock - 1000);
    let foundTxs = 0;

    for (let blockNum = currentBlock; blockNum >= fromBlock && foundTxs < txCount; blockNum--) {
        try {
            const block = await provider.getBlock(blockNum, true);
            if (block && block.transactions) {
                for (const txHash of block.transactions) {
                    if (typeof txHash === 'string') {
                        const tx = await provider.getTransaction(txHash);
                        if (tx && tx.from?.toLowerCase() === BOOTSTRAP_ADDRESS.toLowerCase()) {
                            foundTxs++;
                            console.log(`Transaction ${foundTxs}:`);
                            console.log(`   Hash: ${tx.hash}`);
                            console.log(`   Block: ${blockNum}`);
                            console.log(`   To: ${tx.to || 'Contract Creation'}`);
                            console.log(`   Value: ${ethers.formatEther(tx.value)} ETH`);
                            console.log(`   Data: ${tx.data.substring(0, 20)}...`);
                            console.log('');

                            // Get receipt to see what happened
                            try {
                                const receipt = await provider.getTransactionReceipt(tx.hash);
                                if (receipt) {
                                    console.log(`   Status: ${receipt.status === 1 ? 'Success' : 'Failed'}`);
                                    console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
                                    console.log(`   Logs: ${receipt.logs.length}`);
                                    console.log('');
                                }
                            } catch (e) {
                                // Ignore
                            }
                        }
                    }
                }
            }
        } catch (error) {
            // Continue
        }
    }

    if (foundTxs === 0) {
        console.log('Could not find transactions in recent blocks.');
        console.log('Bootstrap transactions may be older.');
        console.log(`\nCheck on Basescan: https://basescan.org/address/${BOOTSTRAP_ADDRESS}`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

