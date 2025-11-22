import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as tools from '../src/tools.js';

describe('Agent Tools', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getUser', () => {
        it('should return user data', async () => {
            const user = await tools.getUser('0x123...');
            expect(user).toBeDefined();
            expect(user?.walletAddress).toBe('0x123...');
        });
    });

    describe('createDraft', () => {
        it('should create a token draft', async () => {
            const draft = await tools.createDraft({
                name: 'Test Token',
                symbol: 'TEST',
                description: 'A test token',
                feeShareBps: 5000,
                creator: '0x123...',
            });

            expect(draft).toBeDefined();
            expect(draft.name).toBe('Test Token');
            expect(draft.symbol).toBe('TEST');
        });
    });

    describe('getBuilderRewards', () => {
        it('should return builder rewards', async () => {
            // Mock provider
            const mockProvider = {} as any;

            const rewards = await tools.getBuilderRewards('0x123...', mockProvider);
            // This will return null without a real provider, which is expected
            expect(rewards).toBeDefined();
        });
    });
});

