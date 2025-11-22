/**
 * @title Gateway Integration Tests
 * @notice Comprehensive tests for Gateway node
 */

import { describe, it, expect, beforeAll } from 'vitest';
import axios from 'axios';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:4003';
const HUB_URL = process.env.HUB_URL || 'http://localhost:4001';
const PDS_URL = process.env.PDS_URL || 'http://localhost:4002';

describe('Gateway Node', () => {
  beforeAll(async () => {
    // Wait for gateway to be ready
    let retries = 10;
    while (retries > 0) {
      try {
        await axios.get(`${GATEWAY_URL}/health`);
        break;
      } catch (error) {
        retries--;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  });

  describe('Health Check', () => {
    it('should respond to health check', async () => {
      const response = await axios.get(`${GATEWAY_URL}/health`);
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('ok');
    });
  });

  describe('Feed Retrieval', () => {
    it('should return feed', async () => {
      const response = await axios.get(`${GATEWAY_URL}/api/v1/feed`, {
        params: { fid: 1, type: 'algorithmic', limit: 10 },
      });
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('posts');
      expect(Array.isArray(response.data.posts)).toBe(true);
    });

    it('should return chronological feed', async () => {
      const response = await axios.get(`${GATEWAY_URL}/api/v1/feed`, {
        params: { fid: 1, type: 'chronological', limit: 10 },
      });
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('posts');
    });
  });

  describe('Post Creation', () => {
    it('should create post via gateway', async () => {
      const post = {
        fid: 1,
        text: 'Test post from gateway',
      };

      const response = await axios.post(`${GATEWAY_URL}/api/v1/posts`, post);
      expect(response.status).toBe(200);
      expect(response.data.hash).toBeDefined();
    });

    it('should reject post without fid', async () => {
      const post = {
        text: 'Test post',
      };

      await expect(
        axios.post(`${GATEWAY_URL}/api/v1/posts`, post)
      ).rejects.toThrow();
    });

    it('should reject empty post', async () => {
      const post = {
        fid: 1,
        text: '',
      };

      await expect(
        axios.post(`${GATEWAY_URL}/api/v1/posts`, post)
      ).rejects.toThrow();
    });
  });

  describe('Post Retrieval', () => {
    it('should retrieve post by hash', async () => {
      // First create a post
      const post = {
        fid: 1,
        text: 'Test post for retrieval',
      };
      const createResponse = await axios.post(`${GATEWAY_URL}/api/v1/posts`, post);
      const hash = createResponse.data.hash;

      // Then retrieve it
      const response = await axios.get(`${GATEWAY_URL}/api/v1/posts/${hash}`);
      expect(response.status).toBe(200);
      expect(response.data.hash).toBe(hash);
      expect(response.data.text).toBe(post.text);
    });

    it('should return 404 for non-existent post', async () => {
      const fakeHash = '0x' + '0'.repeat(64);
      await expect(
        axios.get(`${GATEWAY_URL}/api/v1/posts/${fakeHash}`)
      ).rejects.toThrow();
    });
  });
});

