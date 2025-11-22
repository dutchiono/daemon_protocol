// Default to backend port 3000 (matches daemon backend server default)
// You can override this by creating a .env file in the web app directory with:
// VITE_API_BASE_URL=http://localhost:3000
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export interface TokenInfo {
  token_address: string;
  name: string | null;
  symbol: string | null;
  owner_address: string | null;
  original_admin: string | null;
  image: string | null;
  metadata: string | null;
  context: string | null;
  created_at: string;
  confirmed: boolean;
  deployment_info?: any;
}

export interface TokenListResponse {
  tokens: TokenInfo[];
}

/**
 * Get token information by address
 */
export async function getToken(address: string): Promise<TokenInfo> {
  const response = await fetch(`${API_BASE_URL}/token/${address}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch token: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Get tokens by Farcaster ID
 */
export async function getTokensByFid(fid: string): Promise<TokenInfo[]> {
  const response = await fetch(`${API_BASE_URL}/token/by_fid/${fid}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch tokens: ${response.statusText}`);
  }
  const data: TokenListResponse = await response.json();
  return data.tokens;
}

/**
 * Get tokens by wallet address
 * Uses FID lookup via session or wallet address
 */
export async function getTokensByWallet(
  walletAddress: string,
  sessionToken?: string
): Promise<TokenInfo[]> {
  // First try to get FID from session or user lookup
  // For now, we'll need to implement a wallet-to-FID lookup endpoint
  // Or we can search tokens by owner address
  // This is a placeholder - you may want to add a /token/by_wallet/:address endpoint
  const response = await fetch(`${API_BASE_URL}/token/${walletAddress}`, {
    headers: sessionToken
      ? {
          Authorization: `Bearer ${sessionToken}`,
        }
      : {},
  });
  if (!response.ok) {
    return [];
  }
  // This is a workaround - ideally we'd have a proper endpoint
  return [];
}

