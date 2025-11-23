-- Migration: Fix votes table to support AT Protocol URIs
-- AT Protocol URIs are longer than 66 characters (e.g., at://did:daemon:1/app.daemon.feed.post/1763912220233)
-- Also need to remove foreign key constraint since AT Protocol URIs won't be in messages table

-- Drop the foreign key constraint first
ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_target_hash_fkey;

-- Increase target_hash column size to support AT Protocol URIs
ALTER TABLE votes ALTER COLUMN target_hash TYPE VARCHAR(255);

-- Note: The UNIQUE constraint on (did, target_hash) will still work with longer hashes
-- The indexes will also automatically adjust to the new column size

