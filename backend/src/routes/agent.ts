/**
 * @title Agent API Routes
 * @notice REST API endpoints for agent interaction
 */

import { Router, Request, Response } from 'express';
import { getSystemPrompt } from '../../../agent/src/prompt.js';
import { classifyIntent } from '../../../agent/src/intent.js';
import { createSession, getSession, updateSessionActivity } from '../../../agent/src/session.js';
import { OpenAILLMClient, type LLMClient } from '../../../agent/src/llm/client.js';
import * as tools from '../../../agent/src/tools.js';

const agentRouter = Router();

// Initialize LLM client (use AGENT_API_KEY or OPENAI_API_KEY)
const apiKey = process.env.AGENT_API_KEY || process.env.OPENAI_API_KEY;
const llmClient: LLMClient = apiKey
    ? new OpenAILLMClient(apiKey, process.env.AGENT_MODEL || 'gpt-4o-mini')
    : new (await import('../../../agent/src/llm/client.js')).MockLLMClient();

/**
 * POST /api/agent/chat
 * Chat with the agent
 */
agentRouter.post('/chat', async (req: Request, res: Response) => {
    try {
        const { message, sessionId, walletAddress, username, source } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Get user identifier for logging
        const userIdentifier = username || walletAddress || 'anonymous';
        const sourceLabel = source || 'web';

        // Log conversation
        console.log(`\n💬 [${sourceLabel.toUpperCase()}] ${userIdentifier}: ${message}`);

        // Get or create session
        let session = sessionId ? getSession(sessionId) : undefined;
        if (!session && walletAddress) {
            session = createSession(walletAddress);
        }
        if (!session) {
            return res.status(400).json({ error: 'Session or wallet address required' });
        }

        updateSessionActivity(session.id);

        // Classify intent
        const intent = classifyIntent(message);

        // Build messages for LLM
        const messages = [
            { role: 'system' as const, content: getSystemPrompt() },
            { role: 'user' as const, content: message },
        ];

        // Get LLM response
        const response = await llmClient.chat(messages);

        // Log agent response
        const shortResponse = response.content.length > 100
            ? response.content.substring(0, 100) + '...'
            : response.content;
        console.log(`🤖 Agent: ${shortResponse}`);

        // Execute tool calls if any
        if (response.toolCalls) {
            for (const toolCall of response.toolCalls) {
                // Execute tool based on name
                // This is simplified - full implementation would handle all tools
                switch (toolCall.name) {
                    case 'getBuilderRewards':
                        // Execute tool
                        break;
                }
            }
        }

        res.json({
            response: response.content,
            sessionId: session.id,
            intent: intent.type,
        });
    } catch (error) {
        console.error('Error in agent chat:', error);
        res.status(500).json({
            error: 'Failed to process agent request',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * POST /api/agent/session
 * Create a new session
 */
agentRouter.post('/session', async (req: Request, res: Response) => {
    try {
        const { walletAddress } = req.body;

        if (!walletAddress) {
            return res.status(400).json({ error: 'Wallet address is required' });
        }

        const session = createSession(walletAddress);
        res.json({ sessionId: session.id, walletAddress: session.walletAddress });
    } catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({
            error: 'Failed to create session',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

export { agentRouter };

