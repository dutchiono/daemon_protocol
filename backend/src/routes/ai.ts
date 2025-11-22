import { Router } from 'express';
import OpenAI from 'openai';
import env from '../config/env.js';

const aiRouter = Router();

// Initialize OpenAI client (use cheaper model if API key is set)
const openai = env.AGENT_API_KEY
  ? new OpenAI({
      apiKey: env.AGENT_API_KEY,
    })
  : null;

// Use cheaper model: gpt-4o-mini or gpt-3.5-turbo
const MODEL = env.AGENT_MODEL || 'gpt-4o-mini';

/**
 * POST /api/ai/chat
 * Chat with AI to help fill out token launch form
 * No auth required for now - can add later if needed
 */
aiRouter.post('/chat', async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({
        error: 'AI service not configured',
        message: 'Please set AGENT_API_KEY in environment variables',
      });
    }

    const { messages, currentFormData, walletAddress } = req.body;

    // Log conversation from web
    const userIdentifier = walletAddress || 'anonymous';
    const lastMessage = messages[messages.length - 1]?.content || '';
    console.log(`\n💬 [WEB] ${userIdentifier}: ${lastMessage}`);

    // Build system prompt
    const systemPrompt = `You are Daemon AI, a helpful assistant for launching tokens on the Daemon Protocol.

Your job is to help users fill out a token launch form by:
1. Extracting information from their text messages
2. Suggesting appropriate values for token fields
3. Updating the form data interactively

Form fields you can help with:
- name: Token name (e.g., "My Awesome Token")
- symbol: Token symbol, 3-10 characters, uppercase (e.g., "MAT")
- description: Token description
- fee_share_bps: Fee sharing with stakers in basis points (0-10000, where 5000 = 50%)

Note: Images are uploaded separately via IPFS - you don't need to analyze them.
When users mention uploading an image, just acknowledge it and focus on helping with text-based fields.

When the user provides information:
- Extract relevant details from their text
- Return a JSON response with:
  {
    "response": "Your helpful text response",
    "updates": {
      "name": "extracted name",
      "symbol": "EXTRACTED",
      "description": "extracted description",
      // ... other fields that should be updated
    }
  }

Always be helpful and guide users through the process.`;

    // Build messages array for OpenAI
    const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...messages.map((msg: any) => {
        // Only process text content - images are handled separately via upload endpoint
        // User can describe the image in text and AI will fill in form fields
        return {
          role: msg.role,
          content: msg.content || '',
        };
      }),
      {
        role: 'user',
        content: `Current form data: ${JSON.stringify(currentFormData)}. Wallet address: ${walletAddress || 'not connected'}.`,
      },
    ];

    // Call OpenAI (remove response_format since cheaper models don't support it)
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: openaiMessages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    let parsedResponse: any = {};

    // Try to extract JSON from response (model might wrap it in text)
    try {
      // Look for JSON in code blocks or directly parse
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        // Try parsing the whole thing
        parsedResponse = JSON.parse(responseText);
      }
    } catch {
      // If not valid JSON, parse the response manually
      // Look for patterns like "name": "value" or update fields
      const updates: any = {};
      const nameMatch = responseText.match(/["']?name["']?\s*[:=]\s*["']([^"']+)["']/i);
      const symbolMatch = responseText.match(/["']?symbol["']?\s*[:=]\s*["']([^"']+)["']/i);
      const descMatch = responseText.match(/["']?description["']?\s*[:=]\s*["']([^"']+)["']/i);

      if (nameMatch) updates.name = nameMatch[1];
      if (symbolMatch) updates.symbol = symbolMatch[1].toUpperCase();
      if (descMatch) updates.description = descMatch[1];

      parsedResponse = {
        response: responseText,
        updates,
      };
    }

    // Ensure response has the right structure
    const result = {
      response: parsedResponse.response || parsedResponse.message || responseText || 'I understand!',
      updates: parsedResponse.updates || {},
    };

    // Log agent response
    const shortResponse = result.response.length > 100
      ? result.response.substring(0, 100) + '...'
      : result.response;
    console.log(`🤖 Agent: ${shortResponse}`);

    res.json(result);
  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).json({
      error: 'Failed to process AI request',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { aiRouter };

