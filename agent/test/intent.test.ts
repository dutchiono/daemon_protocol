import { describe, it, expect } from 'vitest';
import { classifyIntent, IntentType } from '../src/intent.js';

describe('Intent Classification', () => {
    it('should classify launch token intent', () => {
        const intent = classifyIntent('I want to launch a token');
        expect(intent.type).toBe(IntentType.LAUNCH_TOKEN);
        expect(intent.confidence).toBeGreaterThan(0.5);
    });

    it('should classify query token intent', () => {
        const intent = classifyIntent('What is the token info?');
        expect(intent.type).toBe(IntentType.QUERY_TOKEN);
    });

    it('should classify claim rewards intent', () => {
        const intent = classifyIntent('I want to claim my rewards');
        expect(intent.type).toBe(IntentType.CLAIM_REWARDS);
    });

    it('should classify check contributions intent', () => {
        const intent = classifyIntent('Show my GitHub contributions');
        expect(intent.type).toBe(IntentType.CHECK_CONTRIBUTIONS);
    });

    it('should return unknown for unclear intents', () => {
        const intent = classifyIntent('Hello');
        expect(intent.type).toBe(IntentType.UNKNOWN);
    });
});

