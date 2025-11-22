# Testing Guide - Daemon Agent & Telegram Bot

## Prerequisites

1. **Environment Variables** - Add to `.env` in root directory:
   ```bash
   # Required for Agent
   AGENT_API_KEY=your_openai_api_key_here
   AGENT_MODEL=gpt-4o-mini  # Optional, defaults to gpt-4o-mini

   # Required for Telegram Bot
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

   # Optional - Backend URL (defaults to http://localhost:3000)
   BACKEND_URL=http://localhost:3000
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

## Testing the Agent

### 1. Start the Backend

The agent runs through the backend API:

```bash
npm run dev:backend
```

This starts the backend on `http://localhost:3000` (or PORT from .env).

### 2. Test Agent API Directly

```bash
# Test agent chat endpoint
curl -X POST http://localhost:3000/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is Daemon Protocol?",
    "walletAddress": "0x0000000000000000000000000000000000000000"
  }'
```

Expected response:
```json
{
  "response": "Daemon Protocol is a token launchpad...",
  "sessionId": "session-...",
  "intent": "general_question"
}
```

### 3. Test Agent Knowledge

Try asking:
- "What are builder rewards?"
- "How do I launch a token?"
- "Tell me about the SDK"
- "What is the deployment process?"

The agent should reference documentation and provide accurate answers.

## Testing the Telegram Bot

### 1. Create a Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Follow instructions to create your bot
4. Copy the bot token (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
5. Add to `.env` as `TELEGRAM_BOT_TOKEN`

### 2. Start the Backend (Telegram Bot is Integrated)

The Telegram bot is now part of the backend process, so just start the backend:

```bash
npm run dev:backend
```

You should see:
```
Builder Reward API server running on port 3000
✅ Telegram bot started and integrated with backend
```

**Note**: If `TELEGRAM_BOT_TOKEN` is not set, the bot will be disabled but the backend will still run.

### 3. Test Bot Commands

1. Open Telegram and find your bot
2. Send `/start` - Should show welcome message
3. Send `/help` - Should show all commands
4. Send `/wallet 0xYourAddress` - Link your wallet
5. Send `/rewards` - Check builder rewards (requires wallet)
6. Send `/contributions` - Check GitHub contributions (requires wallet)
7. Send `/launch` - Start token launch wizard

### 4. Test Natural Language

Try asking the bot:
- "What is Daemon Protocol?"
- "How do builder rewards work?"
- "I want to launch a token called TestToken"
- "Tell me about the SDK"

The bot should respond intelligently using the agent.

## Testing the Web Launchpad

### 1. Start Backend

```bash
npm run dev:backend
```

### 2. Start Launchpad

```bash
npm run dev:launchpad
```

### 3. Open Browser

Navigate to `http://localhost:5173` (or port shown in terminal)

### 4. Test AI Chat

1. Click "Launch Token" button
2. Open the AI chat panel
3. Ask questions like:
   - "Help me create a token"
   - "What should I name my token?"
   - "Explain fee sharing"

The AI should help fill out the form.

## Verification Checklist

### Agent Knowledge
- [ ] Agent can answer questions about Daemon Protocol
- [ ] Agent references documentation correctly
- [ ] Agent provides accurate information about builder rewards
- [ ] Agent explains token launch process
- [ ] Agent handles unknown questions gracefully

### Telegram Bot
- [ ] Bot responds to `/start` command
- [ ] Bot responds to `/help` command
- [ ] Bot can link wallet addresses
- [ ] Bot responds to natural language questions
- [ ] Bot integrates with agent API correctly
- [ ] Bot handles errors gracefully

### Web Launchpad
- [ ] AI chat loads and responds
- [ ] AI can help fill out token form
- [ ] Form validation works
- [ ] Wallet connection works

## Troubleshooting

### Agent Returns Placeholder Response

**Problem**: Agent says "This is a placeholder response..."

**Solution**:
- Check `AGENT_API_KEY` is set in `.env`
- Verify OpenAI API key is valid
- Check backend logs for errors

### Telegram Bot Not Starting

**Problem**: Bot fails to start

**Solution**:
- Check `TELEGRAM_BOT_TOKEN` is set in `.env`
- Verify token is correct (from BotFather)
- Check backend logs for bot initialization errors
- Bot is part of backend process, so ensure backend starts successfully

### Agent Doesn't Know About Docs

**Problem**: Agent gives generic answers instead of referencing docs

**Solution**:
- Check `daemon/docs/` directory exists
- Verify documentation files are readable
- Check agent logs for doc loading errors
- Ensure `getDocumentationKnowledge()` is being called

### Backend API Errors

**Problem**: 500 errors from agent endpoint

**Solution**:
- Check `AGENT_API_KEY` is valid
- Verify OpenAI API has credits
- Check backend logs for detailed errors
- Ensure all dependencies are installed

## Next Steps

1. **Test with Real Wallet**: Link a real wallet and test token launch flow
2. **Test Builder Rewards**: Check rewards for a wallet with contributions
3. **Test Token Deployment**: Try deploying a test token
4. **Monitor Logs**: Watch backend and bot logs for issues

## Support

If you encounter issues:
1. Check backend logs: `npm run dev:backend` (includes Telegram bot logs)
2. Verify environment variables are set correctly
3. Ensure all dependencies are installed: `npm install`
4. Check that `telegraf` is installed in backend: `cd backend && npm install`

