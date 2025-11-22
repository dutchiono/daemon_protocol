/**
 * @title Intent Classification
 * @notice Classify user intents for agent actions
 */

export enum IntentType {
    LAUNCH_TOKEN = 'launch_token',
    QUERY_TOKEN = 'query_token',
    CLAIM_REWARDS = 'claim_rewards',
    CHECK_CONTRIBUTIONS = 'check_contributions',
    UPDATE_METADATA = 'update_metadata',
    SET_FEES = 'set_fees',
    UNKNOWN = 'unknown',
}

export interface Intent {
    type: IntentType;
    confidence: number;
    parameters?: Record<string, any>;
}

/**
 * Classify user intent from message
 * @param message User message
 * @returns Classified intent
 */
export function classifyIntent(message: string): Intent {
    const lowerMessage = message.toLowerCase();

    // Simple keyword-based classification (in production, use LLM)
    if (lowerMessage.includes('launch') || lowerMessage.includes('deploy') || lowerMessage.includes('create token')) {
        return { type: IntentType.LAUNCH_TOKEN, confidence: 0.8 };
    }

    if (lowerMessage.includes('token info') || lowerMessage.includes('token address') || lowerMessage.includes('query')) {
        return { type: IntentType.QUERY_TOKEN, confidence: 0.8 };
    }

    if (lowerMessage.includes('claim') || lowerMessage.includes('reward')) {
        return { type: IntentType.CLAIM_REWARDS, confidence: 0.8 };
    }

    if (lowerMessage.includes('contribution') || lowerMessage.includes('github') || lowerMessage.includes('pr')) {
        return { type: IntentType.CHECK_CONTRIBUTIONS, confidence: 0.8 };
    }

    if (lowerMessage.includes('update') || lowerMessage.includes('metadata')) {
        return { type: IntentType.UPDATE_METADATA, confidence: 0.7 };
    }

    if (lowerMessage.includes('fee') || lowerMessage.includes('split')) {
        return { type: IntentType.SET_FEES, confidence: 0.7 };
    }

    return { type: IntentType.UNKNOWN, confidence: 0.5 };
}

