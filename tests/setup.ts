/**
 * @title Test Setup
 * @notice Global test configuration
 */

import { beforeAll, afterAll } from 'vitest';

// Global test timeout
const TEST_TIMEOUT = 30000; // 30 seconds

beforeAll(() => {
  // Log test environment
  console.log('Test Environment:');
  console.log(`  HUB_URL: ${process.env.HUB_URL || 'http://localhost:4001'}`);
  console.log(`  PDS_URL: ${process.env.PDS_URL || 'http://localhost:4002'}`);
  console.log(`  GATEWAY_URL: ${process.env.GATEWAY_URL || 'http://localhost:4003'}`);
});

afterAll(() => {
  // Cleanup if needed
});

