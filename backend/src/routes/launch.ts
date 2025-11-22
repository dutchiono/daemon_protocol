import { Router } from 'express';
import { verifySessionToken } from '../services/session.js';
import { resolvePrimaryWallet } from '../services/wallet.js';
import { uploadMetadata } from '../services/metadata.js';
import { buildDeployTransaction } from '../services/factory.js';

const launchRouter = Router();

/**
 * Middleware to verify session
 */
async function verifySession(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);
  const session = verifySessionToken(token);

  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  req.session = session;
  next();
}

/**
 * POST /factory/draft
 * Create a draft token deployment configuration
 * NOTE: This needs to be adapted to use daemon's SDK instead of FEY SDK
 */
launchRouter.post('/draft', verifySession, async (req, res) => {
  try {
    const { name, symbol, image, description, fee_share_bps } = req.body;
    const session = req.session;

    if (!name || !symbol || !image) {
      return res.status(400).json({ error: 'Missing required fields: name, symbol, image' });
    }

    // Resolve primary wallet
    let ownerAddress: string;
    if (session.fid) {
      ownerAddress = await resolvePrimaryWallet(session.fid);
    } else {
      ownerAddress = session.walletAddress;
    }

    // Upload metadata
    const metadataUri = await uploadMetadata({
      name,
      description: description || '',
      image,
    });

    // Build deployment transaction using daemon factory service
    const { unsignedTx, nonce } = await buildDeployTransaction(
      {
        creator: ownerAddress,
        name,
        symbol,
        metadata: {
          image,
          description: description || '',
        },
        fee_share_bps: fee_share_bps || 0,
      },
      ownerAddress
    );

    res.json({
      draft: {
        creator: ownerAddress,
        name,
        symbol,
        image,
        description: description || '',
        fee_share_bps: fee_share_bps || 0,
        metadataUri,
      },
      unsigned_tx: unsignedTx,
      nonce: nonce,
    });
  } catch (error) {
    console.error('Error creating draft:', error);
    res.status(500).json({
      error: 'Failed to create draft',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /factory/deploy
 * Deploy a token (enqueue job)
 * NOTE: This needs database integration and factory service
 */
launchRouter.post('/deploy', verifySession, async (req, res) => {
  try {
    const { draft_id, signed_tx, draft } = req.body;
    const session = req.session;

    if (!draft && !draft_id) {
      return res.status(400).json({ error: 'Missing draft or draft_id' });
    }

    // Resolve primary wallet
    let ownerAddress: string;
    if (session.fid) {
      ownerAddress = await resolvePrimaryWallet(session.fid);
    } else {
      ownerAddress = session.walletAddress;
    }

    // Validate owner matches draft
    const payload = draft || {};
    if (payload.creator?.toLowerCase() !== ownerAddress.toLowerCase()) {
      return res.status(403).json({ error: 'Owner address mismatch' });
    }

    // TODO: Database integration and factory service
    // For now, return placeholder
    res.json({
      job_id: '1',
      status: signed_tx ? 'BROADCASTED' : 'PENDING',
    });
  } catch (error) {
    console.error('Error deploying token:', error);
    res.status(500).json({
      error: 'Failed to deploy token',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /factory/job/:jobId
 * Get deployment job status
 */
launchRouter.get('/job/:jobId', verifySession, async (req, res) => {
  try {
    const { jobId } = req.params;

    // TODO: Fetch from database
    res.json({
      job_id: jobId,
      status: 'PENDING',
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching job status:', error);
    res.status(500).json({
      error: 'Failed to fetch job status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { launchRouter };

