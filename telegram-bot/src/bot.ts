/**
 * @title Daemon Telegram Bot
 * @notice Telegram bot that integrates with Daemon Agent API
 */

import { Telegraf, Context } from 'telegraf';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import axios from 'axios';

// Load .env from root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../../.env') });

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

if (!TELEGRAM_BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is required in .env');
  process.exit(1);
}

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

// Store user sessions (wallet addresses)
const userSessions = new Map<number, { walletAddress?: string; sessionId?: string }>();

/**
 * Call agent API
 */
async function callAgent(message: string, userId: number, walletAddress?: string): Promise<string> {
  try {
    const session = userSessions.get(userId);

    const response = await axios.post(`${BACKEND_URL}/api/agent/chat`, {
      message,
      sessionId: session?.sessionId,
      walletAddress: walletAddress || session?.walletAddress,
    });

    // Store session ID for future requests
    if (response.data.sessionId && !session?.sessionId) {
      userSessions.set(userId, {
        ...session,
        sessionId: response.data.sessionId,
        walletAddress: walletAddress || session?.walletAddress,
      });
    }

    return response.data.response || 'I apologize, but I encountered an error processing your request.';
  } catch (error) {
    console.error('Agent API error:', error);
    if (axios.isAxiosError(error)) {
      return `Error: ${error.response?.data?.error || error.message}`;
    }
    return 'I encountered an error. Please try again later.';
  }
}

/**
 * Start command
 */
bot.command('start', async (ctx) => {
  const welcomeMessage = `👋 Welcome to Daemon Protocol!

I'm the Daemon Agent, here to help you:
• Launch tokens on Daemon Protocol
• Understand how the protocol works
• Check builder rewards
• Deploy tokens safely

Use /help to see all commands, or just ask me anything about Daemon Protocol!`;

  await ctx.reply(welcomeMessage);
});

/**
 * Help command
 */
bot.command('help', async (ctx) => {
  const helpMessage = `📚 Daemon Bot Commands:

/start - Welcome message
/help - Show this help
/launch - Start token launch wizard
/rewards - Check your builder rewards
/contributions - Check your GitHub contributions
/wallet <address> - Link your wallet address

You can also just chat with me naturally! Ask me:
• "How do I launch a token?"
• "What are builder rewards?"
• "Tell me about Daemon Protocol"
• Or anything else about the protocol`;

  await ctx.reply(helpMessage);
});

/**
 * Launch command - start token launch wizard
 */
bot.command('launch', async (ctx) => {
  await ctx.reply('🚀 Let\'s launch your token!\n\nTell me about your token:\n• Name\n• Symbol\n• Description\n\nOr just describe what you want to create, and I\'ll help you through the process.');
});

/**
 * Rewards command
 */
bot.command('rewards', async (ctx) => {
  const session = userSessions.get(ctx.from.id);
  if (!session?.walletAddress) {
    await ctx.reply('Please link your wallet first using /wallet <address>');
    return;
  }

  await ctx.reply('Checking your builder rewards...');
  const response = await callAgent('check my builder rewards', ctx.from.id, session.walletAddress);
  await ctx.reply(response);
});

/**
 * Contributions command
 */
bot.command('contributions', async (ctx) => {
  const session = userSessions.get(ctx.from.id);
  if (!session?.walletAddress) {
    await ctx.reply('Please link your wallet first using /wallet <address>');
    return;
  }

  await ctx.reply('Checking your contributions...');
  const response = await callAgent('check my GitHub contributions', ctx.from.id, session.walletAddress);
  await ctx.reply(response);
});

/**
 * Wallet command - link wallet address
 */
bot.command('wallet', async (ctx) => {
  const args = ctx.message.text.split(' ').slice(1);
  if (args.length === 0) {
    await ctx.reply('Please provide your wallet address:\n/wallet <your_wallet_address>');
    return;
  }

  const walletAddress = args[0];

  // Basic validation (should be valid Ethereum address)
  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    await ctx.reply('Invalid wallet address format. Please provide a valid Ethereum address (0x...).');
    return;
  }

  const session = userSessions.get(ctx.from.id) || {};
  userSessions.set(ctx.from.id, {
    ...session,
    walletAddress,
  });

  await ctx.reply(`✅ Wallet linked: ${walletAddress}\n\nYou can now use commands like /rewards and /contributions.`);
});

/**
 * Handle all text messages
 */
bot.on('text', async (ctx) => {
  const message = ctx.message.text;
  const userId = ctx.from.id;
  const session = userSessions.get(userId);

  // Show typing indicator
  await ctx.sendChatAction('typing');

  // Call agent API
  const response = await callAgent(message, userId, session?.walletAddress);

  await ctx.reply(response);
});

/**
 * Error handling
 */
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('An error occurred. Please try again later.');
});

// Start bot
bot.launch().then(() => {
  console.log('✅ Daemon Telegram bot started');
}).catch((error) => {
  console.error('Failed to start bot:', error);
  process.exit(1);
});

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

