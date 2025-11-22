import { ethers } from 'ethers';

const FEY_FACTORY_ADDRESS = '0x8eef0dc80adf57908bb1be0236c2a72a7e379c2d';

async function main() {
    console.log('Checking Fey Factory Contract...\n');

    // Try to get contract source from Basescan API
    const basescanApiKey = process.env.BASESCAN_API_KEY || '';
    const url = `https://api.basescan.org/api?module=contract&action=getsourcecode&address=${FEY_FACTORY_ADDRESS}&apikey=${basescanApiKey}`;

    console.log('Fetching contract source from Basescan API...');
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === '1' && data.result && data.result[0]) {
            const contract = data.result[0];
            console.log(`Contract Name: ${contract.ContractName || 'Unknown'}`);
            console.log(`Compiler Version: ${contract.CompilerVersion || 'Unknown'}`);
            console.log(`Verified: ${contract.SourceCode ? 'Yes' : 'No'}`);

            if (contract.SourceCode) {
                // Search for OnlyBootstrap in source
                const source = contract.SourceCode;
                const bootstrapMatches = source.match(/OnlyBootstrap|modifier.*bootstrap|require.*bootstrap/gi);
                if (bootstrapMatches) {
                    console.log(`\nFound ${bootstrapMatches.length} references to bootstrap`);
                }

                // Try to find functions that use bootstrap
                const functionMatches = source.match(/function\s+\w+[^{]*\{[^}]*bootstrap[^}]*\}/gs);
                if (functionMatches) {
                    console.log(`\nFunctions that reference bootstrap:`);
                    functionMatches.forEach((match, i) => {
                        const funcName = match.match(/function\s+(\w+)/);
                        console.log(`  ${i + 1}. ${funcName ? funcName[1] : 'Unknown'}`);
                    });
                }
            } else {
                console.log('\nContract source not available via API');
                console.log('Check manually: https://basescan.org/address/0x8eef0dc80adf57908bb1be0236c2a72a7e379c2d#code');
            }
        } else {
            console.log('Could not fetch contract source');
            console.log('Check manually: https://basescan.org/address/0x8eef0dc80adf57908bb1be0236c2a72a7e379c2d#code');
        }
    } catch (error) {
        console.log(`Error: ${error instanceof Error ? error.message : error}`);
        console.log('\nManual check required:');
        console.log('https://basescan.org/address/0x8eef0dc80adf57908bb1be0236c2a72a7e379c2d#code');
        console.log('\nLook for:');
        console.log('1. Functions with OnlyBootstrap modifier');
        console.log('2. Functions that check msg.sender == bootstrap');
        console.log('3. What bootstrap can do that regular users cannot');
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

