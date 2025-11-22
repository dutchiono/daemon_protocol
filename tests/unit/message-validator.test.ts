/**
 * @title Message Validator Unit Tests
 * @notice Test message validation logic
 */

import { describe, it, expect } from 'vitest';
import { MessageValidator } from '../../social-network/hub/src/message-validator';
import type { Message } from '../../social-network/hub/src/types';

describe('MessageValidator', () => {
  const validator = new MessageValidator({
    port: 4001,
    databaseUrl: 'postgresql://test',
    nodeId: 'test-node',
    peers: [],
    rpcUrl: 'https://sepolia.base.org',
    chainId: 84532,
  });

  describe('Message Structure Validation', () => {
    it('should accept valid message', async () => {
      const message: Message = {
        hash: '0x' + 'a'.repeat(64),
        fid: 1,
        text: 'Valid message',
        messageType: 'cast',
        timestamp: Math.floor(Date.now() / 1000),
        deleted: false,
      };

      const result = await validator.validate(message);
      expect(result.valid).toBe(true);
    });

    it('should reject message without hash', async () => {
      const message: any = {
        fid: 1,
        text: 'Missing hash',
        timestamp: Math.floor(Date.now() / 1000),
      };

      const result = await validator.validate(message);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Missing required fields');
    });

    it('should reject message without fid', async () => {
      const message: any = {
        hash: '0x' + 'a'.repeat(64),
        text: 'Missing fid',
        timestamp: Math.floor(Date.now() / 1000),
      };

      const result = await validator.validate(message);
      expect(result.valid).toBe(false);
    });

    it('should reject message without text', async () => {
      const message: any = {
        hash: '0x' + 'a'.repeat(64),
        fid: 1,
        timestamp: Math.floor(Date.now() / 1000),
      };

      const result = await validator.validate(message);
      expect(result.valid).toBe(false);
    });

    it('should reject message without timestamp', async () => {
      const message: any = {
        hash: '0x' + 'a'.repeat(64),
        fid: 1,
        text: 'Missing timestamp',
      };

      const result = await validator.validate(message);
      expect(result.valid).toBe(false);
    });
  });

  describe('Message Content Validation', () => {
    it('should reject message over 280 characters', async () => {
      const message: Message = {
        hash: '0x' + 'a'.repeat(64),
        fid: 1,
        text: 'a'.repeat(281),
        messageType: 'cast',
        timestamp: Math.floor(Date.now() / 1000),
        deleted: false,
      };

      const result = await validator.validate(message);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too long');
    });

    it('should accept message exactly 280 characters', async () => {
      const message: Message = {
        hash: '0x' + 'a'.repeat(64),
        fid: 1,
        text: 'a'.repeat(280),
        messageType: 'cast',
        timestamp: Math.floor(Date.now() / 1000),
        deleted: false,
      };

      const result = await validator.validate(message);
      expect(result.valid).toBe(true);
    });

    it('should reject message with timestamp too old', async () => {
      const message: Message = {
        hash: '0x' + 'a'.repeat(64),
        fid: 1,
        text: 'Old message',
        messageType: 'cast',
        timestamp: Math.floor(Date.now() / 1000) - (25 * 60 * 60), // 25 hours ago
        deleted: false,
      };

      const result = await validator.validate(message);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too old');
    });
  });

  describe('Hash Validation', () => {
    it('should reject message with invalid hash format', async () => {
      const message: any = {
        hash: 'invalid-hash',
        fid: 1,
        text: 'Test',
        timestamp: Math.floor(Date.now() / 1000),
      };

      const result = await validator.validate(message);
      // Hash validation happens in calculateHash
      expect(result.valid).toBe(false);
    });
  });
});

