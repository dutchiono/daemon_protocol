import { getUser, validatePrimaryWallet } from './neynar.js';

/**
 * Resolve primary wallet for a Farcaster user
 * CRITICAL: Always returns primary wallet, never custody wallet
 */
export async function resolvePrimaryWallet(fid: bigint): Promise<string> {
  const user = await getUser(fid);

  if (!user.primaryAddress) {
    throw new Error('No primary wallet found. User must connect a primary wallet in Farcaster.');
  }

  if (user.primaryAddress.toLowerCase() === user.custodyAddress.toLowerCase()) {
    throw new Error('Primary wallet matches custody wallet - this is not allowed');
  }

  return user.primaryAddress;
}

/**
 * Check if an address is the primary wallet for a user
 */
export async function isPrimaryWallet(fid: bigint, address: string): Promise<boolean> {
  return validatePrimaryWallet(fid, address);
}

export default {
  resolvePrimaryWallet,
  isPrimaryWallet,
};

