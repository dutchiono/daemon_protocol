/**
 * Unit Tests for Scoring System
 */

import { describe, it, expect } from 'vitest';
import { calculateDecayedScore, DEFAULT_DECAY_CONFIG } from '../scoring/decay.js';
import { calculateWeightedScore, BASE_SCORES } from '../scoring/weights.js';

describe('Scoring System', () => {
  describe('Decay Calculation', () => {
    it('should not decay during grace period', () => {
      const now = Math.floor(Date.now() / 1000);
      const score = calculateDecayedScore(100, now, DEFAULT_DECAY_CONFIG);
      expect(score).toBe(100);
    });

    it('should decay after grace period', () => {
      const daysAgo = 10;
      const timestamp = Math.floor(Date.now() / 1000) - (daysAgo * 86400);
      const score = calculateDecayedScore(100, timestamp, DEFAULT_DECAY_CONFIG);
      expect(score).toBeLessThan(100);
      expect(score).toBeGreaterThan(DEFAULT_DECAY_CONFIG.minScoreFloor);
    });

    it('should never decay below floor', () => {
      const daysAgo = 100;
      const timestamp = Math.floor(Date.now() / 1000) - (daysAgo * 86400);
      const score = calculateDecayedScore(100, timestamp, DEFAULT_DECAY_CONFIG);
      expect(score).toBeGreaterThanOrEqual(DEFAULT_DECAY_CONFIG.minScoreFloor);
    });
  });

  describe('Weight Calculation', () => {
    it('should calculate weighted score correctly', () => {
      const score = calculateWeightedScore(BASE_SCORES.FEATURE, 20000); // 2.0x
      expect(score).toBe(40); // 20 * 2.0
    });

    it('should handle fractional weights', () => {
      const score = calculateWeightedScore(BASE_SCORES.DOCS, 5000); // 0.5x
      expect(score).toBe(2); // 5 * 0.5 = 2.5, floored to 2
    });
  });
});

