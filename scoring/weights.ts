/**
 * Contribution Weighting System
 * Defines weights for different types of contributions
 */

export interface ContributionWeights {
  code: number;        // 1.0x
  sdk: number;         // 0.8x
  docs: number;        // 0.5x
  tests: number;       // 0.3x
  bugfix: number;      // 1.5x
  feature: number;     // 2.0x
  refactor: number;    // 0.7x
}

/**
 * Default contribution weights (in basis points, 10000 = 1.0x)
 */
export const DEFAULT_CONTRIBUTION_WEIGHTS: ContributionWeights = {
  code: 10000,      // 1.0x
  sdk: 8000,        // 0.8x
  docs: 5000,       // 0.5x
  tests: 3000,      // 0.3x
  bugfix: 15000,    // 1.5x
  feature: 20000,   // 2.0x
  refactor: 7000,   // 0.7x
};

/**
 * Base scores for contribution types
 */
export const BASE_SCORES = {
  CODE: 10,
  SDK: 8,
  DOCS: 5,
  TESTS: 3,
  BUGFIX: 15,
  FEATURE: 20,
  REFACTOR: 7,
} as const;

/**
 * Calculate weighted score for a contribution
 * @param baseScore Base score for the contribution type
 * @param weight Weight multiplier (in basis points)
 * @returns Weighted score
 */
export function calculateWeightedScore(baseScore: number, weight: number): number {
  return Math.floor((baseScore * weight) / 10000);
}

/**
 * Get contribution type from string
 */
export function getContributionType(type: string): keyof ContributionWeights {
  const normalized = type.toLowerCase();
  if (normalized.includes('bug') || normalized.includes('fix')) return 'bugfix';
  if (normalized.includes('feature') || normalized.includes('feat')) return 'feature';
  if (normalized.includes('refactor')) return 'refactor';
  if (normalized.includes('test') || normalized.includes('spec')) return 'tests';
  if (normalized.includes('doc') || normalized.includes('readme')) return 'docs';
  if (normalized.includes('sdk')) return 'sdk';
  return 'code'; // Default to code
}

