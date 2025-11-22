# 🚀 Quick Start Guide

## Step 1: Start the Node (Hub + PDS + Gateway)

Open PowerShell in the project root and run:

```powershell
cd daemon-node
npm install  # ✅ Already done!
npm run build
npm start all
```

**What this does:**
- Starts Hub (message relay) on port 4001
- Starts PDS (user data) on port 4003
- Starts Gateway (API) on port 4004
- All three run together in one process!

**You should see:**
```
Hub node started successfully.
PDS node started successfully.
Gateway node started successfully.
All Daemon Social Network nodes are running.
```

## Step 2: Start the Client (Electron App)

Open a **NEW PowerShell window** and run:

```powershell
cd daemon-client
npm install
npm run electron:dev
```

**What this does:**
- Starts Vite dev server (React frontend)
- Opens Electron window with your social network app
- Hot reload enabled for development

## Step 3: Connect Wallet & Use the App

1. **Click "Connect Wallet"** in the app
2. **Register FID** (if you haven't already):
   - Go to https://sepolia.basescan.org/address/0x4e37C9C45579611233A25B691201d50aE8E8175A
   - Connect your wallet
   - Call `register()` function
3. **Create a post** using the Compose button
4. **See your post** in the Feed!

## Environment Variables (Already Set!)

Your `.env` file already has:
- ✅ `ID_REGISTRY_ADDRESS=0x4e37C9C45579611233A25B691201d50aE8E8175A`
- ✅ `KEY_REGISTRY_ADDRESS=0xF23DaA9d31b2A472932f5d44Fb2f0c2281d8A9f0`
- ✅ `STORAGE_REGISTRY_ADDRESS=0x5948a4aaC5119BFe646D6e5227EbB7E2c152b457`
- ✅ `RPC_URL=https://sepolia.base.org`

## Database Setup (If Needed)

If you get database errors, make sure PostgreSQL is running:

```powershell
# Check if PostgreSQL is running
Get-Service postgresql*

# If not running, start it (adjust service name as needed)
Start-Service postgresql-x64-15
```

Then create the database:
```sql
CREATE DATABASE daemon;
```

## Troubleshooting

### "Cannot find module" errors
```powershell
# Make sure you installed dependencies
cd daemon-node
npm install

cd ../daemon-client
npm install
```

### "Port already in use" errors
```powershell
# Check what's using the port
netstat -ano | findstr :4001
netstat -ano | findstr :4003
netstat -ano | findstr :4004

# Kill the process if needed (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### "Database connection failed"
- Make sure PostgreSQL is running
- Check your `DATABASE_URL` in `.env`
- Default: `postgresql://postgres:password@localhost:5432/daemon`

## What's Running Where

- **Node**: `http://localhost:4001` (Hub), `http://localhost:4003` (PDS), `http://localhost:4004` (Gateway)
- **Client**: Electron window (auto-opens)
- **Contracts**: Base Sepolia testnet

## Next Steps

1. ✅ Node running → Check `http://localhost:4004/health`
2. ✅ Client running → Electron window should open
3. ✅ Connect wallet → MetaMask popup
4. ✅ Register FID → On-chain registration
5. ✅ Create post → See it in feed!

**You're ready to go!** 🎉

