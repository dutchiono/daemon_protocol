/**
 * @title Message Validator
 * @notice Validates messages according to protocol rules
 */

import { ethers } from 'ethers';
import IdRegistryABI from '../../../contracts/artifacts/contracts/IdRegistry.sol/IdRegistry.json' with { type: 'json' };
import KeyRegistryABI from '../../../contracts/artifacts/contracts/KeyRegistry.sol/KeyRegistry.json' with { type: 'json' };
import { logger } from './logger.js';
import type { Config } from './config.js';
import type { Message, ValidationResult } from './types.js';

export class MessageValidator {
  private provider: ethers.JsonRpcProvider;
  private config: Config;
  private idRegistry: ethers.Contract | null = null;
  private keyRegistry: ethers.Contract | null = null;

  constructor(config: Config) {
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);

    // Initialize IdRegistry contract if address is provided
    if (process.env.ID_REGISTRY_ADDRESS) {
      this.idRegistry = new ethers.Contract(
        process.env.ID_REGISTRY_ADDRESS,
        IdRegistryABI.abi,
        this.provider
      );
      logger.info(`IdRegistry contract initialized at ${process.env.ID_REGISTRY_ADDRESS}`);
    } else {
      logger.warn('ID_REGISTRY_ADDRESS not set. DID verification will be skipped.');
    }

    // Initialize KeyRegistry contract if address is provided
    if (process.env.KEY_REGISTRY_ADDRESS) {
      this.keyRegistry = new ethers.Contract(
        process.env.KEY_REGISTRY_ADDRESS,
        KeyRegistryABI.abi,
        this.provider
      );
      logger.info(`KeyRegistry contract initialized at ${process.env.KEY_REGISTRY_ADDRESS}`);
    } else {
      logger.warn('KEY_REGISTRY_ADDRESS not set. Key verification will be skipped.');
    }
  }

  async validate(message: Message): Promise<ValidationResult> {
    // Check message structure
    if (!message.hash || !message.did || !message.text || !message.timestamp) {
      return { valid: false, error: 'Missing required fields' };
    }

    // Verify hash matches content
    const calculatedHash = this.calculateHash(message);
    if (calculatedHash !== message.hash) {
      return { valid: false, error: 'Invalid message hash' };
    }

    // Check DID is valid (extract numeric ID and verify on-chain)
    const didValid = await this.verifyDid(message.did);
    if (!didValid) {
      return { valid: false, error: 'DID does not exist or is invalid' };
    }

    // Verify signature
    const signatureValid = await this.verifySignature(message);
    if (!signatureValid) {
      return { valid: false, error: 'Invalid signature' };
    }

    // Check timestamp (must be recent, within 24 hours)
    const now = Math.floor(Date.now() / 1000);
    const messageTime = message.timestamp;
    const timeDiff = Math.abs(now - messageTime);
    if (timeDiff > 24 * 60 * 60) {
      return { valid: false, error: 'Message timestamp too old' };
    }

    // Check text length (280 chars for casts)
    if (message.text.length > 280) {
      return { valid: false, error: 'Message too long' };
    }

    // Check parent hash exists (if reply)
    if (message.parentHash) {
      // Would need to check if parent exists in database
      // For now, just validate format
      if (!/^0x[a-fA-F0-9]{64}$/.test(message.parentHash)) {
        return { valid: false, error: 'Invalid parent hash format' };
      }
    }

    return { valid: true };
  }

  private calculateHash(message: Message): string {
    // Hash message content (excluding hash and signature)
    const content = JSON.stringify({
      did: message.did,
      text: message.text,
      timestamp: message.timestamp,
      parentHash: message.parentHash,
      mentions: message.mentions || [],
      embeds: message.embeds || []
    });

    return ethers.keccak256(ethers.toUtf8Bytes(content));
  }

  private async verifyDid(did: string): Promise<boolean> {
    if (!this.idRegistry) {
      logger.warn('IdRegistry not initialized. Skipping DID verification.');
      return true; // Allow if contract not set (for testing)
    }

    // Extract numeric ID from DID: did:daemon:123 -> 123
    const match = did.match(/^did:daemon:(\d+)$/);
    if (!match || !match[1]) {
      logger.warn(`Invalid DID format: ${did}`);
      return false;
    }

    const numericId = parseInt(match[1], 10);
    if (isNaN(numericId) || numericId <= 0) {
      logger.warn(`Invalid numeric ID in DID: ${did}`);
      return false;
    }

    try {
      // Check if the numeric ID exists in the IdRegistry contract
      return await this.idRegistry.fidExists(numericId);
    } catch (error) {
      logger.error(`Error verifying DID ${did} (numeric ID: ${numericId}) on-chain: ${error}`);
      return false;
    }
  }

  private async verifySignature(message: Message): Promise<boolean> {
    if (!this.keyRegistry || !message.signature || !message.signingKey) {
      logger.warn('KeyRegistry not initialized or signature missing. Skipping signature verification.');
      return true; // Allow if contract not set (for testing)
    }

    try {
      // Check if key is valid in KeyRegistry
      const isValid = await this.keyRegistry.isValidKey(message.signingKey);
      if (!isValid) {
        logger.warn(`Signing key ${message.signingKey} is not valid for DID ${message.did}`);
        return false;
      }

      // TODO: Verify Ed25519 signature using a library like @noble/ed25519
      // For now, if key is valid in registry, we trust the signature
      // In production, you would:
      // 1. Reconstruct the message hash
      // 2. Verify the Ed25519 signature using the public key
      // Example: ed25519.verify(message.signature, messageHash, message.signingKey)

      return true;
    } catch (error) {
      logger.error(`Error verifying signature: ${error}`);
      return false;
    }
  }
}

