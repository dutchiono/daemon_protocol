# Setup .env File for Deployment

## Quick Setup

### 1. Create .env file in `contracts/` directory

```bash
cd contracts
```

### 2. Create .env file

**Windows PowerShell:**
```powershell
@"
PRIVATE_KEY=your_private_key_here
RPC_URL=https://sepolia.base.org
"@ | Out-File -FilePath .env -Encoding utf8
```

**Or manually create `.env` file with:**
```
PRIVATE_KEY=your_private_key_here
RPC_URL=https://sepolia.base.org
```

### 3. Get Your Private Key

**From MetaMask:**
1. Open MetaMask
2. Click account icon → Account details
3. Click "Show private key"
4. Enter password
5. Copy private key (starts with `0x`)

**⚠️ SECURITY WARNING:**
- Never commit `.env` to git!
- Never share your private key!
- Use a test wallet for testnet (not your main wallet)

### 4. Get Testnet ETH

Before deploying, you need Base Sepolia ETH:
- Faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- Enter your wallet address
- Get free testnet ETH

### 5. Verify Setup

Check that .env is loaded:
```powershell
# In PowerShell, you can check (but don't show the key!)
Get-Content .env | Select-String "PRIVATE_KEY"
```

### 6. Deploy

Now you can deploy:
```bash
npx hardhat run scripts/deploy-identity-registry-base.ts --network base-sepolia
```

## Troubleshooting

**"PRIVATE_KEY environment variable required"**
- Make sure `.env` file exists in `contracts/` directory
- Make sure it has `PRIVATE_KEY=0x...` (with `0x` prefix)
- Make sure you're running from `contracts/` directory

**"Insufficient funds"**
- Get testnet ETH from faucet
- Check balance: The script will show your balance

**"Invalid private key"**
- Make sure it starts with `0x`
- Make sure it's 66 characters long (0x + 64 hex chars)

