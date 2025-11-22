/**
 * @title Telegram Bot Service
 * @notice Telegram bot integrated into backend server
 */

import { Telegraf, Context } from 'telegraf';
import { agentRouter } from '../routes/agent.js';
import type { Request, Response } from 'express';
import { resolve } from 'path';
import env from '../config/env.js';

// Store user sessions (wallet addresses)
const userSessions = new Map<number, { walletAddress?: string; sessionId?: string }>();

let bot: Telegraf | null = null;

/**
 * Call agent directly (no HTTP call needed since we're in the same process)
 */
async function callAgent(message: string, userId: number, username: string, walletAddress?: string): Promise<string> {
  try {
    const session = userSessions.get(userId);

    // Log conversation
    const userIdentifier = username || `TG:${userId}`;
    const walletLabel = walletAddress ? ` (${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)})` : '';
    console.log(`\n💬 [TELEGRAM] ${userIdentifier}${walletLabel}: ${message}`);

    // Import agent modules directly (same process, no HTTP needed)
    const { getSystemPrompt } = await import('../../../agent/src/prompt.js');
    const { classifyIntent } = await import('../../../agent/src/intent.js');
    const { createSession, getSession, updateSessionActivity } = await import('../../../agent/src/session.js');
    const { OpenAILLMClient } = await import('../../../agent/src/llm/client.js');

    // Get or create session
    let sessionObj = session?.sessionId ? getSession(session?.sessionId) : undefined;
    if (!sessionObj && walletAddress) {
      sessionObj = createSession(walletAddress);
    }
    if (!sessionObj && !walletAddress) {
      // Allow sessions without wallet for general questions
      sessionObj = createSession('0x0000000000000000000000000000000000000000');
    }
    if (!sessionObj) {
      return 'Please link your wallet address first using /wallet <address>';
    }

    updateSessionActivity(sessionObj.id);

    // Initialize LLM client
    const apiKey = env.AGENT_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return 'Agent API is not configured. Please set AGENT_API_KEY in environment variables.';
    }

    const llmClient = new OpenAILLMClient(apiKey, env.AGENT_MODEL || 'gpt-4o-mini');

    // Classify intent
    const intent = classifyIntent(message);

    // Build messages for LLM
    const messages = [
      { role: 'system' as const, content: getSystemPrompt() },
      { role: 'user' as const, content: message },
    ];

    // Get LLM response
    const response = await llmClient.chat(messages);

    // Store session ID for future requests
    if (response && !session?.sessionId) {
      userSessions.set(userId, {
        ...session,
        sessionId: sessionObj.id,
        walletAddress: walletAddress || session?.walletAddress,
      });
    }

    const responseText = response.content || 'I apologize, but I encountered an error processing your request.';

    // Log agent response
    const shortResponse = responseText.length > 100
      ? responseText.substring(0, 100) + '...'
      : responseText;
    console.log(`🤖 Agent: ${shortResponse}`);

    return responseText;
  } catch (error) {
    console.error('Agent error:', error);
    return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * Initialize Telegram bot
 */
export function initializeTelegramBot(): void {
  // Debug: Check if token is loaded
  const tokenFromEnv = process.env.TELEGRAM_BOT_TOKEN;
  const tokenFromConfig = env.TELEGRAM_BOT_TOKEN;

  if (!tokenFromConfig && !tokenFromEnv) {
    console.log('⚠️  TELEGRAM_BOT_TOKEN not set - Telegram bot disabled');
    console.log('   Looking for .env file in:', resolve(process.cwd(), '..', '.env'));
    return;
  }

  // Use token from config or fallback to process.env
  const token = tokenFromConfig || tokenFromEnv;

  try {
    bot = new Telegraf(token);

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

      const username = ctx.from.username || ctx.from.first_name || `User${ctx.from.id}`;
      await ctx.reply('Checking your builder rewards...');
      const response = await callAgent('check my builder rewards', ctx.from.id, username, session.walletAddress);
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

      const username = ctx.from.username || ctx.from.first_name || `User${ctx.from.id}`;
      await ctx.reply('Checking your contributions...');
      const response = await callAgent('check my GitHub contributions', ctx.from.id, username, session.walletAddress);
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
     * Handle text messages in private chats (always respond)
     */
    bot.on('message', async (ctx) => {
      // Only handle text messages
      if (!('text' in ctx.message)) return;

      const message = ctx.message.text;
      const userId = ctx.from.id;
      const chatType = ctx.chat.type;
      const username = ctx.from.username || ctx.from.first_name || `User${ctx.from.id}`;
      const session = userSessions.get(userId);

      // In groups, only respond if bot is mentioned
      if (chatType === 'group' || chatType === 'supergroup') {
        const botInfo = await ctx.telegram.getMe();
        const botUsername = botInfo.username;
        const isMentioned = message.includes(`@${botUsername}`) || ctx.message.entities?.some(
          (entity) => entity.type === 'mention' && message.substring(entity.offset, entity.offset + entity.length) === `@${botUsername}`
        );

        if (!isMentioned) {
          // Not mentioned, ignore message
          return;
        }

        // Remove mention from message
        const cleanMessage = message.replace(`@${botUsername}`, '').trim();
        if (!cleanMessage) {
          await ctx.reply('Hi! How can I help you?');
          return;
        }

        // Show typing indicator
        await ctx.sendChatAction('typing');

        // Call agent with cleaned message
        const response = await callAgent(cleanMessage, userId, username, session?.walletAddress);
        await ctx.reply(response);
      } else {
        // Private chat - always respond
        // Show typing indicator
        await ctx.sendChatAction('typing');

        // Call agent directly (no HTTP needed)
        const response = await callAgent(message, userId, username, session?.walletAddress);
        await ctx.reply(response);
      }
    });

    /**
     * Error handling
     */
    bot.catch((err, ctx) => {
      console.error('Telegram bot error:', err);
      ctx.reply('An error occurred. Please try again later.');
    });

    // Start bot
    bot.launch().then(() => {
      console.log('✅ Telegram bot started and integrated with backend');
    }).catch((error) => {
      console.error('Failed to start Telegram bot:', error);
    });

    // Graceful stop
    process.once('SIGINT', () => {
      if (bot) {
        bot.stop('SIGINT');
      }
    });
    process.once('SIGTERM', () => {
      if (bot) {
        bot.stop('SIGTERM');
      }
    });
  } catch (error) {
    console.error('Failed to initialize Telegram bot:', error);
  }
}

/**
 * Stop Telegram bot
 */
export function stopTelegramBot(): Promise<void> {
  if (bot) {
    return bot.stop();
  }
  return Promise.resolve();
}

