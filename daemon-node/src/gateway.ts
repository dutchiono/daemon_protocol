/**
 * @title Gateway Node Runner
 * @notice Starts Gateway node
 */

import express from 'express';
import cors from 'cors';
import { AggregationLayer } from '../../social-network/gateway/src/aggregation-layer.js';
import { GatewayService } from '../../social-network/gateway/src/gateway-service.js';

export interface GatewayConfig {
  port: number;
  databaseUrl: string;
  hubEndpoints: string[];
  pdsEndpoints: string[];
}

export async function startGateway(config: GatewayConfig) {
  console.log('Starting Gateway node...');
  console.log(`Port: ${config.port}`);
  console.log(`Hubs: ${config.hubEndpoints.length}`);
  console.log(`PDS: ${config.pdsEndpoints.length}`);

  const app = express();
  app.use(cors());
  app.use(express.json());

  const aggregationLayer = new AggregationLayer({
    port: config.port,
    gatewayId: `gateway-${config.port}`,
    hubEndpoints: config.hubEndpoints,
    pdsEndpoints: config.pdsEndpoints,
    databaseUrl: config.databaseUrl,
    redisUrl: '',
    x402ServiceUrl: 'http://localhost:3000',
  });
  const gatewayService = new GatewayService(aggregationLayer, {
    port: config.port,
    gatewayId: `gateway-${config.port}`,
    hubEndpoints: config.hubEndpoints,
    pdsEndpoints: config.pdsEndpoints,
    databaseUrl: config.databaseUrl,
    redisUrl: '',
    x402ServiceUrl: 'http://localhost:3000',
  });

  // Setup API
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', gatewayId: gatewayService.getGatewayId() });
  });

  app.get('/api/v1/feed', async (req, res) => {
    try {
      const { fid, type = 'algorithmic', limit = 50 } = req.query;
      const feed = await gatewayService.getFeed(
        parseInt(fid as string),
        type as string,
        parseInt(limit as string),
        undefined
      );
      res.json(feed);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post('/api/v1/posts', async (req, res) => {
    try {
      const { fid, text, parentHash } = req.body;
      const result = await gatewayService.createPost(fid, text, parentHash);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get('/api/v1/posts/:hash', async (req, res) => {
    try {
      const post = await gatewayService.getPost(req.params.hash);
      if (!post) return res.status(404).json({ error: 'Not found' });
      res.json(post);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  const server = app.listen(config.port, () => {
    console.log(`✅ Gateway running on port ${config.port}`);
    console.log(`   Gateway ID: ${gatewayService.getGatewayId()}`);
  });

  return {
    stop: async () => {
      server.close();
    }
  };
}

