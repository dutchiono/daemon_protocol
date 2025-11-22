import { NeynarAPIClient, Configuration } from '@neynar/nodejs-sdk';
import env from '../config/env.js';

const config = new Configuration({
  apiKey: env.NEYNAR_API_KEY,
});
const neynarClient = new NeynarAPIClient(config);

export interface FarcasterUser {
  fid: bigint;
  username: string;
  primaryAddress: string;
  custodyAddress: string;
  verifications: string[];
}

export interface SignerData {
  signer_uuid: string;
  fid: bigint;
  custody_address: string;
}

/**
 * Get Farcaster user by FID
 */
export async function getUser(fid: bigint): Promise<FarcasterUser> {
  try {
    const response = await neynarClient.fetchBulkUsers({
      fids: [Number(fid)],
    });

    // The response has users directly, not nested in result
    const users = response.users || [];
    if (users.length === 0) {
      throw new Error(`User with FID ${fid} not found`);
    }

    const user = users[0];

    // Extract primary wallet (first verification, not custody)
    const verifications = user.verifications || [];
    const custodyAddress = user.custody_address?.toLowerCase() || '';

    // Find primary wallet (first non-custody verification)
    const primaryAddress = verifications
      .map(v => v.toLowerCase())
      .find(addr => addr !== custodyAddress) || verifications[0]?.toLowerCase() || '';

    if (!primaryAddress) {
      throw new Error('No primary wallet found for user');
    }

    return {
      fid: BigInt(user.fid),
      username: user.username || '',
      primaryAddress,
      custodyAddress,
      verifications: verifications.map(v => v.toLowerCase()),
    };
  } catch (error) {
    console.error('Error fetching user from Neynar:', error);
    throw new Error(`Failed to fetch user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get signer data by signer UUID
 */
export async function getSignerData(signer_uuid: string): Promise<SignerData> {
  try {
    const response = await neynarClient.lookupSigner(signer_uuid);
    const signer = response.result;

    return {
      signer_uuid: signer.signer_uuid,
      fid: BigInt(signer.fid),
      custody_address: signer.custody_address?.toLowerCase() || '',
    };
  } catch (error) {
    console.error('Error fetching signer data from Neynar:', error);
    throw new Error(`Failed to fetch signer data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verify signature matches address
 */
export function verifySignature(message: string, signature: string, address: string): boolean {
  try {
    // This is a placeholder - actual implementation depends on signature format
    // For Farcaster, we'll need to use the appropriate verification method
    // For now, we'll assume the backend will handle this via Neynar's verification
    return true; // TODO: Implement proper signature verification
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

/**
 * Validate that an address is the primary wallet (not custody)
 */
export async function validatePrimaryWallet(fid: bigint, address: string): Promise<boolean> {
  try {
    const user = await getUser(fid);
    const normalizedAddress = address.toLowerCase();

    // Must match primary address and NOT be custody address
    return (
      normalizedAddress === user.primaryAddress.toLowerCase() &&
      normalizedAddress !== user.custodyAddress.toLowerCase()
    );
  } catch (error) {
    console.error('Error validating primary wallet:', error);
    return false;
  }
}

/**
 * Publish a cast as the bot
 */
export async function publishCast(text: string, parentHash?: string): Promise<string> {
  if (!env.NEYNAR_SIGNER_UUID) {
    throw new Error('NEYNAR_SIGNER_UUID not configured');
  }

  try {
    const response = await neynarClient.publishCast({
      signer_uuid: env.NEYNAR_SIGNER_UUID,
      text: text,
      parent: parentHash, // parent can be the hash string directly
    });

    return response.cast.hash;
  } catch (error) {
    console.error('Error publishing cast:', error);
    throw new Error(`Failed to publish cast: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export default {
  getUser,
  getSignerData,
  verifySignature,
  validatePrimaryWallet,
  publishCast,
};

