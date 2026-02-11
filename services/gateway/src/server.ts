// services/gateway/src/server.ts
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { createClient } from 'redis';
import DataLoader from 'dataloader';
import { Pool } from 'pg';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { rateLimiter } from './middleware/rateLimit';
import { authenticate } from './middleware/auth';
import { logger } from './utils/logger';

interface Context {
  token?: string;
  userId?: string;
  loaders: {
    user: DataLoader<string, any>;
    message: DataLoader<string, any>;
  };
  redis: ReturnType<typeof createClient>;
  db: Pool;
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // PostgreSQL connection
  const db = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'daemon_protocol',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    max: 20,
  });

  // Redis connection
  const redis = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });
  await redis.connect();
  logger.info('Connected to Redis');

  // DataLoaders for batching
  const createLoaders = () => ({
    user: new DataLoader(async (ids: readonly string[]) => {
      const result = await db.query(
        'SELECT * FROM users WHERE fid = ANY($1)',
        [ids]
      );
      const userMap = new Map(result.rows.map(u => [u.fid.toString(), u]));
      return ids.map(id => userMap.get(id) || null);
    }),
    message: new DataLoader(async (ids: readonly string[]) => {
      const result = await db.query(
        'SELECT * FROM messages WHERE hash = ANY($1)',
        [ids]
      );
      const msgMap = new Map(result.rows.map(m => [m.hash, m]));
      return ids.map(id => msgMap.get(id) || null);
    }),
  });

  // GraphQL schema
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  // WebSocket server for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  const serverCleanup = useServer(
    {
      schema,
      context: async (ctx) => {
        return {
          loaders: createLoaders(),
          redis,
          db,
        };
      },
    },
    wsServer
  );

  // Apollo Server
  const server = new ApolloServer<Context>({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
    formatError: (formattedError, error) => {
      logger.error('GraphQL error:', error);
      return formattedError;
    },
  });

  await server.start();
  logger.info('Apollo Server started');

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(rateLimiter);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Metrics endpoint
  app.get('/metrics', async (req, res) => {
    const stats = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM messages) as total_messages,
        (SELECT COUNT(*) FROM messages WHERE created_at > NOW() - INTERVAL '24 hours') as messages_24h
    `);
    res.json(stats.rows[0]);
  });

  // GraphQL endpoint
  app.use(
    '/graphql',
    authenticate,
    expressMiddleware(server, {
      context: async ({ req }) => ({
        token: req.headers.authorization?.replace('Bearer ', ''),
        userId: (req as any).userId,
        loaders: createLoaders(),
        redis,
        db,
      }),
    })
  );

  // REST fallback endpoints
  app.get('/api/user/:fid', async (req, res) => {
    try {
      const { fid } = req.params;
      const cacheKey = `user:${fid}`;
      
      // Check cache
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      // Query database
      const result = await db.query('SELECT * FROM users WHERE fid = $1', [fid]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = result.rows[0];
      await redis.setEx(cacheKey, 300, JSON.stringify(user)); // Cache 5 min
      res.json(user);
    } catch (error) {
      logger.error('REST API error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Start HTTP server
  const PORT = process.env.PORT || 4000;
  await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));
  logger.info(`Gateway server ready at http://localhost:${PORT}/graphql`);
  logger.info(`WebSocket subscriptions ready at ws://localhost:${PORT}/graphql`);
}

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
