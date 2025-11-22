/**
 * @title LLM Client
 * @notice Abstraction for LLM providers (OpenAI, Anthropic, etc.)
 */

import OpenAI from 'openai';

export interface LLMMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface LLMResponse {
    content: string;
    toolCalls?: Array<{
        name: string;
        arguments: Record<string, any>;
    }>;
}

export interface LLMClient {
    chat(messages: LLMMessage[]): Promise<LLMResponse>;
}

/**
 * OpenAI LLM Client
 */
export class OpenAILLMClient implements LLMClient {
    private client: OpenAI;
    private model: string;

    constructor(apiKey: string, model: string = 'gpt-4o-mini') {
        if (!apiKey) {
            throw new Error('OpenAI API key is required');
        }
        this.client = new OpenAI({ apiKey });
        this.model = model;
    }

    async chat(messages: LLMMessage[]): Promise<LLMResponse> {
        try {
            const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = messages.map(msg => ({
                role: msg.role,
                content: msg.content,
            }));

            const completion = await this.client.chat.completions.create({
                model: this.model,
                messages: openaiMessages,
                temperature: 0.7,
                max_tokens: 1000,
            });

            const responseContent = completion.choices[0]?.message?.content || '';

            // Parse tool calls if present (OpenAI function calling)
            const toolCalls = completion.choices[0]?.message?.tool_calls?.map(tc => ({
                name: tc.function.name,
                arguments: JSON.parse(tc.function.arguments || '{}'),
            }));

            return {
                content: responseContent,
                toolCalls,
            };
        } catch (error) {
            console.error('OpenAI API error:', error);
            throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

/**
 * Mock LLM Client for testing
 */
export class MockLLMClient implements LLMClient {
    async chat(messages: LLMMessage[]): Promise<LLMResponse> {
        const lastMessage = messages[messages.length - 1];
        return {
            content: `Mock response to: ${lastMessage.content}`,
        };
    }
}

