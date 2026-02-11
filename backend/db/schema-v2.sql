-- Daemon Social Network - Complete Database Schema v2
-- This replaces the builder rewards schema with proper social network tables

-- Drop old schema if exists
DROP TABLE IF EXISTS daily_distributions CASCADE;
DROP TABLE IF EXISTS github_prs CASCADE;
DROP TABLE IF EXISTS payouts CASCADE;
DROP TABLE IF EXISTS score_history CASCADE;
DROP TABLE IF EXISTS contributions CASCADE;
DROP TABLE IF EXISTS contributors CASCADE;

-- Core Identity Tables

-- Users: Primary identity table
CREATE TABLE users (
    did VARCHAR(255) PRIMARY KEY,  -- did:daemon:123
    handle VARCHAR(64) UNIQUE NOT NULL,
    wallet_address VARCHAR(42) UNIQUE,  -- Ethereum address
    email VARCHAR(255) UNIQUE,  -- For traditional signup
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_handle ON users(handle);

-- Profiles: User profile information
CREATE TABLE profiles (
    did VARCHAR(255) PRIMARY KEY REFERENCES users(did) ON DELETE CASCADE,
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url TEXT,
    banner_url TEXT,
    location VARCHAR(100),
    website VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User Keys: Cryptographic keys for signing
CREATE TABLE user_keys (
    id SERIAL PRIMARY KEY,
    did VARCHAR(255) NOT NULL REFERENCES users(did) ON DELETE CASCADE,
    key_type VARCHAR(20) NOT NULL,  -- 'ed25519', 'secp256k1'
    key_bytes BYTEA NOT NULL,
    key_hex VARCHAR(132) NOT NULL,  -- Hex representation for easy lookup
    purpose VARCHAR(20) NOT NULL,  -- 'signing', 'encryption'
    created_at TIMESTAMP DEFAULT NOW(),
    revoked_at TIMESTAMP,
    UNIQUE(did, key_hex)
);

CREATE INDEX idx_user_keys_did ON user_keys(did);
CREATE INDEX idx_user_keys_hex ON user_keys(key_hex) WHERE revoked_at IS NULL;

-- Content Tables

-- Messages: Posts, replies, reposts
CREATE TABLE messages (
    hash VARCHAR(66) PRIMARY KEY,  -- SHA-256 hash
    did VARCHAR(255) NOT NULL REFERENCES users(did) ON DELETE CASCADE,
    message_type VARCHAR(20) NOT NULL,  -- 'post', 'reply', 'repost'
    text TEXT,
    parent_hash VARCHAR(66) REFERENCES messages(hash) ON DELETE SET NULL,
    root_parent_hash VARCHAR(66) REFERENCES messages(hash) ON DELETE SET NULL,
    timestamp BIGINT NOT NULL,
    signature BYTEA,
    signing_key_hex VARCHAR(132),
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    CHECK (message_type IN ('post', 'reply', 'repost')),
    CHECK (LENGTH(text) <= 280 OR text IS NULL)
);

CREATE INDEX idx_messages_did ON messages(did);
CREATE INDEX idx_messages_did_timestamp ON messages(did, timestamp DESC);
CREATE INDEX idx_messages_parent ON messages(parent_hash) WHERE parent_hash IS NOT NULL;
CREATE INDEX idx_messages_root ON messages(root_parent_hash) WHERE root_parent_hash IS NOT NULL;
CREATE INDEX idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX idx_messages_deleted ON messages(deleted) WHERE NOT deleted;

-- Message Mentions: @mentions in posts
CREATE TABLE message_mentions (
    message_hash VARCHAR(66) NOT NULL REFERENCES messages(hash) ON DELETE CASCADE,
    mentioned_did VARCHAR(255) NOT NULL REFERENCES users(did) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    PRIMARY KEY (message_hash, mentioned_did)
);

CREATE INDEX idx_message_mentions_did ON message_mentions(mentioned_did);

-- Message Embeds: URLs, images, videos
CREATE TABLE message_embeds (
    id SERIAL PRIMARY KEY,
    message_hash VARCHAR(66) NOT NULL REFERENCES messages(hash) ON DELETE CASCADE,
    embed_type VARCHAR(20) NOT NULL,  -- 'url', 'image', 'video', 'audio'
    url TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    CHECK (embed_type IN ('url', 'image', 'video', 'audio', 'cast'))
);

CREATE INDEX idx_message_embeds_hash ON message_embeds(message_hash);

-- Social Graph Tables

-- Follows: User following relationships
CREATE TABLE follows (
    follower_did VARCHAR(255) NOT NULL REFERENCES users(did) ON DELETE CASCADE,
    following_did VARCHAR(255) NOT NULL REFERENCES users(did) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (follower_did, following_did),
    CHECK (follower_did != following_did)
);

CREATE INDEX idx_follows_follower ON follows(follower_did);
CREATE INDEX idx_follows_following ON follows(following_did);

-- Blocks: User blocks
CREATE TABLE blocks (
    blocker_did VARCHAR(255) NOT NULL REFERENCES users(did) ON DELETE CASCADE,
    blocked_did VARCHAR(255) NOT NULL REFERENCES users(did) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (blocker_did, blocked_did),
    CHECK (blocker_did != blocked_did)
);

CREATE INDEX idx_blocks_blocker ON blocks(blocker_did);
CREATE INDEX idx_blocks_blocked ON blocks(blocked_did);

-- Engagement Tables

-- Reactions: Likes, reposts, quotes
CREATE TABLE reactions (
    id SERIAL PRIMARY KEY,
    did VARCHAR(255) NOT NULL REFERENCES users(did) ON DELETE CASCADE,
    target_hash VARCHAR(66) NOT NULL REFERENCES messages(hash) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL,  -- 'like', 'repost', 'quote'
    quote_text TEXT,  -- For quote reposts
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(did, target_hash, reaction_type),
    CHECK (reaction_type IN ('like', 'repost', 'quote')),
    CHECK ((reaction_type = 'quote' AND quote_text IS NOT NULL) OR (reaction_type != 'quote'))
);

CREATE INDEX idx_reactions_target ON reactions(target_hash);
CREATE INDEX idx_reactions_did ON reactions(did);
CREATE INDEX idx_reactions_type ON reactions(reaction_type);

-- Authentication Tables

-- Access Tokens: Short-lived auth tokens
CREATE TABLE access_tokens (
    token VARCHAR(255) PRIMARY KEY,
    did VARCHAR(255) NOT NULL REFERENCES users(did) ON DELETE CASCADE,
    scope TEXT[],
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_access_tokens_did ON access_tokens(did);
CREATE INDEX idx_access_tokens_expires ON access_tokens(expires_at);

-- Refresh Tokens: Long-lived refresh tokens
CREATE TABLE refresh_tokens (
    token VARCHAR(255) PRIMARY KEY,
    did VARCHAR(255) NOT NULL REFERENCES users(did) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_did ON refresh_tokens(did);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- Feed Tables (Cached/Computed)

-- Feed Items: Pre-computed feed items
CREATE TABLE feed_items (
    id SERIAL PRIMARY KEY,
    did VARCHAR(255) NOT NULL REFERENCES users(did) ON DELETE CASCADE,
    feed_type VARCHAR(20) NOT NULL,  -- 'home', 'following', 'trending'
    message_hash VARCHAR(66) NOT NULL REFERENCES messages(hash) ON DELETE CASCADE,
    score FLOAT DEFAULT 0,
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(did, feed_type, message_hash),
    CHECK (feed_type IN ('home', 'following', 'trending', 'mentions'))
);

CREATE INDEX idx_feed_items_did_type ON feed_items(did, feed_type);
CREATE INDEX idx_feed_items_did_type_score ON feed_items(did, feed_type, score DESC);
CREATE INDEX idx_feed_items_timestamp ON feed_items(timestamp DESC);

-- Notifications Tables

-- Notifications: User notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    recipient_did VARCHAR(255) NOT NULL REFERENCES users(did) ON DELETE CASCADE,
    actor_did VARCHAR(255) REFERENCES users(did) ON DELETE SET NULL,
    notification_type VARCHAR(20) NOT NULL,  -- 'follow', 'mention', 'like', 'reply', 'repost'
    target_hash VARCHAR(66) REFERENCES messages(hash) ON DELETE CASCADE,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    CHECK (notification_type IN ('follow', 'mention', 'like', 'reply', 'repost', 'quote'))
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_did, created_at DESC);
CREATE INDEX idx_notifications_read ON notifications(recipient_did, read, created_at DESC);

-- DID Documents: For AT Protocol compliance
CREATE TABLE did_documents (
    did VARCHAR(255) PRIMARY KEY REFERENCES users(did) ON DELETE CASCADE,
    document JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Hub Sync State: For P2P synchronization
CREATE TABLE hub_sync_state (
    id SERIAL PRIMARY KEY,
    peer_id VARCHAR(255) NOT NULL UNIQUE,
    last_sync_timestamp BIGINT NOT NULL,
    merkle_root VARCHAR(66),
    message_count BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_hub_sync_peer ON hub_sync_state(peer_id);

-- Message Statistics: Cached engagement counts
CREATE TABLE message_stats (
    message_hash VARCHAR(66) PRIMARY KEY REFERENCES messages(hash) ON DELETE CASCADE,
    like_count INTEGER DEFAULT 0,
    repost_count INTEGER DEFAULT 0,
    quote_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Functions for maintaining stats

CREATE OR REPLACE FUNCTION update_message_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO message_stats (message_hash, like_count, repost_count, quote_count)
        VALUES (NEW.target_hash, 0, 0, 0)
        ON CONFLICT (message_hash) DO NOTHING;
        
        IF NEW.reaction_type = 'like' THEN
            UPDATE message_stats SET like_count = like_count + 1, updated_at = NOW() WHERE message_hash = NEW.target_hash;
        ELSIF NEW.reaction_type = 'repost' THEN
            UPDATE message_stats SET repost_count = repost_count + 1, updated_at = NOW() WHERE message_hash = NEW.target_hash;
        ELSIF NEW.reaction_type = 'quote' THEN
            UPDATE message_stats SET quote_count = quote_count + 1, updated_at = NOW() WHERE message_hash = NEW.target_hash;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.reaction_type = 'like' THEN
            UPDATE message_stats SET like_count = GREATEST(0, like_count - 1), updated_at = NOW() WHERE message_hash = OLD.target_hash;
        ELSIF OLD.reaction_type = 'repost' THEN
            UPDATE message_stats SET repost_count = GREATEST(0, repost_count - 1), updated_at = NOW() WHERE message_hash = OLD.target_hash;
        ELSIF OLD.reaction_type = 'quote' THEN
            UPDATE message_stats SET quote_count = GREATEST(0, quote_count - 1), updated_at = NOW() WHERE message_hash = OLD.target_hash;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reactions_update_stats
AFTER INSERT OR DELETE ON reactions
FOR EACH ROW
EXECUTE FUNCTION update_message_stats();

-- Function to update reply counts
CREATE OR REPLACE FUNCTION update_reply_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.parent_hash IS NOT NULL THEN
        INSERT INTO message_stats (message_hash, reply_count)
        VALUES (NEW.parent_hash, 1)
        ON CONFLICT (message_hash) DO UPDATE
        SET reply_count = message_stats.reply_count + 1, updated_at = NOW();
    ELSIF TG_OP = 'DELETE' AND OLD.parent_hash IS NOT NULL THEN
        UPDATE message_stats
        SET reply_count = GREATEST(0, reply_count - 1), updated_at = NOW()
        WHERE message_hash = OLD.parent_hash;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_update_reply_counts
AFTER INSERT OR DELETE ON messages
FOR EACH ROW
EXECUTE FUNCTION update_reply_counts();

-- Views for common queries

-- User stats view
CREATE VIEW user_stats AS
SELECT 
    u.did,
    u.handle,
    COUNT(DISTINCT f1.following_did) as following_count,
    COUNT(DISTINCT f2.follower_did) as follower_count,
    COUNT(DISTINCT m.hash) as message_count,
    COUNT(DISTINCT r.id) as reaction_count
FROM users u
LEFT JOIN follows f1 ON u.did = f1.follower_did
LEFT JOIN follows f2 ON u.did = f2.following_did
LEFT JOIN messages m ON u.did = m.did AND NOT m.deleted
LEFT JOIN reactions r ON u.did = r.did
GROUP BY u.did, u.handle;

-- Trending posts view (last 24 hours)
CREATE VIEW trending_posts AS
SELECT 
    m.hash,
    m.did,
    m.text,
    m.timestamp,
    COALESCE(ms.like_count, 0) as likes,
    COALESCE(ms.repost_count, 0) as reposts,
    COALESCE(ms.reply_count, 0) as replies,
    (COALESCE(ms.like_count, 0) + COALESCE(ms.repost_count, 0) * 2 + COALESCE(ms.reply_count, 0)) / 
    POWER((EXTRACT(EPOCH FROM NOW()) - m.timestamp/1000) / 3600 + 2, 1.5) as trending_score
FROM messages m
LEFT JOIN message_stats ms ON m.hash = ms.message_hash
WHERE m.timestamp > EXTRACT(EPOCH FROM NOW() - INTERVAL '24 hours') * 1000
  AND NOT m.deleted
ORDER BY trending_score DESC;

-- Comments for documentation
COMMENT ON TABLE users IS 'Core user identity table with DID as primary key';
COMMENT ON TABLE messages IS 'All posts, replies, and reposts with content';
COMMENT ON TABLE reactions IS 'User engagement: likes, reposts, quotes';
COMMENT ON TABLE follows IS 'Social graph following relationships';
COMMENT ON TABLE feed_items IS 'Pre-computed feed items for performance';
COMMENT ON TABLE message_stats IS 'Cached engagement statistics per message';
COMMENT ON VIEW trending_posts IS 'Real-time trending posts using engagement score algorithm';
