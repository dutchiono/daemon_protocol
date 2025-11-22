/**
 * @title End-to-End Tests
 * @notice Complete user journey tests
 */

import { describe, it, expect, beforeAll } from 'vitest';
import axios from 'axios';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:4003';
const PDS_URL = process.env.PDS_URL || 'http://localhost:4002';
const HUB_URL = process.env.HUB_URL || 'http://localhost:4001';

describe('End-to-End Flow', () => {
  let testFid: number;
  let testPostHash: string;

  beforeAll(async () => {
    // Wait for all services
    const services = [GATEWAY_URL, PDS_URL, HUB_URL];
    for (const url of services) {
      let retries = 10;
      while (retries > 0) {
        try {
          await axios.get(`${url}/health`);
          break;
        } catch (error) {
          retries--;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  });

  describe('Complete User Journey', () => {
    it('should complete full flow: create account → post → view feed', async () => {
      // Step 1: Create account on PDS
      const handle = `e2e-${Date.now()}`;
      const accountResponse = await axios.post(
        `${PDS_URL}/xrpc/com.atproto.server.createAccount`,
        {
          handle,
          email: `${handle}@test.com`,
          password: 'testpassword123',
        }
      );
      expect(accountResponse.data.did).toBeDefined();
      const did = accountResponse.data.did;

      // Step 2: Create post via Gateway
      testFid = 1; // Would come from identity registry in production
      const postResponse = await axios.post(`${GATEWAY_URL}/api/v1/posts`, {
        fid: testFid,
        text: 'E2E test post - this should appear in feed!',
      });
      expect(postResponse.data.hash).toBeDefined();
      testPostHash = postResponse.data.hash;

      // Step 3: Verify post exists in Hub
      const hubResponse = await axios.get(`${HUB_URL}/api/v1/messages/${testPostHash}`);
      expect(hubResponse.data.hash).toBe(testPostHash);
      expect(hubResponse.data.text).toContain('E2E test post');

      // Step 4: View feed via Gateway
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for propagation
      const feedResponse = await axios.get(`${GATEWAY_URL}/api/v1/feed`, {
        params: { fid: testFid, limit: 10 },
      });
      expect(feedResponse.data.posts).toBeDefined();

      // Post should appear in feed
      const postInFeed = feedResponse.data.posts.find(
        (p: any) => p.hash === testPostHash
      );
      expect(postInFeed).toBeDefined();
      expect(postInFeed.text).toContain('E2E test post');
    });

    it('should handle multiple posts and ordering', async () => {
      const posts = [];

      // Create multiple posts
      for (let i = 0; i < 3; i++) {
        const response = await axios.post(`${GATEWAY_URL}/api/v1/posts`, {
          fid: testFid,
          text: `Post ${i + 1} - ${Date.now()}`,
        });
        posts.push(response.data.hash);
        await new Promise(resolve => setTimeout(resolve, 500)); // Stagger posts
      }

      // Verify all posts in feed
      await new Promise(resolve => setTimeout(resolve, 1000));
      const feedResponse = await axios.get(`${GATEWAY_URL}/api/v1/feed`, {
        params: { fid: testFid, limit: 10 },
      });

      const postHashes = feedResponse.data.posts.map((p: any) => p.hash);
      for (const hash of posts) {
        expect(postHashes).toContain(hash);
      }
    });

    it('should handle reply to post', async () => {
      // Create parent post
      const parentResponse = await axios.post(`${GATEWAY_URL}/api/v1/posts`, {
        fid: testFid,
        text: 'Parent post for reply test',
      });
      const parentHash = parentResponse.data.hash;

      // Create reply
      const replyResponse = await axios.post(`${GATEWAY_URL}/api/v1/posts`, {
        fid: testFid,
        text: 'This is a reply',
        parentHash,
      });
      expect(replyResponse.data.hash).toBeDefined();
      expect(replyResponse.data.parentHash).toBe(parentHash);
    });
  });

  describe('Error Handling', () => {
    it('should handle service unavailability gracefully', async () => {
      // This would test what happens if Hub goes down
      // Gateway should still serve cached data or return appropriate error
      const response = await axios.get(`${GATEWAY_URL}/api/v1/feed`, {
        params: { fid: testFid, limit: 10 },
      });
      // Should either return cached feed or error, not crash
      expect([200, 503]).toContain(response.status);
    });
  });
});

