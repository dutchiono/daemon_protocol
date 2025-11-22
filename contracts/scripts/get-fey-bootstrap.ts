import { ethers } from 'ethers';

const FEY_FACTORY_ADDRESS = '0x8eef0dc80adf57908bb1be0236c2a72a7e379c2d';

async function main() {
    const rpcUrl = process.env.ALCHEMY_API_KEY
        ? `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
        : 'https://mainnet.base.org';
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    const factory = new ethers.Contract(
        FEY_FACTORY_ADDRESS,
        ['function bootstrap() view returns (address)'],
        provider
    );

    const bootstrap = await factory.bootstrap();
    console.log('Fey Factory Bootstrap Address:', bootstrap);
    console.log('\nCheck this address on Basescan to see:');
    console.log(`- If it collected ETH during ceremony`);
    console.log(`- What transactions it made`);
    console.log(`- If it deployed FEY token`);
    console.log(`\nhttps://basescan.org/address/${bootstrap}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

