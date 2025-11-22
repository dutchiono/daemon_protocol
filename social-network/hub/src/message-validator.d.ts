/**
 * @title Message Validator
 * @notice Validates messages according to protocol rules
 */
import type { Config } from './config.js';
import type { Message, ValidationResult } from './types.js';
export declare class MessageValidator {
    private provider;
    private config;
    private idRegistry;
    private keyRegistry;
    constructor(config: Config);
    validate(message: Message): Promise<ValidationResult>;
    private calculateHash;
    private verifyFid;
    private verifySignature;
}
//# sourceMappingURL=message-validator.d.ts.map