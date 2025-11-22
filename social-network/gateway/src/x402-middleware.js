/**
 * @title x402 Middleware
 * @notice Middleware for x402 payment handling with StorageRegistry integration
 */
import { ethers } from 'ethers';
import { logger } from '../../../daemon-node/src/logger.js';
import StorageRegistryABI from '../../../contracts/artifacts/contracts/StorageRegistry.sol/StorageRegistry.json';
import IdRegistryABI from '../../../contracts/artifacts/contracts/IdRegistry.sol/IdRegistry.json';
export function x402Middleware(config) {
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    let storageRegistry = null;
    let idRegistry = null;
    // Initialize contracts if addresses are provided
    if (process.env.STORAGE_REGISTRY_ADDRESS) {
        storageRegistry = new ethers.Contract(process.env.STORAGE_REGISTRY_ADDRESS, StorageRegistryABI.abi, provider);
        logger.info(`StorageRegistry contract initialized at ${process.env.STORAGE_REGISTRY_ADDRESS}`);
    }
    if (process.env.ID_REGISTRY_ADDRESS) {
        idRegistry = new ethers.Contract(process.env.ID_REGISTRY_ADDRESS, IdRegistryABI.abi, provider);
    }
    return async (req, res, next) => {
        // Check if endpoint requires payment/storage
        if (!requiresPayment(req.path)) {
            return next();
        }
        // Check for valid access token
        const token = req.headers['x-access-token'];
        if (token) {
            // Verify token
            const isValid = await verifyAccessToken(token, config);
            if (isValid) {
                return next();
            }
        }
        // Check StorageRegistry if available
        if (storageRegistry && idRegistry) {
            try {
                // Try to get FID from request (could be in header, query, or body)
                const fid = getFidFromRequest(req);
                if (fid) {
                    // Check if testnet mode (free storage)
                    const testnetMode = await storageRegistry.testnetMode();
                    if (testnetMode) {
                        // Free on testnet - allow access
                        logger.debug(`Testnet mode: allowing free access for FID ${fid}`);
                        return next();
                    }
                    // Check storage units
                    const storageUnits = await storageRegistry.getStorageUnits(fid);
                    if (storageUnits > 0) {
                        // User has storage - allow access
                        logger.debug(`FID ${fid} has ${storageUnits} storage units - allowing access`);
                        return next();
                    }
                }
            }
            catch (error) {
                logger.error(`Error checking StorageRegistry: ${error}`);
                // Fall through to payment request
            }
        }
        // Generate payment request
        const paymentRequest = await generatePaymentRequest(req.path, config);
        // Return 402 with payment information
        res.status(402).json({
            error: 'Payment Required',
            payment: {
                amount: paymentRequest.amount,
                currency: paymentRequest.currency,
                recipient: paymentRequest.recipient,
                nonce: paymentRequest.nonce,
                expiry: paymentRequest.expiry
            },
            instructions: {
                method: 'POST',
                url: `${config.x402ServiceUrl}/api/v1/payments/verify`,
                body: {
                    transactionHash: '<transaction-hash>',
                    nonce: paymentRequest.nonce
                }
            }
        });
    };
}
function getFidFromRequest(req) {
    // Try to get FID from various sources
    const fidHeader = req.headers['x-fid'];
    if (fidHeader) {
        const fid = parseInt(fidHeader, 10);
        if (!isNaN(fid))
            return fid;
    }
    const fidQuery = req.query.fid;
    if (fidQuery) {
        const fid = parseInt(fidQuery, 10);
        if (!isNaN(fid))
            return fid;
    }
    const fidBody = req.body?.fid;
    if (fidBody) {
        const fid = typeof fidBody === 'number' ? fidBody : parseInt(fidBody, 10);
        if (!isNaN(fid))
            return fid;
    }
    return null;
}
function requiresPayment(path) {
    // Define which endpoints require payment
    const paidEndpoints = [
        '/api/v1/feed',
        '/api/v1/posts',
        '/api/v1/search'
    ];
    return paidEndpoints.some(endpoint => path.startsWith(endpoint));
}
async function verifyAccessToken(token, config) {
    try {
        // Verify token with x402 service
        const response = await fetch(`${config.x402ServiceUrl}/api/v1/payments/verify-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });
        return response.ok;
    }
    catch (error) {
        return false;
    }
}
async function generatePaymentRequest(path, config) {
    // Calculate payment amount based on endpoint
    const pricing = {
        '/api/v1/feed': '0.001',
        '/api/v1/posts': '0.002',
        '/api/v1/search': '0.0005'
    };
    const amount = pricing[path] || '0.001';
    const nonce = generateNonce();
    const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes
    return {
        amount,
        currency: 'DAEMON',
        recipient: config.x402ServiceUrl, // Would be actual payment recipient
        nonce,
        expiry
    };
}
function generateNonce() {
    return Buffer.from(crypto.randomUUID()).toString('base64');
}
//# sourceMappingURL=x402-middleware.js.map