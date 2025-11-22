/**
 * PR Analyzer
 * Analyzes PR content to determine contribution type and calculate scores
 */

import { GitHubPR } from './client.js';
import { getContributionType, calculateWeightedScore, BASE_SCORES, DEFAULT_CONTRIBUTION_WEIGHTS } from '../scoring/weights.js';
import type { ContributionWeights } from '../scoring/weights.js';

export interface ContributionAnalysis {
  type: string;
  score: number;
  baseScore: number;
  weight: number;
  filesAnalyzed: number;
  linesChanged: number;
  hasTests: boolean;
  hasDocs: boolean;
}

/**
 * Analyze a PR to determine contribution type and score
 * @param pr GitHub PR object
 * @param files Array of file changes (optional, will fetch if not provided)
 * @param weights Contribution weights (optional, uses defaults if not provided)
 * @returns Contribution analysis
 */
export async function analyzePR(
  pr: GitHubPR,
  files?: Array<{
    filename: string;
    additions: number;
    deletions: number;
    changes: number;
  }>,
  weights: ContributionWeights = DEFAULT_CONTRIBUTION_WEIGHTS
): Promise<ContributionAnalysis> {
  // Determine contribution type from PR title, body, and labels
  const type = determineContributionType(pr);

  // Get base score for the type
  const baseScore = getBaseScoreForType(type);

  // Get weight for the type
  const weight = weights[type as keyof ContributionWeights] || weights.code;

  // Calculate weighted score
  const score = calculateWeightedScore(baseScore, weight);

  // Analyze files if provided
  let filesAnalyzed = 0;
  let linesChanged = 0;
  let hasTests = false;
  let hasDocs = false;

  if (files && files.length > 0) {
    filesAnalyzed = files.length;
    linesChanged = files.reduce((sum, file) => sum + file.changes, 0);
    hasTests = files.some(file =>
      file.filename.includes('.test.') ||
      file.filename.includes('.spec.') ||
      file.filename.includes('__tests__') ||
      file.filename.includes('test/')
    );
    hasDocs = files.some(file =>
      file.filename.includes('.md') ||
      file.filename.includes('docs/') ||
      file.filename.includes('README')
    );
  }

  return {
    type,
    score,
    baseScore,
    weight,
    filesAnalyzed,
    linesChanged,
    hasTests,
    hasDocs,
  };
}

/**
 * Determine contribution type from PR metadata
 * @param pr GitHub PR object
 * @returns Contribution type string
 */
function determineContributionType(pr: GitHubPR): string {
  const title = pr.title.toLowerCase();
  const body = pr.body?.toLowerCase() || '';
  const labels = pr.labels.map(l => l.name.toLowerCase());

  const combined = `${title} ${body} ${labels.join(' ')}`;

  // Check for bugfix
  if (combined.includes('bug') || combined.includes('fix') || labels.includes('bug')) {
    return 'bugfix';
  }

  // Check for feature
  if (combined.includes('feature') || combined.includes('feat') || labels.includes('feature')) {
    return 'feature';
  }

  // Check for refactor
  if (combined.includes('refactor') || labels.includes('refactor')) {
    return 'refactor';
  }

  // Check for tests
  if (combined.includes('test') || labels.includes('test') || labels.includes('testing')) {
    return 'tests';
  }

  // Check for docs
  if (combined.includes('doc') || labels.includes('documentation') || labels.includes('docs')) {
    return 'docs';
  }

  // Check for SDK
  if (combined.includes('sdk') || labels.includes('sdk')) {
    return 'sdk';
  }

  // Default to code
  return 'code';
}

/**
 * Get base score for a contribution type
 * @param type Contribution type
 * @returns Base score
 */
function getBaseScoreForType(type: string): number {
  switch (type) {
    case 'code':
      return BASE_SCORES.CODE;
    case 'sdk':
      return BASE_SCORES.SDK;
    case 'docs':
      return BASE_SCORES.DOCS;
    case 'tests':
      return BASE_SCORES.TESTS;
    case 'bugfix':
      return BASE_SCORES.BUGFIX;
    case 'feature':
      return BASE_SCORES.FEATURE;
    case 'refactor':
      return BASE_SCORES.REFACTOR;
    default:
      return BASE_SCORES.CODE;
  }
}

/**
 * Validate PR is eligible for contribution
 * @param pr GitHub PR object
 * @param reviews Array of PR reviews
 * @returns True if PR is eligible
 */
export function isPREligible(
  pr: GitHubPR,
  reviews: Array<{ state: string }> = []
): boolean {
  // Must be merged
  if (!pr.merged) return false;

  // Must have at least one approval
  const hasApproval = reviews.some(r => r.state === 'APPROVED');
  if (!hasApproval) return false;

  // Must not be a draft
  if (pr.state === 'draft') return false;

  return true;
}

