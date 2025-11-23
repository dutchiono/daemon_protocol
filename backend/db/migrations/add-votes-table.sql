-- Migration: Add votes table for Reddit-style upvote/downvote system
-- This table supports voting on both posts and comments

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    did VARCHAR(255) NOT NULL,                    -- Voter's DID (did:daemon:${fid})
    target_hash VARCHAR(66) NOT NULL,             -- Target message hash (post or comment)
    target_type VARCHAR(20) NOT NULL,             -- 'post' or 'comment'
    vote_type VARCHAR(10) NOT NULL,               -- 'UP' or 'DOWN'
    timestamp BIGINT NOT NULL,                    -- Unix timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (target_hash) REFERENCES messages(hash) ON DELETE CASCADE,
    UNIQUE(did, target_hash)                      -- One vote per user per post/comment
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_votes_target_hash ON votes(target_hash);
CREATE INDEX IF NOT EXISTS idx_votes_did ON votes(did);
CREATE INDEX IF NOT EXISTS idx_votes_target_type ON votes(target_type);
CREATE INDEX IF NOT EXISTS idx_votes_timestamp ON votes(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_votes_target_hash_type ON votes(target_hash, target_type);

-- Composite index for vote aggregation queries
CREATE INDEX IF NOT EXISTS idx_votes_target_vote_type ON votes(target_hash, vote_type);

