/**
 * Time-Based Decay Calculator
 * Implements exponential decay for contribution scores
 */

export interface DecayConfig {
  decayRate: number;        // Daily decay rate (0.05 = 5%)
  gracePeriodDays: number;  // Days before decay starts (7)
  minScoreFloor: number;     // Minimum score floor (0.1)
}

export const DEFAULT_DECAY_CONFIG: DecayConfig = {
  decayRate: 0.05,          // 5% daily decay
  gracePeriodDays: 7,       // 7 day grace period
  minScoreFloor: 0.1,       // Never decays below 0.1
};

/**
 * Calculate decayed score for a contribution
 * @param baseScore Original contribution score
 * @param timestamp Contribution timestamp (Unix timestamp in seconds)
 * @param config Decay configuration (optional, uses defaults if not provided)
 * @returns Decayed score
 */
export function calculateDecayedScore(
  baseScore: number,
  timestamp: number,
  config: DecayConfig = DEFAULT_DECAY_CONFIG
): number {
  if (baseScore === 0) return 0;

  const now = Math.floor(Date.now() / 1000);
  const daysSince = Math.floor((now - timestamp) / 86400); // 86400 seconds per day

  // Grace period - no decay for first N days
  if (daysSince < config.gracePeriodDays) {
    return baseScore;
  }

  // Exponential decay: score * e^(-decay_rate * days)
  const daysDecayed = daysSince - config.gracePeriodDays;
  const decayFactor = Math.exp(-config.decayRate * daysDecayed);
  const decayedScore = baseScore * decayFactor;

  // Apply minimum floor
  return Math.max(decayedScore, config.minScoreFloor);
}

/**
 * Calculate total decayed score for multiple contributions
 * @param contributions Array of { score, timestamp } objects
 * @param config Decay configuration (optional)
 * @returns Total decayed score
 */
export function calculateTotalDecayedScore(
  contributions: Array<{ score: number; timestamp: number }>,
  config: DecayConfig = DEFAULT_DECAY_CONFIG
): number {
  return contributions.reduce((total, contrib) => {
    return total + calculateDecayedScore(contrib.score, contrib.timestamp, config);
  }, 0);
}

/**
 * Calculate decay for a specific number of days
 * @param baseScore Original score
 * @param days Number of days since contribution
 * @param config Decay configuration (optional)
 * @returns Decayed score
 */
export function calculateDecayForDays(
  baseScore: number,
  days: number,
  config: DecayConfig = DEFAULT_DECAY_CONFIG
): number {
  if (days < config.gracePeriodDays) {
    return baseScore;
  }

  const daysDecayed = days - config.gracePeriodDays;
  const decayFactor = Math.exp(-config.decayRate * daysDecayed);
  const decayedScore = baseScore * decayFactor;

  return Math.max(decayedScore, config.minScoreFloor);
}

