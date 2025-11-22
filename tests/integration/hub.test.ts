/**
 * @title Hub Integration Tests
 * @notice Comprehensive tests for Hub node
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import axios from 'axios';

const HUB_URL = process.env.HUB_URL || 'http://localhost:4001';

describe('Hub Node', () => {
  let testMessage: any;

  beforeAll(async () => {
    // Wait for hub to be ready
    let retries = 10;
    while (retries > 0) {
      try {
        await axios.get(`${HUB_URL}/health`);
        break;
      } catch (error) {
        retries--;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  });

  describe('Health Check', () => {
    it('should respond to health check', async () => {
      const response = await axios.get(`${HUB_URL}/health`);
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('ok');
      expect(response.data.nodeId).toBeDefined();
    });
  });

  describe('Message Submission', () => {
    it('should accept valid message', async () => {
      const message = {
        hash: '0x' + Math.random().toString(16).substring(2, 66),
        fid: 1,
        text: 'Test message',
        messageType: 'cast',
        timestamp: Math.floor(Date.now() / 1000),
        signature: '0x' + '0'.repeat(128), // Placeholder
      };

      const response = await axios.post(`${HUB_URL}/api/v1/messages`, message);
      expect(response.status).toBe(200);
      expect(response.data.hash).toBe(message.hash);
      testMessage = message;
    });

    it('should reject message with invalid hash', async () => {
      const message = {
        hash: 'invalid',
        fid: 1,
        text: 'Test',
        timestamp: Math.floor(Date.now() / 1000),
      };

      await expect(
        axios.post(`${HUB_URL}/api/v1/messages`, message)
      ).rejects.toThrow();
    });

    it('should reject message without required fields', async () => {
      const message = {
        fid: 1,
        // Missing text, timestamp, etc.
      };

      await expect(
        axios.post(`${HUB_URL}/api/v1/messages`, message)
      ).rejects.toThrow();
    });

    it('should reject message over 280 characters', async () => {
      const message = {
        hash: '0x' + Math.random().toString(16).substring(2, 66),
        fid: 1,
        text: 'a'.repeat(281),
        timestamp: Math.floor(Date.now() / 1000),
      };

      await expect(
        axios.post(`${HUB_URL}/api/v1/messages`, message)
      ).rejects.toThrow();
    });
  });

  describe('Message Retrieval', () => {
    it('should retrieve message by hash', async () => {
      if (!testMessage) return;

      const response = await axios.get(`${HUB_URL}/api/v1/messages/${testMessage.hash}`);
      expect(response.status).toBe(200);
      expect(response.data.hash).toBe(testMessage.hash);
      expect(response.data.text).toBe(testMessage.text);
    });

    it('should return 404 for non-existent message', async () => {
      const fakeHash = '0x' + '0'.repeat(64);
      await expect(
        axios.get(`${HUB_URL}/api/v1/messages/${fakeHash}`)
      ).rejects.toThrow();
    });

    it('should list messages', async () => {
      const response = await axios.get(`${HUB_URL}/api/v1/messages?limit=10`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.messages)).toBe(true);
    });
  });

  describe('Peer Management', () => {
    it('should list connected peers', async () => {
      const response = await axios.get(`${HUB_URL}/api/v1/peers`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.peers)).toBe(true);
    });
  });

  describe('Sync Status', () => {
    it('should return sync status', async () => {
      const response = await axios.get(`${HUB_URL}/api/v1/sync/status`);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('synced');
      expect(response.data).toHaveProperty('peers');
    });
  });
});

