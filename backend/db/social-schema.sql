-- Database Schema for Daemon Social Network

-- Users table (on-chain identity mapping)
CREATE TABLE IF NOT EXISTS users (
    fid BIGINT PRIMARY KEY,                    -- Farcaster ID (on-chain)
    address VARCHAR(42) UNIQUE NOT NULL,      -- Ethereum address
    recovery_address VARCHAR(42),              -- Recovery address
    created_at TIMESTAMP NOT NULL,             -- Account creation timestamp
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT true
);

-- Signing keys for users
CREATE TABLE IF NOT EXISTS user_keys (
    id SERIAL PRIMARY KEY,
    fid BIGINT NOT NULL,
    key_bytes BYTEA NOT NULL,                 -- Ed25519 public key (32 bytes)
    key_type VARCHAR(20) DEFAULT 'ed25519',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP,
    FOREIGN KEY (fid) REFERENCES users(fid) ON DELETE CASCADE,
    UNIQUE(fid, key_bytes)
);

-- User profiles
CREATE TABLE IF NOT EXISTS profiles (
    fid BIGINT PRIMARY KEY,
    username VARCHAR(255) UNIQUE,             -- Optional username
    display_name VARCHAR(255),
    bio TEXT,
    avatar_cid VARCHAR(255),                  -- IPFS CID for avatar
    banner_cid VARCHAR(255),                  -- IPFS CID for banner
    location VARCHAR(255),
    website VARCHAR(255),
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fid) REFERENCES users(fid) ON DELETE CASCADE
);

-- Messages/Casts table
CREATE TABLE IF NOT EXISTS messages (
    hash VARCHAR(66) PRIMARY KEY,              -- Message hash (keccak256)
    fid BIGINT NOT NULL,                      -- Author FID
    text TEXT NOT NULL,                       -- Message content (max 280 for casts)
    message_type VARCHAR(20) DEFAULT 'cast',   -- 'cast', 'post', 'reply'
    parent_hash VARCHAR(66),                   -- Parent message hash (for replies)
    root_parent_hash VARCHAR(66),              -- Root message hash (for threads)
    mentions BIGINT[],                         -- Array of mentioned FIDs
    mentions_positions INTEGER[],             -- Positions of mentions in text
    timestamp BIGINT NOT NULL,                 -- Unix timestamp
    deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fid) REFERENCES users(fid) ON DELETE CASCADE,
    FOREIGN KEY (parent_hash) REFERENCES messages(hash) ON DELETE SET NULL
);

-- Message embeds
CREATE TABLE IF NOT EXISTS message_embeds (
    id SERIAL PRIMARY KEY,
    message_hash VARCHAR(66) NOT NULL,
    embed_type VARCHAR(20) NOT NULL,          -- 'url', 'cast', 'image', 'video', 'audio'
    url TEXT,
    cast_hash VARCHAR(66),                    -- For cast embeds
    metadata JSONB,                           -- Additional metadata (title, description, etc.)
    FOREIGN KEY (message_hash) REFERENCES messages(hash) ON DELETE CASCADE,
    FOREIGN KEY (cast_hash) REFERENCES messages(hash) ON DELETE SET NULL
);

-- Reactions table
CREATE TABLE IF NOT EXISTS reactions (
    id SERIAL PRIMARY KEY,
    fid BIGINT NOT NULL,                      -- Reactor FID
    target_hash VARCHAR(66) NOT NULL,         -- Target message hash
    reaction_type VARCHAR(20) NOT NULL,       -- 'like', 'repost', 'quote'
    timestamp BIGINT NOT NULL,
    active BOOLEAN DEFAULT true,              -- For unlike/unrepost
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fid) REFERENCES users(fid) ON DELETE CASCADE,
    FOREIGN KEY (target_hash) REFERENCES messages(hash) ON DELETE CASCADE,
    UNIQUE(fid, target_hash, reaction_type)
);

-- Follows table
CREATE TABLE IF NOT EXISTS follows (
    id SERIAL PRIMARY KEY,
    follower_fid BIGINT NOT NULL,             -- Follower FID
    following_fid BIGINT NOT NULL,            -- Following FID
    timestamp BIGINT NOT NULL,
    active BOOLEAN DEFAULT true,              -- For unfollow
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_fid) REFERENCES users(fid) ON DELETE CASCADE,
    FOREIGN KEY (following_fid) REFERENCES users(fid) ON DELETE CASCADE,
    UNIQUE(follower_fid, following_fid)
);

-- Feeds table (algorithmic feed state)
CREATE TABLE IF NOT EXISTS feeds (
    id SERIAL PRIMARY KEY,
    fid BIGINT NOT NULL,                      -- Feed owner FID
    feed_type VARCHAR(20) NOT NULL,           -- 'chronological', 'algorithmic'
    message_hash VARCHAR(66) NOT NULL,        -- Message in feed
    score DECIMAL(20, 10),                    -- Algorithmic score (for algorithmic feeds)
    position INTEGER,                         -- Position in feed
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fid) REFERENCES users(fid) ON DELETE CASCADE,
    FOREIGN KEY (message_hash) REFERENCES messages(hash) ON DELETE CASCADE
);

-- Network nodes (hubs, PDS, gateways)
CREATE TABLE IF NOT EXISTS network_nodes (
    id SERIAL PRIMARY KEY,
    operator_address VARCHAR(42) NOT NULL,   -- Operator Ethereum address
    node_type VARCHAR(20) NOT NULL,          -- 'hub', 'pds', 'gateway'
    endpoint VARCHAR(255) NOT NULL,           -- Node endpoint URL
    stake_amount DECIMAL(30, 18),             -- Staked DAEMON amount
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_heartbeat TIMESTAMP,
    active BOOLEAN DEFAULT true,
    uptime_percentage DECIMAL(5, 2) DEFAULT 100.00,
    message_throughput BIGINT DEFAULT 0,
    user_count INTEGER DEFAULT 0,           -- For PDS nodes
    api_requests BIGINT DEFAULT 0,            -- For Gateway nodes
    UNIQUE(operator_address, node_type)
);

-- Node metrics history
CREATE TABLE IF NOT EXISTS node_metrics (
    id SERIAL PRIMARY KEY,
    node_id INTEGER NOT NULL,
    epoch_day INTEGER NOT NULL,               -- Epoch day for metrics
    uptime_percentage DECIMAL(5, 2),
    message_throughput BIGINT,
    user_count INTEGER,
    api_requests BIGINT,
    score DECIMAL(20, 10),                    -- Calculated performance score
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (node_id) REFERENCES network_nodes(id) ON DELETE CASCADE,
    UNIQUE(node_id, epoch_day)
);

-- Fee distribution records
CREATE TABLE IF NOT EXISTS fee_distributions (
    id SERIAL PRIMARY KEY,
    epoch_day INTEGER NOT NULL,
    node_id INTEGER NOT NULL,
    amount DECIMAL(30, 18) NOT NULL,
    currency VARCHAR(10) DEFAULT 'DAEMON',
    transaction_hash VARCHAR(66),
    status VARCHAR(20) DEFAULT 'pending',    -- 'pending', 'distributed', 'failed'
    distributed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (node_id) REFERENCES network_nodes(id) ON DELETE CASCADE
);

-- x402 payment records
CREATE TABLE IF NOT EXISTS x402_payments (
    id SERIAL PRIMARY KEY,
    transaction_hash VARCHAR(66) UNIQUE NOT NULL,
    payer_address VARCHAR(42) NOT NULL,
    amount DECIMAL(30, 18) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    resource_path VARCHAR(255),               -- Resource that was paid for
    access_token TEXT,                        -- Generated access token
    block_number BIGINT,
    timestamp BIGINT NOT NULL,
    expires_at TIMESTAMP,                     -- Access token expiry
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Access tokens (for x402 payments)
CREATE TABLE IF NOT EXISTS access_tokens (
    id SERIAL PRIMARY KEY,
    token_hash VARCHAR(66) UNIQUE NOT NULL,  -- Hash of access token
    payment_id INTEGER NOT NULL,              -- Reference to x402_payments
    fid BIGINT,                               -- User FID (if authenticated)
    scope TEXT[],                             -- Allowed endpoints
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT false,
    FOREIGN KEY (payment_id) REFERENCES x402_payments(id) ON DELETE CASCADE,
    FOREIGN KEY (fid) REFERENCES users(fid) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_fid ON messages(fid);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_parent ON messages(parent_hash);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type);
CREATE INDEX IF NOT EXISTS idx_reactions_target ON reactions(target_hash);
CREATE INDEX IF NOT EXISTS idx_reactions_fid ON reactions(fid);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_fid);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_fid);
CREATE INDEX IF NOT EXISTS idx_follows_active ON follows(active);
CREATE INDEX IF NOT EXISTS idx_feeds_fid ON feeds(fid);
CREATE INDEX IF NOT EXISTS idx_feeds_type ON feeds(feed_type);
CREATE INDEX IF NOT EXISTS idx_feeds_score ON feeds(score DESC);
CREATE INDEX IF NOT EXISTS idx_network_nodes_type ON network_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_network_nodes_active ON network_nodes(active);
CREATE INDEX IF NOT EXISTS idx_node_metrics_epoch ON node_metrics(epoch_day);
CREATE INDEX IF NOT EXISTS idx_fee_distributions_epoch ON fee_distributions(epoch_day);
CREATE INDEX IF NOT EXISTS idx_fee_distributions_status ON fee_distributions(status);
CREATE INDEX IF NOT EXISTS idx_x402_payments_payer ON x402_payments(payer_address);
CREATE INDEX IF NOT EXISTS idx_x402_payments_timestamp ON x402_payments(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_access_tokens_expires ON access_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_access_tokens_revoked ON access_tokens(revoked);

-- PDS users table (for Personal Data Server)
CREATE TABLE IF NOT EXISTS pds_users (
    did VARCHAR(255) PRIMARY KEY,            -- Decentralized Identifier
    handle VARCHAR(255) UNIQUE NOT NULL,      -- User handle
    email VARCHAR(255),
    password_hash VARCHAR(255),              -- Hashed password
    migrated_to VARCHAR(255),                -- New PDS if migrated
    migrated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PDS records table (AT Protocol records)
CREATE TABLE IF NOT EXISTS pds_records (
    id SERIAL PRIMARY KEY,
    uri VARCHAR(255) UNIQUE NOT NULL,         -- AT Protocol URI
    repo VARCHAR(255) NOT NULL,                -- User DID
    collection VARCHAR(255) NOT NULL,          -- Collection name
    record_data JSONB NOT NULL,                -- Record data
    cid VARCHAR(255),                         -- Content ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Full-text search index for messages
CREATE INDEX IF NOT EXISTS idx_messages_text_search ON messages USING gin(to_tsvector('english', text));

-- Indexes for PDS tables
CREATE INDEX IF NOT EXISTS idx_pds_records_repo ON pds_records(repo);
CREATE INDEX IF NOT EXISTS idx_pds_records_collection ON pds_records(collection);
CREATE INDEX IF NOT EXISTS idx_pds_records_created ON pds_records(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_messages_fid_timestamp ON messages(fid, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_reactions_fid_type ON reactions(fid, reaction_type);
CREATE INDEX IF NOT EXISTS idx_feeds_fid_type_score ON feeds(fid, feed_type, score DESC NULLS LAST);

-- Votes table for Reddit-style upvote/downvote system
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

-- Indexes for votes table
CREATE INDEX IF NOT EXISTS idx_votes_target_hash ON votes(target_hash);
CREATE INDEX IF NOT EXISTS idx_votes_did ON votes(did);
CREATE INDEX IF NOT EXISTS idx_votes_target_type ON votes(target_type);
CREATE INDEX IF NOT EXISTS idx_votes_timestamp ON votes(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_votes_target_hash_type ON votes(target_hash, target_type);
CREATE INDEX IF NOT EXISTS idx_votes_target_vote_type ON votes(target_hash, vote_type);

