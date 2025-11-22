-- Database Schema for Builder Reward System

-- Contributors table
CREATE TABLE IF NOT EXISTS contributors (
    address VARCHAR(42) PRIMARY KEY,
    github_username VARCHAR(255),
    total_score DECIMAL(20, 10) DEFAULT 0,
    last_contribution_timestamp BIGINT,
    contribution_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contributions table
CREATE TABLE IF NOT EXISTS contributions (
    id SERIAL PRIMARY KEY,
    contribution_hash VARCHAR(66) UNIQUE NOT NULL,
    contributor_address VARCHAR(42) NOT NULL,
    pr_url TEXT NOT NULL,
    pr_number INTEGER,
    score DECIMAL(20, 10) NOT NULL,
    base_score DECIMAL(20, 10) NOT NULL,
    contribution_type VARCHAR(50) NOT NULL,
    timestamp BIGINT NOT NULL,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contributor_address) REFERENCES contributors(address)
);

-- Score history table (for tracking score changes over time)
CREATE TABLE IF NOT EXISTS score_history (
    id SERIAL PRIMARY KEY,
    contributor_address VARCHAR(42) NOT NULL,
    epoch_day INTEGER NOT NULL,
    total_score DECIMAL(20, 10) NOT NULL,
    decayed_score DECIMAL(20, 10) NOT NULL,
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contributor_address) REFERENCES contributors(address),
    UNIQUE(contributor_address, epoch_day)
);

-- Payouts table
CREATE TABLE IF NOT EXISTS payouts (
    id SERIAL PRIMARY KEY,
    contributor_address VARCHAR(42) NOT NULL,
    epoch_day INTEGER NOT NULL,
    amount DECIMAL(30, 18) NOT NULL,
    transaction_hash VARCHAR(66),
    status VARCHAR(50) DEFAULT 'pending',
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contributor_address) REFERENCES contributors(address)
);

-- GitHub PRs cache table
CREATE TABLE IF NOT EXISTS github_prs (
    id SERIAL PRIMARY KEY,
    pr_number INTEGER UNIQUE NOT NULL,
    pr_url TEXT NOT NULL,
    title TEXT,
    body TEXT,
    state VARCHAR(50),
    merged BOOLEAN DEFAULT false,
    merged_at TIMESTAMP,
    author_username VARCHAR(255),
    contribution_hash VARCHAR(66),
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily distributions table
CREATE TABLE IF NOT EXISTS daily_distributions (
    id SERIAL PRIMARY KEY,
    epoch_day INTEGER UNIQUE NOT NULL,
    total_score DECIMAL(20, 10) NOT NULL,
    total_rewards DECIMAL(30, 18) NOT NULL,
    contributors_count INTEGER NOT NULL,
    distributed BOOLEAN DEFAULT false,
    transaction_hash VARCHAR(66),
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contributions_contributor ON contributions(contributor_address);
CREATE INDEX IF NOT EXISTS idx_contributions_timestamp ON contributions(timestamp);
CREATE INDEX IF NOT EXISTS idx_contributions_hash ON contributions(contribution_hash);
CREATE INDEX IF NOT EXISTS idx_score_history_contributor ON score_history(contributor_address);
CREATE INDEX IF NOT EXISTS idx_score_history_epoch ON score_history(epoch_day);
CREATE INDEX IF NOT EXISTS idx_payouts_contributor ON payouts(contributor_address);
CREATE INDEX IF NOT EXISTS idx_payouts_epoch ON payouts(epoch_day);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_github_prs_processed ON github_prs(processed);
CREATE INDEX IF NOT EXISTS idx_github_prs_merged ON github_prs(merged);

