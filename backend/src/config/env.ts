import { z } from 'zod';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables from root directory
// Backend is in daemon/backend/, .env is in daemon/
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Go up from backend/src/config/ to daemon/ root
const rootDir = resolve(__dirname, '../../../');

if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: resolve(rootDir, '.env') });
}

const envSchema = z.object({
  // Database (optional - may not be using Prisma)
  DATABASE_URL: z.string().url().optional(),

  // Server
  PORT: z.string().transform(Number).pipe(z.number().int().positive()).default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Neynar
  NEYNAR_API_KEY: z.string().min(1).optional(),
  NEYNAR_BOT_FID: z.string().optional(),
  NEYNAR_SIGNER_UUID: z.string().optional(),
  NEYNAR_WEBHOOK_SECRET: z.string().optional(),

  // JWT
  JWT_SECRET: z.string().min(32).optional(),
  JWT_EXPIRES_IN: z.string().default('15m'),

  // Base (Ethereum L2)
  ALCHEMY_API_KEY: z.string().optional(),
  BASE_RPC_URL: z.string().url().optional(),
  BASE_RPC_URL_SECONDARY: z.string().url().optional(),
  BASE_SEPOLIA_RPC_URL: z.string().url().optional(),

  // Network selection: 'mainnet' or 'sepolia' (default: 'sepolia' for testnet)
  NETWORK: z.enum(['mainnet', 'sepolia']).default('sepolia'),

  // IPFS / Pinata
  IPFS_GATEWAY_URL: z.string().url().optional(),
  PINATA_API_KEY: z.string().optional(),
  PINATA_SECRET_KEY: z.string().optional(),
  PINATA_JWT: z.string().optional(),

  // Agent
  AGENT_API_KEY: z.string().optional(),
  AGENT_MODEL: z.string().default('gpt-4o-mini'),

  // Telegram Bot
  TELEGRAM_BOT_TOKEN: z.string().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Environment validation failed:');
    error.errors.forEach((err) => {
      console.error(`  ${err.path.join('.')}: ${err.message}`);
    });
    // Don't exit in development - allow missing optional vars
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  } else {
    throw error;
  }
  // Set defaults for missing optional fields
  env = {
    PORT: 3000,
    NODE_ENV: 'development',
    JWT_EXPIRES_IN: '15m',
    AGENT_MODEL: 'gpt-4o-mini',
  } as Env;
}

/**
 * Get the RPC URL to use (prefer Alchemy if available)
 * Alchemy format: https://base-mainnet.g.alchemy.com/v2/<api-key> or https://base-sepolia.g.alchemy.com/v2/<api-key>
 */
export function getRpcUrl(): string {
  const network = env.NETWORK || 'sepolia';

  // Prefer Alchemy if API key is provided
  if (env.ALCHEMY_API_KEY) {
    if (network === 'sepolia') {
      return `https://base-sepolia.g.alchemy.com/v2/${env.ALCHEMY_API_KEY}`;
    }
    return `https://base-mainnet.g.alchemy.com/v2/${env.ALCHEMY_API_KEY}`;
  }

  // Fall back to custom RPC URLs
  if (network === 'sepolia' && env.BASE_SEPOLIA_RPC_URL) {
    return env.BASE_SEPOLIA_RPC_URL;
  }

  if (env.BASE_RPC_URL) {
    return env.BASE_RPC_URL;
  }

  // Default public RPCs
  if (network === 'sepolia') {
    return 'https://sepolia.base.org';
  }

  return 'https://mainnet.base.org';
}

/**
 * Get the chain ID for the current network
 */
export function getChainId(): number {
  const network = env.NETWORK || 'sepolia';
  return network === 'sepolia' ? 84532 : 8453;
}

export default env;

