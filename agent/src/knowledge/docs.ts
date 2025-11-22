/**
 * @title Documentation Knowledge Base
 * @notice Loads and provides documentation knowledge to the agent
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load documentation from markdown files
 */
export function loadDocumentation(): string {
  const docsDir = path.resolve(__dirname, '../../../docs');
  const docs: string[] = [];

  // List of documentation files to include (in order of importance)
  const docFiles = [
    'README.md',
    'AGENT.md',
    'SDK.md',
    'LAUNCHPAD.md',
    'BUILDER_REWARDS.md',
    'HOOK.md',
    'DEPLOYMENT.md',
    'TESTING.md',
    'SALT_GENERATION_LESSONS.md',
    'TOKEN_NAMING.md',
  ];

  for (const file of docFiles) {
    const filePath = path.join(docsDir, file);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        docs.push(`# ${file}\n\n${content}\n\n---\n`);
      } catch (error) {
        console.warn(`Failed to load ${file}:`, error);
      }
    }
  }

  return docs.join('\n\n');
}

/**
 * Get documentation summary for agent prompt
 */
export function getDocumentationKnowledge(): string {
  const docs = loadDocumentation();

  return `## Daemon Protocol Documentation

The following documentation is available to help you answer questions accurately:

${docs}

## Key Points to Remember:

1. **Daemon Protocol**: Token launchpad on Uniswap V4 with 5% builder rewards
2. **Builder Rewards**: 5% of all protocol fees go to active GitHub contributors
3. **Token Deployment**: Uses factory pattern with salt generation starting from 0
4. **TGE Support**: Token Generation Events for bootstrapping liquidity
5. **SDK**: TypeScript SDK available for all contract interactions
6. **Network**: Currently on Base Sepolia testnet, will deploy to Base mainnet
7. **Contracts**: DaemonHook, DaemonFactory, BuilderRewardDistributor, etc.

Always refer to this documentation when answering questions about Daemon Protocol.`;
}

