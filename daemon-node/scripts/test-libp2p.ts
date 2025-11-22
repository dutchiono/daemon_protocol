
import { createLibp2p } from 'libp2p';
import { webSockets } from '@libp2p/websockets';
import { noise } from '@chainsafe/libp2p-noise';
import { mplex } from '@libp2p/mplex';
import { uPnPNAT } from '@libp2p/upnp-nat';
import { autoNAT } from '@libp2p/autonat';
import { identify } from '@libp2p/identify';
import { logger } from '../src/logger';

async function testLibp2pInit() {
    console.log('Testing Libp2p Initialization...');

    const libp2pConfig: any = {
        addresses: {
            listen: [`/ip4/0.0.0.0/tcp/0/ws`] // Use random port
        },
        transports: [webSockets()],
        connectionEncryption: [noise()],
        streamMuxers: [mplex()],
        services: {
            identify: identify(),
            autoNAT: autoNAT(),
            uPnPNAT: uPnPNAT(),
            logger: (components: any) => ({
                forComponent: (name: string) => {
                    return {
                        info: (message: string, ...args: any[]) => logger.info(message, { component: name, args }),
                        error: (message: string | Error, ...args: any[]) => {
                            if (message instanceof Error) {
                                logger.error(message.message, { component: name, args, stack: message.stack });
                            } else {
                                logger.error(message, { component: name, args });
                            }
                        },
                        warn: (message: string, ...args: any[]) => logger.warn(message, { component: name, args }),
                        debug: (message: string, ...args: any[]) => logger.debug(message, { component: name, args }),
                        trace: (message: string, ...args: any[]) => logger.debug(message, { component: name, args }),
                    };
                }
            })
        }
    };

    try {
        const node = await createLibp2p(libp2pConfig);
        console.log('✅ Libp2p initialized successfully!');
        await node.start();
        console.log('✅ Libp2p started successfully!');
        await node.stop();
        console.log('✅ Libp2p stopped successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Libp2p initialization failed:', error);
        process.exit(1);
    }
}

testLibp2pInit();
