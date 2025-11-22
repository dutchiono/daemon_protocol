# Daemon Protocol Documentation

## Overview

Daemon Protocol is a next-generation token launchpad built on Uniswap V4 with automatic builder rewards. The protocol takes a 5% hard cut from all fees for active contributors, ensuring builders are rewarded for their work.

## Key Features

- **5% Builder Reward Cut**: Automatic fee distribution to active contributors
- **Uniswap V4 Hook**: Custom hook with MEV protection and pool extensions
- **GitHub Integration**: Automatic contribution tracking from PRs
- **Time-Based Decay**: Prevents "free rides" - only active contributors are rewarded
- **Clanker-Style Agent**: LLM-powered autonomous agent for token launches

## Documentation

### Getting Started
- [Deployment Guide](./DEPLOYMENT.md) ⭐ **Complete deployment instructions**
- [Environment Setup](../ENV_SETUP.md) - Configure your `.env` file

### Feature Documentation
- [Hook Contract](./HOOK.md) - DaemonHook contract documentation
- [SDK](./SDK.md) - TypeScript SDK integration guide
- [Agent](./AGENT.md) - Agent usage and configuration
- [Launchpad](./LAUNCHPAD.md) - Launchpad UI guide
- [Builder Rewards](./BUILDER_REWARDS.md) - Builder rewards system
- [Testing](./TESTING.md) - Testing guide
- [Salt Generation Lessons](./SALT_GENERATION_LESSONS.md) - Lessons learned from implementation

### Reference Documentation
- [Fey Contract Analysis](./CONTRACT_ANALYSIS.md) - Analysis of Fey Protocol patterns

### Private Documentation (Do Not Commit)
- [Token Tracking](./private/TOKEN_TRACKING.md) ⭐ **SINGLE SOURCE OF TRUTH for tokens**
- [Deployment Tracking](./private/DEPLOYMENT_TRACKING.md) - Contract addresses
- [Deployment Checklist](./private/DEPLOYMENT_CHECKLIST.md) - Quick checklist
- [Network Configuration](./private/NETWORKS.md) - Network details

## Quick Start

```bash
# Install dependencies
npm install

# Build contracts
cd contracts
npx hardhat compile

# Run tests
npm test

# Start backend
npm run dev:backend

# Start launchpad
cd launchpad
npm run dev
```

## Architecture

```
daemon/
├── contracts/     # Smart contracts (Hook, Rewards, Registry)
├── sdk/          # TypeScript SDK
├── agent/        # Clanker-style agent
├── launchpad/    # Web UI
├── backend/      # API server
├── github/       # GitHub integration
└── docs/         # Documentation
```

## License

MIT

