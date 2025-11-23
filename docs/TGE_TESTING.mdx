# TGE Testing Guide

## Overview

**TGE (Token Generation Event) is for the DAEMON token itself** - to bootstrap initial liquidity for the DAEMON/ETH pool.

### Fey's TGE (Reference)
- **350 contributors**
- **0.1 ETH each**
- **35 ETH total**
- This ETH went into the FEY/ETH pool as initial liquidity

### Daemon's TGE (Target)
- **~350 contributors**
- **~0.19 ETH each**
- **66.6 ETH total**
- This ETH will go into the DAEMON/ETH pool as initial liquidity

### Flow
1. **Launch DAEMON token** via TGE (people contribute ETH)
2. **Create DAEMON/ETH pool** with TGE funds
3. **All future tokens** pair with DAEMON (not ETH)

## The Problem

On Base Sepolia testnet, you can't easily get 66.6 ETH for testing. You have a few options:

## Option 1: Hardhat Local Network (Recommended) ⭐

**Best for full simulation** - Hardhat allows minting unlimited ETH.

### Setup

1. **Deploy contracts to Hardhat local network:**
   ```bash
   cd contracts
   npx hardhat run scripts/deploy-all.ts --network hardhat
   ```

2. **Deploy a test token with TGE enabled:**
   ```bash
   npx hardhat run scripts/deploy-test-token-with-tge.ts --network hardhat
   ```

3. **Run TGE simulation:**
   ```bash
   npx hardhat run scripts/simulate-tge.ts --network hardhat
   ```

### Advantages
- ✅ Can mint unlimited ETH
- ✅ Full simulation with 350 contributors
- ✅ No real ETH needed
- ✅ Fast and free

### Disadvantages
- ⚠️ Not testing on actual testnet
- ⚠️ Need to deploy contracts to Hardhat first

---

## Option 2: Use Test ETH Token with Wrapper (For Testnet)

**For testnet testing** - Use a test ETH token with a wrapper contract.

### Implementation

1. **Deploy TestETHToken and TGEWrapper:**
   ```bash
   npx hardhat run scripts/deploy-tge-wrapper.ts --network base-sepolia
   ```

2. **Fund the wrapper** with ETH (from faucet or Hardhat)

3. **Mint TestETHToken** to test contributors

4. **Contributors approve wrapper** to spend TestETHToken

5. **Contributors call wrapper.contributeToTGEWithToken()** - wrapper converts test token to ETH and contributes

### Advantages
- ✅ Tests on actual testnet
- ✅ Can mint unlimited test tokens
- ✅ No factory modification needed (wrapper handles conversion)

### Disadvantages
- ⚠️ Requires wrapper contract
- ⚠️ Wrapper needs to be funded with ETH
- ⚠️ More complex flow than native ETH

---

## Option 3: Smaller Testnet Simulation

**Quick test** - Use smaller amounts on testnet.

### Setup

1. **Deploy test token with TGE enabled**

2. **Use 10-20 test accounts** with 0.1 ETH each (from faucet)
   - Total: 1-2 ETH (much smaller than 66.6 ETH)
   - Good for basic functionality testing

3. **Run smaller simulation:**
   ```bash
   npx hardhat run scripts/simulate-tge.ts --network base-sepolia
   ```

### Advantages
- ✅ Tests on actual testnet
- ✅ No contract modifications needed
- ✅ Quick to set up

### Disadvantages
- ⚠️ Not full simulation (only 1-2 ETH vs 66.6 ETH)
- ⚠️ Limited number of contributors

---

## Recommended Approach

**For Development/Testing (Full Simulation):**
1. Use **Hardhat local network** ⭐ **RECOMMENDED**
2. Deploy contracts to Hardhat: `npx hardhat run scripts/deploy-all.ts --network hardhat`
3. Deploy test token with TGE enabled
4. Run full simulation: 350 contributors, 66.6 ETH total
5. Verify all TGE functionality works

**Why Hardhat?**
- ✅ Can mint unlimited ETH (no need for fake tokens)
- ✅ Full simulation with realistic amounts
- ✅ Fast and free
- ✅ No contract modifications needed
- ✅ Tests the actual native ETH flow

**For Testnet Validation:**
1. Use **smaller simulation** (10 contributors, 1 ETH total)
2. Verify basic TGE flow works on testnet
3. Test edge cases and error handling
4. Use faucet ETH for test accounts

**For Mainnet:**
1. Use real ETH
2. Real contributors
3. Full 66.6 ETH target

---

## TGE Simulation Script

The `simulate-tge.ts` script:
- Creates 350 test accounts
- Mints test ETH to each (on Hardhat) or uses faucet ETH (on testnet)
- Simulates contributions from each account
- Tracks total contributions
- Verifies TGE completion

### Usage

**Hardhat (full simulation):**
```bash
cd contracts
npx hardhat run scripts/simulate-tge.ts --network hardhat
```

**Base Sepolia (smaller simulation):**
```bash
cd contracts
npx hardhat run scripts/simulate-tge.ts --network base-sepolia
```

---

## Environment Variables

```bash
# For TGE simulation
TEST_TOKEN_ADDRESS=0x... # Token address with TGE enabled
```

---

## Notes

- **TGE uses native ETH** (`msg.value`) - this is by design
- **For testnet**, Hardhat local network is recommended for full simulation
- **For testnet validation**, use smaller amounts with real testnet ETH
- **Test ETH token** is optional - only needed if modifying TGE to accept ERC20

---

## Next Steps

1. **Deploy contracts to Hardhat local network**
2. **Deploy test token with TGE enabled**
3. **Run full TGE simulation** (350 contributors, 66.6 ETH)
4. **Test TGE completion and fund distribution**
5. **Validate on testnet** with smaller amounts

