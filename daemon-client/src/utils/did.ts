/**
 * Convert numeric FID to DID string
 */
export function fidToDid(fid: number | null): string | null {
  if (fid === null || fid === undefined) {
    return null;
  }
  return `did:daemon:${fid}`;
}

/**
 * Extract FID from DID string
 */
export function didToFid(did: string): number | null {
  const match = did.match(/^did:daemon:(\d+)$/);
  if (!match) {
    return null;
  }
  return parseInt(match[1], 10);
}

