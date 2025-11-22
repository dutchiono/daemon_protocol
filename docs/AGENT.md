# Daemon Agent

## Overview

The Daemon Agent is a Clanker-style autonomous agent that helps users launch tokens and interact with Daemon Protocol.

## Features

- Intent classification
- Token deployment assistance
- Builder rewards queries
- Contribution tracking
- Session management

## Usage

### API Endpoint

```
POST /api/agent/chat
```

### Request

```json
{
  "message": "I want to launch a token",
  "sessionId": "session-123",
  "walletAddress": "0x..."
}
```

### Response

```json
{
  "response": "I'll help you launch a token...",
  "sessionId": "session-123",
  "intent": "launch_token"
}
```

## Intents

- `launch_token` - Deploy a new token
- `query_token` - Get token information
- `claim_rewards` - Claim builder rewards
- `check_contributions` - Check GitHub contributions

## Tools

The agent has access to:
- `getUser(walletAddress)`
- `createDraft(payload)`
- `deployDraft(draftId, signedTx?)`
- `getTokenInfo(tokenAddress)`
- `getBuilderRewards(walletAddress)`
- `claimBuilderRewards(walletAddress)`

## Configuration

Set environment variables:
- `OPENAI_API_KEY` - OpenAI API key
- `AGENT_MODEL` - Model to use (default: gpt-4o-mini)

