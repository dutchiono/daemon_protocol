-- Add UNIQUE constraint on follower_did, following_did for follows table
-- This allows us to use DIDs directly without needing FIDs

-- First, ensure the columns exist and are populated
ALTER TABLE follows ADD COLUMN IF NOT EXISTS follower_did VARCHAR(255);
ALTER TABLE follows ADD COLUMN IF NOT EXISTS following_did VARCHAR(255);

-- Populate from existing FIDs if not already populated
UPDATE follows f SET follower_did = u.did
FROM users u
WHERE f.follower_fid = u.fid AND f.follower_did IS NULL;

UPDATE follows f SET following_did = u.did
FROM users u
WHERE f.following_fid = u.fid AND f.following_did IS NULL;

-- Add UNIQUE constraint on DID columns
CREATE UNIQUE INDEX IF NOT EXISTS idx_follows_did_unique ON follows(follower_did, following_did);

-- Make DID columns NOT NULL (after population)
ALTER TABLE follows ALTER COLUMN follower_did SET NOT NULL;
ALTER TABLE follows ALTER COLUMN following_did SET NOT NULL;

