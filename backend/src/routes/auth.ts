import { Router } from 'express';
import { getSignerData, getUser, validatePrimaryWallet } from '../services/neynar.js';
import { createSessionToken, generateNonce, generateSessionId } from '../services/session.js';
import { resolvePrimaryWallet } from '../services/wallet.js';

const authRouter = Router();

/**
 * POST /auth/farcaster/session
 * Validates a Farcaster miniapp session
 */
authRouter.post('/farcaster/session', async (req, res) => {
  try {
    const { fid, username, signature, timestamp, signer_uuid } = req.body;

    if (!fid || !signer_uuid) {
      return res.status(400).json({ error: 'Missing required fields: fid and signer_uuid' });
    }

    // Get signer data from Neynar
    const signerData = await getSignerData(signer_uuid);

    // Verify signer belongs to the FID
    if (BigInt(signerData.fid) !== BigInt(fid)) {
      return res.status(403).json({ error: 'Signer does not belong to the provided FID' });
    }

    // Get user and primary wallet
    const user = await getUser(BigInt(fid));

    // Validate primary wallet exists and is not custody
    if (!user.primaryAddress || user.primaryAddress.toLowerCase() === user.custodyAddress.toLowerCase()) {
      return res.status(403).json({
        error: 'No valid primary wallet found. Please connect a primary wallet in Farcaster.'
      });
    }

    // Create session
    const sessionId = generateSessionId();
    const sessionToken = createSessionToken({
      fid: BigInt(fid),
      walletAddress: user.primaryAddress,
      platform: 'farcaster',
      sessionId,
    });

    res.json({
      session_id: sessionId,
      session_token: sessionToken,
      primary_wallet: user.primaryAddress,
    });
  } catch (error) {
    console.error('Error in /auth/farcaster/session:', error);
    res.status(500).json({
      error: 'Failed to create session',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /auth/web/signin
 * Validates WalletConnect wallet login
 */
authRouter.post('/web/signin', async (req, res) => {
  try {
    const { address, signature, nonce, fid } = req.body;

    if (!address || !signature || !nonce) {
      return res.status(400).json({ error: 'Missing required fields: address, signature, nonce' });
    }

    // If FID is provided, validate wallet matches primary wallet
    if (fid) {
      const isValid = await validatePrimaryWallet(BigInt(fid), address);
      if (!isValid) {
        return res.status(403).json({
          error: 'Wallet address does not match primary Farcaster wallet'
        });
      }
    }

    // TODO: Verify signature against nonce
    // For now, we'll trust the wallet connection

    // Create session
    const sessionId = generateSessionId();
    const sessionToken = createSessionToken({
      fid: fid ? BigInt(fid) : undefined,
      walletAddress: address,
      platform: 'web',
      sessionId,
    });

    res.json({
      session_id: sessionId,
      session_token: sessionToken,
    });
  } catch (error) {
    console.error('Error in /auth/web/signin:', error);
    res.status(500).json({
      error: 'Failed to sign in',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /auth/telegram/link
 * Links Telegram ID to Farcaster identity
 */
authRouter.post('/telegram/link', async (req, res) => {
  try {
    const { telegram_id, fid, session_id } = req.body;

    if (!telegram_id || !fid) {
      return res.status(400).json({ error: 'Missing required fields: telegram_id and fid' });
    }

    // TODO: Implement database linking
    // For now, just return success

    res.json({
      success: true,
      message: 'Telegram account linked to Farcaster identity',
    });
  } catch (error) {
    console.error('Error in /auth/telegram/link:', error);
    res.status(500).json({
      error: 'Failed to link accounts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /auth/nonce
 * Get a nonce for web UI session
 */
authRouter.post('/nonce', async (req, res) => {
  try {
    const nonce = generateNonce();
    // TODO: Store nonce with expiration in Redis or DB
    res.json({ nonce });
  } catch (error) {
    console.error('Error generating nonce:', error);
    res.status(500).json({ error: 'Failed to generate nonce' });
  }
});

export { authRouter };

