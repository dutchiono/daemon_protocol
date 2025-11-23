-- Migration: Change from fid to did
-- This migrates the database schema to use did (did:daemon:${fid}) instead of fid

-- Step 1: Add did column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS did VARCHAR(255);

-- Step 2: Populate did column from existing fid values
UPDATE users SET did = 'did:daemon:' || fid::text WHERE did IS NULL;

-- Step 3: Make did NOT NULL and add unique constraint
ALTER TABLE users ALTER COLUMN did SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_did ON users(did);

-- Step 4: Add did column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS did VARCHAR(255);

-- Step 5: Populate did column in profiles from users table
UPDATE profiles p SET did = u.did
FROM users u
WHERE p.fid = u.fid AND p.did IS NULL;

-- Step 6: Make did NOT NULL in profiles
ALTER TABLE profiles ALTER COLUMN did SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_did ON profiles(did);

-- Step 7: Add did to other tables that reference fid
-- Messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS did VARCHAR(255);
UPDATE messages m SET did = u.did
FROM users u
WHERE m.fid = u.fid AND m.did IS NULL;

-- Reactions table
ALTER TABLE reactions ADD COLUMN IF NOT EXISTS did VARCHAR(255);
UPDATE reactions r SET did = u.did
FROM users u
WHERE r.fid = u.fid AND r.did IS NULL;

-- Follows table (follower)
ALTER TABLE follows ADD COLUMN IF NOT EXISTS follower_did VARCHAR(255);
UPDATE follows f SET follower_did = u.did
FROM users u
WHERE f.follower_fid = u.fid AND f.follower_did IS NULL;

-- Follows table (following)
ALTER TABLE follows ADD COLUMN IF NOT EXISTS following_did VARCHAR(255);
UPDATE follows f SET following_did = u.did
FROM users u
WHERE f.following_fid = u.fid AND f.following_did IS NULL;

-- Feeds table
ALTER TABLE feeds ADD COLUMN IF NOT EXISTS did VARCHAR(255);
UPDATE feeds f SET did = u.did
FROM users u
WHERE f.fid = u.fid AND f.did IS NULL;

-- User keys table
ALTER TABLE user_keys ADD COLUMN IF NOT EXISTS did VARCHAR(255);
UPDATE user_keys uk SET did = u.did
FROM users u
WHERE uk.fid = u.fid AND uk.did IS NULL;

-- Note: We keep fid columns for now for backward compatibility
-- In the future, we can drop fid columns after verifying everything works with did

