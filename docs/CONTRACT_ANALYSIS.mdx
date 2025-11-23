# FEY Hook Contract Analysis - What We Know vs What We Don't

**Reference Document**: Analysis of Fey Protocol's hook contract for understanding patterns.

## Contract Overview

**Contract Name**: FeyHookStaticFeeV2
**Address**: `0x5B409184204b86f708d3aeBb3cad3F02835f68cC` (Base mainnet)
**Purpose**: Uniswap V4 hook for fee management, MEV protection, and pool extensions

---

## ✅ What We KNOW

### Public Functions (from ABI)

**Configuration Views:**
- `factory() → address` - FEY Factory contract
- `baseToken() → address` - FEY token address
- `weth() → address` - WETH address on Base
- `poolExtensionAllowlist() → address` - Extension allowlist contract
- `protocolFee() → uint24` - Current protocol fee rate

**Pool-Specific Queries:**
- `feyIsToken0(bytes32 poolId) → bool` - Whether FEY is token0
- `locker(bytes32 poolId) → address` - LP locker address
- `mevModule(bytes32 poolId) → address` - MEV protection module
- `mevModuleEnabled(bytes32 poolId) → bool` - MEV protection status
- `poolExtension(bytes32 poolId) → address` - Pool extension address
- `poolExtensionSetup(bytes32 poolId) → bool` - Extension setup status
- `feyFee(bytes32 poolId) → uint24` - Fee for FEY → Paired direction
- `pairedFee(bytes32 poolId) → uint24` - Fee for Paired → FEY direction
- `poolCreationTimestamp(bytes32 poolId) → uint256` - Pool creation time

**Constants:**
- `MAX_LP_FEE() → uint24` - Maximum allowed LP fee
- `MAX_MEV_LP_FEE() → uint24` - Maximum allowed MEV LP fee
- `MAX_MEV_MODULE_DELAY() → uint256` - Maximum MEV module delay
- `PROTOCOL_FEE_NUMERATOR() → uint256` - Protocol fee calculation numerator

### Known Functionality

1. **Dynamic Directional Fees**: Different fees for FEY → Paired vs Paired → FEY swaps
2. **MEV Protection**: Optional MEV module integration for pool protection
3. **Pool Extensions**: Support for pool-specific extensions (dev buys, etc.)
4. **Locker Integration**: Links pools to LP lockers for reward distribution
5. **Factory Integration**: Connected to FEY Factory for pool initialization

---

## ❌ What We DON'T KNOW (Critical Gaps)

### 1. Uniswap V4 Hook Interface Implementation

**Missing Information:**
- ❓ Which hook callbacks are implemented?
  - `beforeInitialize()` - Pool initialization hook
  - `afterInitialize()` - Post-initialization logic
  - `beforeModifyPosition()` - Pre-liquidity modification
  - `afterModifyPosition()` - Post-liquidity modification
  - `beforeSwap()` - Pre-swap validation/MEV protection
  - `afterSwap()` - Post-swap fee collection
  - `beforeDonate()` - Pre-donation logic
  - `afterDonate()` - Post-donation logic

- ❓ **Hook flags/bitmask**: Which hooks are enabled (Uniswap V4 uses bit flags)
- ❓ **Hook permissions**: Access control for hook callbacks
- ❓ **Hook data encoding**: How pool-specific data is encoded/decoded for Uniswap V4

**Impact**: Cannot implement hook callbacks without knowing which ones exist and their logic

### 2. Internal State Variables & Storage Layout

**Missing Information:**
- ❓ **Storage mappings structure**:
  - Complete `PoolConfig` struct definition
  - How fees are stored (packed vs separate)
  - Storage slot positions
  - Packed storage optimization

- ❓ **State variables**:
  - All internal mappings
  - Constants storage
  - Access control state
  - Fee accumulator addresses

**Impact**: Cannot replicate exact storage layout or optimize gas usage

### 3. Fee Collection & Distribution Logic

**Missing Information:**
- ❓ **Fee collection mechanism**: How fees are collected in `afterSwap()`
- ❓ **Fee routing**: Exact path from swap → fee locker
- ❓ **Protocol fee calculation**: Exact formula and when it's applied
- ❓ **WETH conversion**: How WETH fees are handled vs native token fees
- ❓ **Fee accumulation**: Where fees accumulate before distribution
- ❓ **Fee splitting**: Current split between protocol and LP fees

**Impact**: Cannot implement builder reward fee split without understanding current flow

### 4. MEV Protection Implementation

**Missing Information:**
- ❓ **MEV module delay logic**: How delay is enforced in `beforeSwap()`
- ❓ **Sniper protection**: Validation logic and checks performed
- ❓ **Transaction validation**: What conditions must be met
- ❓ **MEV module interface**: Required interface for MEV modules
- ❓ **Activation timing**: When MEV protection activates (time-based?)
- ❓ **Bypass mechanisms**: Any ways to bypass MEV protection

**Impact**: Cannot replicate MEV protection or integrate with builder rewards

### 5. Pool Initialization Flow

**Missing Information:**
- ❓ **`initializePool()` function**: Complete implementation
- ❓ **Pool configuration setup**: How pool data is stored during init
- ❓ **Hook data encoding**: How pool config is encoded for Uniswap V4
- ❓ **Factory integration**: How factory calls hook during deployment
- ❓ **Initial fee setting**: How initial fees are determined

**Impact**: Cannot create new pools or understand deployment flow

### 6. Pool Extension System

**Missing Information:**
- ❓ **Extension interface**: Required interface for extensions
- ❓ **Extension allowlist verification**: How allowlist is checked
- ❓ **Extension callback mechanism**: How extensions are called
- ❓ **Extension setup flow**: When and how extensions are configured
- ❓ **Extension data format**: What data is passed to extensions

**Impact**: Cannot integrate builder rewards as extension or understand extension system

### 7. Access Control & Permissions

**Missing Information:**
- ❓ **Owner/admin roles**: Who can modify hook settings
- ❓ **Factory permissions**: What factory can do (initialize pools, etc.)
- ❓ **Pool admin permissions**: Per-pool access control
- ❓ **Fee recipient permissions**: Who can claim fees

**Impact**: Cannot implement proper access control for builder rewards

### 8. x402 Integration

**Missing Information:**
- ❓ **What is x402?**: ERC-4020, EIP-4020, or custom protocol?
- ❓ **Integration point**: Where x402 would fit in architecture
- ❓ **Security implications**: Recent x402Bridge exploit ($17k loss) - need security review
- ❓ **Payment mechanism**: How x402 handles payments/streaming

**Impact**: Cannot integrate x402 without understanding the standard

---

## 🔧 Required Actions for Complete Copy

### Phase 0: Reverse Engineering (CRITICAL - Must Complete First)

1. **Obtain Source Code**:
   - Request source code from FEY team
   - Check if verified on BaseScan/Etherscan
   - Attempt to decompile bytecode if source unavailable

2. **Decompile & Analyze** (if source unavailable):
   - Use tools like `panoramix`, `hevm`, or `ethersplay` to decompile
   - Map all function selectors
   - Identify storage layout using `sload` analysis
   - Trace execution flow through hook callbacks
   - Analyze transaction history for patterns

3. **On-Chain Analysis**:
   - Query all storage slots for known pools
   - Analyze transaction history for hook interactions
   - Trace fee collection transactions
   - Monitor MEV protection activations
   - Study pool initialization transactions

4. **Uniswap V4 Hook Interface Research**:
   - Study Uniswap V4 hook interface specification
   - Understand hook flags and permissions system
   - Document required callback signatures
   - Understand hook data encoding format
   - Review Uniswap V4 hook examples

5. **Document Complete Implementation**:
   - Full Solidity source code
   - All state variables and storage layout
   - All hook callback implementations
   - Fee collection and distribution logic
   - MEV protection mechanisms
   - Pool extension integration
   - Access control system

6. **x402 Research**:
   - Determine if x402 is ERC-4020, EIP-4020, or custom protocol
   - Understand x402 payment/streaming mechanism
   - Assess security implications (especially x402Bridge exploit)
   - Design integration approach if applicable

---

## 📋 Hook Scaffolding Strategy

### Option A: Direct Copy (If Source Available)
- Copy complete hook contract
- Modify fee distribution to include 5% builder cut
- Add builder reward integration points
- Maintain all existing functionality
- **Pros**: Fastest, most accurate
- **Cons**: Requires source code access

### Option B: Rebuild from Analysis (If Source Unavailable)
- Rebuild hook based on ABI and documentation
- Implement all known functions
- Reverse engineer hook callbacks from behavior
- Test against existing pools for compatibility
- **Pros**: Complete control, learning experience
- **Cons**: Time-consuming, may miss edge cases

### Option C: Hybrid Approach (Recommended)
- Start with known ABI functions
- Implement Uniswap V4 hook interface based on spec
- Add builder reward integration
- Test incrementally against existing system
- Fill gaps as discovered
- **Pros**: Balanced approach, iterative improvement
- **Cons**: May require multiple iterations

---

## 🎯 Next Steps

1. **Immediate**: Attempt to obtain source code or verify on BaseScan
2. **If source unavailable**: Begin decompilation and on-chain analysis
3. **Research**: Study Uniswap V4 hook interface specification
4. **Document**: Create complete hook specification document
5. **Design**: Plan builder reward integration points
6. **Implement**: Begin hook scaffolding with known functions

---

## 📚 Resources Needed

- Uniswap V4 hook interface documentation
- BaseScan contract verification
- FEY team contact for source code
- Decompilation tools (panoramix, hevm, etc.)
- On-chain analysis tools (Dune, Tenderly, etc.)
- x402 standard documentation (if applicable)

