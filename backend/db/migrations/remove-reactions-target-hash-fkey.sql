-- Remove foreign key constraint on reactions.target_hash
-- Posts are stored in PDS with AT Protocol URIs, not always in messages table
-- We validate existence in code, so the foreign key constraint is too restrictive

ALTER TABLE reactions DROP CONSTRAINT IF EXISTS reactions_target_hash_fkey CASCADE;

-- Note: We still validate that posts exist (in messages table or PDS) before creating reactions
-- This is done in the application code in aggregation-layer.ts createReaction method

