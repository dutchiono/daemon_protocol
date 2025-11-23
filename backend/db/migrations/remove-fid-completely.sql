-- Migration: Remove FID completely, use DID as primary identifier
-- This is a breaking change - all FID columns will be removed

-- Step 1: Ensure all tables have did columns (from previous migration)
-- This assumes migrate-fid-to-did.sql has already been run

-- Step 2: Update users table - make did the primary key
-- Drop primary key with CASCADE to handle dependent objects
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey CASCADE;
ALTER TABLE users ADD PRIMARY KEY (did);
ALTER TABLE users DROP COLUMN IF EXISTS fid CASCADE;

-- Step 3: Update profiles table - make did the primary key
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_pkey CASCADE;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_fid_fkey CASCADE;
ALTER TABLE profiles ADD PRIMARY KEY (did);
ALTER TABLE profiles DROP COLUMN IF EXISTS fid CASCADE;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_did_fkey;
ALTER TABLE profiles ADD CONSTRAINT profiles_did_fkey FOREIGN KEY (did) REFERENCES users(did) ON DELETE CASCADE;

-- Step 4: Update user_keys table
-- First, add did column if it doesn't exist
ALTER TABLE user_keys ADD COLUMN IF NOT EXISTS did VARCHAR(255);

-- Update did from users table only if both fid columns exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_keys' AND column_name = 'fid')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'fid') THEN
    UPDATE user_keys uk SET did = u.did FROM users u WHERE uk.fid = u.fid AND uk.did IS NULL;
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_keys' AND column_name = 'fid') THEN
    -- If users.fid doesn't exist but user_keys.fid does, we can't map them
    -- This means users table was already migrated - skip the update
    RAISE NOTICE 'Skipping user_keys did update - users.fid already removed';
  END IF;
END $$;

-- Drop constraints and column with CASCADE
ALTER TABLE user_keys DROP CONSTRAINT IF EXISTS user_keys_fid_fkey CASCADE;
ALTER TABLE user_keys DROP COLUMN IF EXISTS fid CASCADE;
ALTER TABLE user_keys DROP CONSTRAINT IF EXISTS user_keys_fid_key_bytes_key CASCADE;

-- Set did as NOT NULL only if we have data
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM user_keys WHERE did IS NOT NULL) THEN
    ALTER TABLE user_keys ALTER COLUMN did SET NOT NULL;
  END IF;
END $$;

-- Add new constraints (drop first to avoid conflicts)
ALTER TABLE user_keys DROP CONSTRAINT IF EXISTS user_keys_did_key_bytes_key;
ALTER TABLE user_keys ADD CONSTRAINT user_keys_did_key_bytes_key UNIQUE(did, key_bytes);
ALTER TABLE user_keys DROP CONSTRAINT IF EXISTS user_keys_did_fkey;
ALTER TABLE user_keys ADD CONSTRAINT user_keys_did_fkey FOREIGN KEY (did) REFERENCES users(did) ON DELETE CASCADE;

-- Step 5: Update messages table
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_fid_fkey CASCADE;
ALTER TABLE messages DROP COLUMN IF EXISTS fid CASCADE;
ALTER TABLE messages ALTER COLUMN did SET NOT NULL;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_did_fkey;
ALTER TABLE messages ADD CONSTRAINT messages_did_fkey FOREIGN KEY (did) REFERENCES users(did) ON DELETE CASCADE;
DROP INDEX IF EXISTS idx_messages_fid;
CREATE INDEX IF NOT EXISTS idx_messages_did ON messages(did);
CREATE INDEX IF NOT EXISTS idx_messages_did_timestamp ON messages(did, timestamp DESC);

-- Step 6: Update reactions table
ALTER TABLE reactions DROP CONSTRAINT IF EXISTS reactions_fid_fkey CASCADE;
ALTER TABLE reactions DROP COLUMN IF EXISTS fid CASCADE;
ALTER TABLE reactions ALTER COLUMN did SET NOT NULL;
ALTER TABLE reactions DROP CONSTRAINT IF EXISTS reactions_did_fkey;
ALTER TABLE reactions ADD CONSTRAINT reactions_did_fkey FOREIGN KEY (did) REFERENCES users(did) ON DELETE CASCADE;
DROP INDEX IF EXISTS idx_reactions_fid;
CREATE INDEX IF NOT EXISTS idx_reactions_did ON reactions(did);
DROP INDEX IF EXISTS idx_reactions_fid_type;
CREATE INDEX IF NOT EXISTS idx_reactions_did_type ON reactions(did, reaction_type);
DROP INDEX IF EXISTS idx_reactions_fid_target;
ALTER TABLE reactions DROP CONSTRAINT IF EXISTS reactions_fid_target_hash_reaction_type_key;
ALTER TABLE reactions DROP CONSTRAINT IF EXISTS reactions_did_target_hash_reaction_type_key;
ALTER TABLE reactions ADD CONSTRAINT reactions_did_target_hash_reaction_type_key UNIQUE(did, target_hash, reaction_type);

-- Step 7: Update follows table (already has follower_did and following_did from previous migration)
ALTER TABLE follows DROP CONSTRAINT IF EXISTS follows_follower_fid_fkey CASCADE;
ALTER TABLE follows DROP CONSTRAINT IF EXISTS follows_following_fid_fkey CASCADE;
ALTER TABLE follows DROP COLUMN IF EXISTS follower_fid CASCADE;
ALTER TABLE follows DROP COLUMN IF EXISTS following_fid CASCADE;
DROP INDEX IF EXISTS idx_follows_follower;
DROP INDEX IF EXISTS idx_follows_following;
CREATE INDEX IF NOT EXISTS idx_follows_follower_did ON follows(follower_did);
CREATE INDEX IF NOT EXISTS idx_follows_following_did ON follows(following_did);

-- Step 8: Update feeds table
ALTER TABLE feeds DROP CONSTRAINT IF EXISTS feeds_fid_fkey CASCADE;
ALTER TABLE feeds DROP COLUMN IF EXISTS fid CASCADE;
-- Add did column if it doesn't exist
ALTER TABLE feeds ADD COLUMN IF NOT EXISTS did VARCHAR(255);
-- Set did as NOT NULL only if column exists and has data
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feeds' AND column_name = 'did') THEN
    IF EXISTS (SELECT 1 FROM feeds WHERE did IS NOT NULL LIMIT 1) THEN
      ALTER TABLE feeds ALTER COLUMN did SET NOT NULL;
    END IF;
  END IF;
END $$;
ALTER TABLE feeds DROP CONSTRAINT IF EXISTS feeds_did_fkey;
ALTER TABLE feeds ADD CONSTRAINT feeds_did_fkey FOREIGN KEY (did) REFERENCES users(did) ON DELETE CASCADE;
DROP INDEX IF EXISTS idx_feeds_fid CASCADE;
CREATE INDEX IF NOT EXISTS idx_feeds_did ON feeds(did);
DROP INDEX IF EXISTS idx_feeds_fid_type CASCADE;
CREATE INDEX IF NOT EXISTS idx_feeds_did_type ON feeds(did, feed_type);
DROP INDEX IF EXISTS idx_feeds_fid_type_score CASCADE;
CREATE INDEX IF NOT EXISTS idx_feeds_did_type_score ON feeds(did, feed_type, score DESC NULLS LAST);

-- Step 9: Update access_tokens table
ALTER TABLE access_tokens DROP CONSTRAINT IF EXISTS access_tokens_fid_fkey CASCADE;
ALTER TABLE access_tokens DROP COLUMN IF EXISTS fid CASCADE;
ALTER TABLE access_tokens ADD COLUMN IF NOT EXISTS did VARCHAR(255);
-- Note: This migration doesn't populate did for access_tokens as they may not have corresponding users
-- You may need to handle this separately or allow NULL for now

-- Step 10: Update messages.mentions to be VARCHAR[] instead of BIGINT[]
-- This is tricky - we'll need to convert existing numeric mentions to DIDs
-- For now, we'll keep it as is but update the application code to use DIDs

-- Step 11: Remove any remaining FID references
-- Check for any remaining FID columns
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE column_name = 'fid'
        AND table_schema = 'public'
    LOOP
        RAISE NOTICE 'Found remaining FID column: %.%', r.table_name, r.column_name;
    END LOOP;
END $$;

