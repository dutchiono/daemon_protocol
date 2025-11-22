/**
 * @title GitHub Address Mapping Service
 * @notice Service for mapping GitHub usernames to Ethereum addresses
 */

export interface GitHubMapping {
    githubUsername: string;
    walletAddress: string;
    verified: boolean;
    verifiedAt?: number;
    signature?: string;
}

const mappings = new Map<string, GitHubMapping>();

/**
 * Register GitHub username to wallet address mapping
 * @param githubUsername GitHub username
 * @param walletAddress Ethereum wallet address
 * @param signature Signature proving ownership
 */
export async function registerGitHubAddress(
    githubUsername: string,
    walletAddress: string,
    signature: string
): Promise<boolean> {
    // Verify signature
    // In production, this would:
    // 1. Verify the signature matches the wallet address
    // 2. Verify the message includes the GitHub username
    // 3. Optionally verify GitHub OAuth token

    const mapping: GitHubMapping = {
        githubUsername,
        walletAddress,
        verified: true,
        verifiedAt: Date.now(),
        signature,
    };

    mappings.set(githubUsername.toLowerCase(), mapping);
    return true;
}

/**
 * Get wallet address from GitHub username
 */
export function getWalletFromGitHub(githubUsername: string): string | null {
    const mapping = mappings.get(githubUsername.toLowerCase());
    return mapping?.walletAddress || null;
}

/**
 * Get GitHub username from wallet address
 */
export function getGitHubFromWallet(walletAddress: string): string | null {
    for (const [username, mapping] of mappings.entries()) {
        if (mapping.walletAddress.toLowerCase() === walletAddress.toLowerCase()) {
            return username;
        }
    }
    return null;
}

/**
 * Verify GitHub ownership
 */
export async function verifyGitHubOwnership(
    githubUsername: string,
    walletAddress: string
): Promise<boolean> {
    const mapping = mappings.get(githubUsername.toLowerCase());
    if (!mapping) {
        return false;
    }

    return (
        mapping.walletAddress.toLowerCase() === walletAddress.toLowerCase() &&
        mapping.verified === true
    );
}

/**
 * Parse GitHub profile for wallet address
 * @param profileData GitHub profile data
 * @returns Wallet address if found in bio/website
 */
export function parseGitHubProfile(profileData: {
    bio?: string;
    blog?: string;
    company?: string;
}): string | null {
    // Look for Ethereum address pattern in bio
    const addressPattern = /0x[a-fA-F0-9]{40}/g;

    const bio = profileData.bio || '';
    const blog = profileData.blog || '';
    const company = profileData.company || '';

    const combined = `${bio} ${blog} ${company}`;
    const match = combined.match(addressPattern);

    if (match && match.length > 0) {
        return match[0];
    }

    return null;
}

