/**
 * @title x402 Middleware
 * @notice Middleware for x402 payment handling with StorageRegistry integration
 */
import { Request, Response, NextFunction } from 'express';
import type { Config } from './config.js';
export declare function x402Middleware(config: Config): (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=x402-middleware.d.ts.map