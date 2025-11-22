/**
 * @title PDS Integration Tests
 * @notice Comprehensive tests for PDS node
 */

import { describe, it, expect, beforeAll } from 'vitest';
import axios from 'axios';

const PDS_URL = process.env.PDS_URL || 'http://localhost:4002';

describe('PDS Node', () => {
  beforeAll(async () => {
    // Wait for PDS to be ready
    let retries = 10;
    while (retries > 0) {
      try {
        await axios.get(`${PDS_URL}/health`);
        break;
      } catch (error) {
        retries--;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  });

  describe('Health Check', () => {
    it('should respond to health check', async () => {
      const response = await axios.get(`${PDS_URL}/health`);
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('ok');
    });
  });

  describe('Server Description', () => {
    it('should describe server capabilities', async () => {
      const response = await axios.get(`${PDS_URL}/xrpc/com.atproto.server.describeServer`);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('availableUserDomains');
    });
  });

  describe('Account Creation', () => {
    it('should create new account', async () => {
      const handle = `test-${Date.now()}`;
      const account = {
        handle,
        email: `${handle}@test.com`,
        password: 'testpassword123',
      };

      const response = await axios.post(
        `${PDS_URL}/xrpc/com.atproto.server.createAccount`,
        account
      );
      expect(response.status).toBe(200);
      expect(response.data.did).toBeDefined();
      expect(response.data.handle).toBe(handle);
    });

    it('should reject duplicate handle', async () => {
      const handle = `test-${Date.now()}`;
      const account = {
        handle,
        email: `${handle}@test.com`,
        password: 'testpassword123',
      };

      // Create first account
      await axios.post(`${PDS_URL}/xrpc/com.atproto.server.createAccount`, account);

      // Try to create duplicate
      await expect(
        axios.post(`${PDS_URL}/xrpc/com.atproto.server.createAccount`, account)
      ).rejects.toThrow();
    });

    it('should reject invalid handle', async () => {
      const account = {
        handle: 'invalid handle!', // Invalid characters
        email: 'test@test.com',
        password: 'testpassword123',
      };

      await expect(
        axios.post(`${PDS_URL}/xrpc/com.atproto.server.createAccount`, account)
      ).rejects.toThrow();
    });
  });

  describe('Record Creation', () => {
    it('should create record', async () => {
      // First create account
      const handle = `test-${Date.now()}`;
      const account = await axios.post(
        `${PDS_URL}/xrpc/com.atproto.server.createAccount`,
        {
          handle,
          email: `${handle}@test.com`,
          password: 'testpassword123',
        }
      );

      const record = {
        repo: account.data.did,
        collection: 'app.bsky.feed.post',
        record: {
          text: 'Test post',
          createdAt: new Date().toISOString(),
        },
      };

      const response = await axios.post(
        `${PDS_URL}/xrpc/com.atproto.repo.createRecord`,
        record
      );
      expect(response.status).toBe(200);
      expect(response.data.uri).toBeDefined();
      expect(response.data.cid).toBeDefined();
    });
  });

  describe('Record Listing', () => {
    it('should list records', async () => {
      const handle = `test-${Date.now()}`;
      const account = await axios.post(
        `${PDS_URL}/xrpc/com.atproto.server.createAccount`,
        {
          handle,
          email: `${handle}@test.com`,
          password: 'testpassword123',
        }
      );

      const response = await axios.get(
        `${PDS_URL}/xrpc/com.atproto.repo.listRecords`,
        {
          params: {
            repo: account.data.did,
            collection: 'app.bsky.feed.post',
          },
        }
      );
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.records)).toBe(true);
    });
  });
});

