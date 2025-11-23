# Fey Protocol Ceremony/TGE Analysis

## What We Know

### Fey Factory Contract (0x8eef0dc80adf57908bb1be0236c2a72a7e379c2d)
- Has `bootstrap` address with `OnlyBootstrap` error (special permissions)
- Has `deployToken` function (payable - can receive ETH)
- Has `deployTokenZeroSupply` function (non-payable - deploys token without pool)
- Has `setBaseToken` function (owner only)
- Factory's `baseToken` is currently set to FEY token address

### Fey Token (0xD09cf0982A32DD6856e12d6BF2F08A822eA5D91D)
- 100 billion total supply
- Name: FEY, Symbol: FEY
- Currently set as Factory's baseToken

### Ceremony Details
- 350 contributors
- 0.1 ETH each
- 35 ETH total
- Used to bootstrap FEY/ETH liquidity pool

## Hypothesis: How Fey Ceremony Worked

**Most Likely Flow:**

1. **Ceremony Phase (ETH Collection)**
   - Bootstrap address (or a ceremony contract) collected ETH from 350 contributors
   - Each contributed ~0.1 ETH
   - Total: 35 ETH collected

2. **Token Deployment**
   - Bootstrap deployed FEY token via Factory (possibly using `deployTokenZeroSupply` first)
   - OR FEY token was deployed separately, then set as baseToken

3. **Liquidity Bootstrap**
   - Bootstrap used the 35 ETH to create initial FEY/ETH pool
   - This established the base liquidity for FEY token

4. **Factory Setup**
   - Factory's `baseToken` was set to FEY token address
   - Factory was now ready for other tokens to pair with FEY

## What We Need to Confirm

1. **What can bootstrap do?**
   - Check Fey Factory contract code on Basescan
   - Find functions that use `OnlyBootstrap` modifier
   - Understand bootstrap's special permissions

2. **How was FEY token deployed?**
   - Check FEY token creation transaction on Basescan
   - Was it deployed via Factory or separately?
   - What was the deployment transaction?

3. **How was liquidity added?**
   - Check initial FEY/ETH pool creation transaction
   - How was the 35 ETH used?
   - Was it done by bootstrap or owner?

## Next Steps

1. **Check Basescan for Fey Factory contract code:**
   - https://basescan.org/address/0x8eef0dc80adf57908bb1be0236c2a72a7e379c2d#code
   - Look for functions with `OnlyBootstrap` modifier
   - Understand what bootstrap can do

2. **Check FEY token creation transaction:**
   - https://basescan.org/address/0xD09cf0982A32DD6856e12d6BF2F08A822eA5D91D#code
   - Find the creation transaction
   - See how it was deployed

3. **Check bootstrap address:**
   - Query Factory for bootstrap address
   - Check bootstrap's transaction history
   - See if it collected ETH or deployed contracts

## Key Insight

**The bootstrap address is likely the key to understanding the ceremony:**
- Bootstrap probably collected ETH during ceremony
- Bootstrap probably deployed FEY token
- Bootstrap probably created initial liquidity pool
- Bootstrap has special permissions that regular users don't have

This is why DaemonFactory has `bootstrap` with `completeTGE` permissions - it's following the Fey pattern!

