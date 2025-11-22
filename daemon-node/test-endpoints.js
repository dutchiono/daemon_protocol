#!/usr/bin/env node

/**
 * Quick test script to verify server endpoints are working
 * Run this on the server: node test-endpoints.js
 */

const http = require('http');

const endpoints = [
  { name: 'Hub Health', url: 'http://localhost:4001/health' },
  { name: 'PDS Health', url: 'http://localhost:4002/health' },
  { name: 'Gateway Health', url: 'http://localhost:4003/health' },
  { name: 'Gateway Feed', url: 'http://localhost:4003/api/v1/feed?limit=10' },
  { name: 'PDS Describe', url: 'http://localhost:4002/xrpc/com.atproto.server.describeServer' },
];

async function testEndpoint(name, url) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const time = Date.now() - startTime;
        resolve({
          name,
          url,
          status: res.statusCode,
          time,
          success: res.statusCode >= 200 && res.statusCode < 400,
          data: data.substring(0, 200) // First 200 chars
        });
      });
    }).on('error', (error) => {
      resolve({
        name,
        url,
        status: 'ERROR',
        error: error.message,
        success: false
      });
    });
  });
}

async function runTests() {
  console.log('========================================');
  console.log('Testing Server Endpoints');
  console.log('========================================\n');

  const results = [];
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint.name, endpoint.url);
    results.push(result);
    
    const status = result.success ? '✅' : '❌';
    const statusText = result.status || result.error || 'UNKNOWN';
    const time = result.time ? `(${result.time}ms)` : '';
    
    console.log(`${status} ${result.name}: ${statusText} ${time}`);
    if (!result.success && result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }

  console.log('\n========================================');
  console.log('Test Summary');
  console.log('========================================');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Passed: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\nFailed endpoints:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.name}: ${r.error || r.status}`);
    });
  }
  
  console.log('\n========================================');
  console.log('Detailed Results');
  console.log('========================================\n');
  
  results.forEach(r => {
    console.log(`${r.name}:`);
    console.log(`  URL: ${r.url}`);
    console.log(`  Status: ${r.status || 'ERROR'}`);
    if (r.time) console.log(`  Time: ${r.time}ms`);
    if (r.error) console.log(`  Error: ${r.error}`);
    if (r.data) {
      try {
        const json = JSON.parse(r.data);
        console.log(`  Response: ${JSON.stringify(json, null, 2).substring(0, 200)}`);
      } catch {
        console.log(`  Response: ${r.data}`);
      }
    }
    console.log('');
  });
}

runTests().catch(console.error);

