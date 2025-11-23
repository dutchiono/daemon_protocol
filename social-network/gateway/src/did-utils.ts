/**
 * @title DID Utilities
 * @notice Helper functions to convert between did and fid
 */

/**
 * Convert FID (number) to DID (string)
 */
export function fidToDid(fid: number): string {
  return `did:daemon:${fid}`;
}

/**
 * Convert DID (string) to FID (number)
 */
export function didToFid(did: string): number {
  const match = did.match(/^did:daemon:(\d+)$/);
  if (!match) {
    throw new Error(`Invalid DID format: ${did}`);
  }
  const fid = parseInt(match[1], 10);
  if (isNaN(fid) || fid <= 0) {
    throw new Error(`Invalid FID extracted from DID: ${did}`);
  }
  return fid;
}

/**
 * Validate DID format
 */
export function isValidDid(did: string): boolean {
  return /^did:daemon:\d+$/.test(did);
}

