/**
 * @title Database Unit Tests
 * @notice Test database operations
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Database } from '../../social-network/hub/src/database';
import type { Message } from '../../social-network/hub/src/types';

const TEST_DB_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost/test';

describe('Database', () => {
  let db: Database;

  beforeAll(() => {
    db = new Database(TEST_DB_URL);
  });

  describe('Message Storage', () => {
    it('should store message', async () => {
      const message: Message = {
        hash: '0x' + 'a'.repeat(64),
        fid: 1,
        text: 'Test message',
        messageType: 'cast',
        timestamp: Math.floor(Date.now() / 1000),
        deleted: false,
      };

      await expect(db.storeMessage(message)).resolves.not.toThrow();
    });

    it('should retrieve stored message', async () => {
      const message: Message = {
        hash: '0x' + 'b'.repeat(64),
        fid: 1,
        text: 'Retrieval test',
        messageType: 'cast',
        timestamp: Math.floor(Date.now() / 1000),
        deleted: false,
      };

      await db.storeMessage(message);
      const messages = await db.getMessages(10, 0);

      const found = messages.find(m => m.hash === message.hash);
      expect(found).toBeDefined();
      expect(found?.text).toBe(message.text);
    });

    it('should handle duplicate message (idempotent)', async () => {
      const message: Message = {
        hash: '0x' + 'c'.repeat(64),
        fid: 1,
        text: 'Duplicate test',
        messageType: 'cast',
        timestamp: Math.floor(Date.now() / 1000),
        deleted: false,
      };

      // Store twice
      await db.storeMessage(message);
      await expect(db.storeMessage(message)).resolves.not.toThrow();
    });
  });

  describe('Message Retrieval', () => {
    it('should respect limit', async () => {
      const messages = await db.getMessages(5, 0);
      expect(messages.length).toBeLessThanOrEqual(5);
    });

    it('should respect offset', async () => {
      const first = await db.getMessages(5, 0);
      const second = await db.getMessages(5, 5);

      // Should be different messages
      expect(first[0]?.hash).not.toBe(second[0]?.hash);
    });
  });
});

