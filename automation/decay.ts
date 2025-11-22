/**
 * Score Decay Calculator
 * Calculates decayed scores for all contributors
 */

import { calculateDecayedScore, calculateTotalDecayedScore } from '../scoring/decay.js';

export interface Contribution {
  score: number;
  timestamp: number;
}

export interface ContributorDecayResult {
  contributor: string;
  originalScore: number;
  decayedScore: number;
  contributions: Contribution[];
}

/**
 * Calculate decayed scores for multiple contributors
 * @param contributors Map of contributor address to their contributions
 * @returns Array of decay results
 */
export function calculateContributorDecays(
  contributors: Map<string, Contribution[]>
): ContributorDecayResult[] {
  const results: ContributorDecayResult[] = [];

  for (const [contributor, contributions] of contributors.entries()) {
    const originalScore = contributions.reduce((sum, c) => sum + c.score, 0);
    const decayedScore = calculateTotalDecayedScore(contributions);

    results.push({
      contributor,
      originalScore,
      decayedScore,
      contributions,
    });
  }

  return results;
}

/**
 * Calculate decay for a single contributor
 * @param contributor Contributor address
 * @param contributions Array of contributions
 * @returns Decay result
 */
export function calculateContributorDecay(
  contributor: string,
  contributions: Contribution[]
): ContributorDecayResult {
  const originalScore = contributions.reduce((sum, c) => sum + c.score, 0);
  const decayedScore = calculateTotalDecayedScore(contributions);

  return {
    contributor,
    originalScore,
    decayedScore,
    contributions,
  };
}

/**
 * Batch calculate decays for efficiency
 * @param contributorContributions Map of contributor to contributions
 * @param batchSize Number of contributors to process per batch
 * @returns Array of decay results
 */
export function batchCalculateDecays(
  contributorContributions: Map<string, Contribution[]>,
  batchSize: number = 100
): ContributorDecayResult[] {
  const results: ContributorDecayResult[] = [];
  const contributors = Array.from(contributorContributions.keys());

  for (let i = 0; i < contributors.length; i += batchSize) {
    const batch = contributors.slice(i, i + batchSize);

    for (const contributor of batch) {
      const contributions = contributorContributions.get(contributor) || [];
      const result = calculateContributorDecay(contributor, contributions);
      results.push(result);
    }
  }

  return results;
}

