/**
 * GitHub API Client
 * Interacts with GitHub API for PR data and contributor information
 */

export interface GitHubPR {
  number: number;
  title: string;
  body: string;
  state: string;
  merged: boolean;
  merged_at: string | null;
  user: {
    login: string;
    id: number;
  };
  labels: Array<{
    name: string;
  }>;
  files?: Array<{
    filename: string;
    additions: number;
    deletions: number;
    changes: number;
  }>;
  reviews?: Array<{
    state: string;
    user: {
      login: string;
    };
  }>;
}

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  baseUrl?: string;
}

/**
 * GitHub API Client Class
 */
export class GitHubClient {
  private config: Required<GitHubConfig>;

  constructor(config: GitHubConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://api.github.com',
    };
  }

  /**
   * Get merged PRs since a timestamp
   * @param since Timestamp to fetch PRs since (ISO 8601 or Unix timestamp)
   * @returns Array of merged PRs
   */
  async getMergedPRs(since: string | number): Promise<GitHubPR[]> {
    const sinceDate = typeof since === 'number'
      ? new Date(since * 1000).toISOString()
      : since;

    const url = `${this.config.baseUrl}/repos/${this.config.owner}/${this.config.repo}/pulls?state=closed&sort=updated&direction=desc`;
    const headers = {
      'Authorization': `token ${this.config.token}`,
      'Accept': 'application/vnd.github.v3+json',
    };

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const prs: GitHubPR[] = await response.json();

    // Filter for merged PRs since the given date
    return prs.filter(pr => {
      if (!pr.merged || !pr.merged_at) return false;
      const mergedDate = new Date(pr.merged_at);
      const sinceDateObj = new Date(sinceDate);
      return mergedDate >= sinceDateObj;
    });
  }

  /**
   * Get PR details by number
   * @param prNumber PR number
   * @returns PR details
   */
  async getPRDetails(prNumber: number): Promise<GitHubPR> {
    const url = `${this.config.baseUrl}/repos/${this.config.owner}/${this.config.repo}/pulls/${prNumber}`;
    const headers = {
      'Authorization': `token ${this.config.token}`,
      'Accept': 'application/vnd.github.v3+json',
    };

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get files changed in a PR
   * @param prNumber PR number
   * @returns Array of file changes
   */
  async getPRFiles(prNumber: number): Promise<Array<{
    filename: string;
    additions: number;
    deletions: number;
    changes: number;
    status: string;
  }>> {
    const url = `${this.config.baseUrl}/repos/${this.config.owner}/${this.config.repo}/pulls/${prNumber}/files`;
    const headers = {
      'Authorization': `token ${this.config.token}`,
      'Accept': 'application/vnd.github.v3+json',
    };

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get PR reviews
   * @param prNumber PR number
   * @returns Array of reviews
   */
  async getPRReviews(prNumber: number): Promise<Array<{
    state: string;
    user: {
      login: string;
      id: number;
    };
    submitted_at: string;
  }>> {
    const url = `${this.config.baseUrl}/repos/${this.config.owner}/${this.config.repo}/pulls/${prNumber}/reviews`;
    const headers = {
      'Authorization': `token ${this.config.token}`,
      'Accept': 'application/vnd.github.v3+json',
    };

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get contributor address from GitHub username
   * @param username GitHub username
   * @returns Ethereum address if found, null otherwise
   *
   * Note: This would typically query a mapping service or database
   * that links GitHub usernames to Ethereum addresses
   */
  async getContributorAddress(username: string): Promise<string | null> {
    // TODO: Implement mapping from GitHub username to Ethereum address
    // This could be:
    // 1. Query a database/mapping contract
    // 2. Check GitHub profile for address
    // 3. Check commit signatures
    // 4. Use a service like ENS reverse lookup

    // Placeholder - would need actual implementation
    return null;
  }

  /**
   * Check if PR has required approvals
   * @param prNumber PR number
   * @param minApprovals Minimum number of approvals required (default: 1)
   * @returns True if PR has required approvals
   */
  async hasRequiredApprovals(prNumber: number, minApprovals: number = 1): Promise<boolean> {
    const reviews = await this.getPRReviews(prNumber);
    const approvedCount = reviews.filter(r => r.state === 'APPROVED').length;
    return approvedCount >= minApprovals;
  }
}

