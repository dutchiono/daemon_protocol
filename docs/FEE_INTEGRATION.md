# Fee Integration with Daemon Protocol

## Overview

The Daemon Social Network is funded through swap fees collected by the Daemon Protocol. This document describes how fees flow from token swaps to network infrastructure operators.

## Fee Flow Architecture

```
Token Swap (Uniswap V4)
    ↓
DaemonHook (collects fees)
    ↓
FeeSplitter (splits fees)
    ↓
SocialNetworkFund (receives portion)
    ↓
Operator Rewards Distribution
    ↓
Hub/PDS/Gateway Operators
```

## Fee Collection

### 1. Swap Fee Collection

When a swap occurs in a pool using DaemonHook:

```solidity
// In DaemonHook.afterSwap()
function afterSwap(...) external returns (bytes4, int128) {
    // Fees collected by Uniswap V4
    // DaemonHook receives protocol fees
    // Route portion to SocialNetworkFund
}
```

### 2. Fee Split Configuration

Current Daemon Protocol fee split:
- **5%**: Builder rewards (existing)
- **X%**: Social Network Fund (new)
- **Remaining**: Token devs, stakers, etc.

### 3. Social Network Fund Allocation

Proposed allocation of Social Network Fund:
- **40%**: Hub operators (message relay)
- **30%**: PDS operators (data hosting)
- **20%**: Gateway operators (API access)
- **10%**: Reserve fund (future development)

## Smart Contracts

### SocialNetworkFund Contract

```solidity
contract SocialNetworkFund {
    // Fee collection
    function depositFees(address token, uint256 amount) external;

    // Operator registration
    function registerOperator(
        OperatorType operatorType,
        string memory endpoint,
        uint256 stakeAmount
    ) external;

    // Reward distribution
    function distributeRewards(uint256 epoch) external;

    // Operator performance tracking
    function updateOperatorMetrics(
        address operator,
        OperatorMetrics memory metrics
    ) external;
}
```

### Operator Types

```solidity
enum OperatorType {
    HUB,      // Message relay hub
    PDS,      // Personal Data Server
    GATEWAY   // API Gateway
}
```

### Operator Metrics

```solidity
struct OperatorMetrics {
    uint256 uptime;              // Uptime percentage (0-10000 = 0-100%)
    uint256 messageThroughput;   // Messages processed
    uint256 userCount;           // Users served (for PDS)
    uint256 apiRequests;         // API requests served (for Gateway)
    uint256 lastUpdate;          // Last metrics update timestamp
}
```

## Fee Distribution Algorithm

### 1. Epoch-Based Distribution

- **Epoch Duration**: 7 days
- **Distribution Frequency**: Weekly
- **Calculation**: Based on operator performance metrics

### 2. Performance Scoring

```typescript
interface OperatorScore {
  operator: string;
  type: 'hub' | 'pds' | 'gateway';
  uptimeScore: number;        // 0-1, based on uptime %
  throughputScore: number;    // 0-1, normalized by network average
  stakeScore: number;         // 0-1, based on staked amount
  totalScore: number;         // Weighted combination
}

// Scoring formula
totalScore = (
  uptimeScore * 0.4 +
  throughputScore * 0.4 +
  stakeScore * 0.2
)
```

### 3. Reward Calculation

```typescript
// For each operator type pool
const poolRewards = totalFund * poolAllocation;

// Distribute based on scores
const operatorReward = poolRewards * (operatorScore / totalPoolScore);
```

## Operator Registration

### Requirements

1. **Staking**: Minimum stake in DAEMON tokens
2. **Endpoint**: Valid network endpoint
3. **Verification**: Proof of node operation
4. **Performance**: Meet minimum thresholds

### Registration Process

```solidity
function registerOperator(
    OperatorType operatorType,
    string memory endpoint,
    uint256 stakeAmount
) external {
    require(stakeAmount >= minStake[operatorType], "Insufficient stake");
    require(isValidEndpoint(endpoint), "Invalid endpoint");

    operators[msg.sender] = Operator({
        operatorType: operatorType,
        endpoint: endpoint,
        stake: stakeAmount,
        registeredAt: block.timestamp,
        active: true
    });

    // Transfer stake to contract
    daemonToken.transferFrom(msg.sender, address(this), stakeAmount);
}
```

## Performance Monitoring

### Metrics Collection

Backend service monitors operator performance:

```typescript
// backend/src/services/social-fees.ts
interface OperatorMonitor {
  checkUptime(operator: string): Promise<number>;
  checkThroughput(operator: string): Promise<number>;
  checkUserCount(operator: string): Promise<number>;
  updateMetrics(operator: string, metrics: OperatorMetrics): Promise<void>;
}
```

### Update Frequency

- **Real-time**: Uptime checks (every 5 minutes)
- **Hourly**: Throughput metrics
- **Daily**: User count (for PDS)
- **Weekly**: Reward distribution

## Slashing

### Slashing Conditions

Operators can be slashed for:
- **Downtime**: Extended periods of unavailability
- **Misbehavior**: Invalid message propagation
- **Data Loss**: Failure to maintain data integrity
- **Fraud**: Attempting to game metrics

### Slashing Amount

```solidity
function slashOperator(address operator, uint256 amount) external onlyGovernance {
    operators[operator].stake -= amount;
    // Transfer slashed amount to treasury or burn
}
```

## Governance

### Fee Allocation Changes

- Governance can adjust fee allocation percentages
- Requires DAO vote
- Timelock for changes

### Operator Requirements

- Governance can update minimum stake requirements
- Governance can update performance thresholds
- Governance can add/remove operator types

## Integration Points

### DaemonHook Extension

```solidity
// Add to DaemonHook.sol
address public socialNetworkFund;

function setSocialNetworkFund(address _fund) external onlyOwner {
    socialNetworkFund = _fund;
}

function afterSwap(...) external returns (bytes4, int128) {
    // Existing fee collection logic

    // Route portion to Social Network Fund
    if (socialNetworkFund != address(0)) {
        uint256 socialNetworkFee = calculateSocialNetworkFee(...);
        // Transfer to SocialNetworkFund
    }
}
```

### FeeSplitter Extension

```solidity
// Add social network fee routing
function splitFees(address token, uint256 totalFees) external {
    // Existing splits...

    // Social Network Fund split
    uint256 socialNetworkCut = (totalFees * SOCIAL_NETWORK_CUT_BPS) / BPS_DENOMINATOR;
    if (socialNetworkCut > 0 && socialNetworkFund != address(0)) {
        IERC20(token).safeTransfer(socialNetworkFund, socialNetworkCut);
        ISocialNetworkFund(socialNetworkFund).depositFees(token, socialNetworkCut);
    }
}
```

## Backend Service

### Fee Distribution Service

```typescript
// backend/src/services/social-fees.ts
export class SocialFeeService {
  async monitorFeeCollection(): Promise<void> {
    // Listen to fee collection events
    // Track fee accumulation
  }

  async calculateOperatorRewards(epoch: number): Promise<RewardDistribution[]> {
    // Calculate rewards for each operator
    // Based on performance metrics
  }

  async distributeRewards(epoch: number): Promise<void> {
    // Execute reward distribution
    // Update operator balances
  }
}
```

## Economic Model

### Sustainability

- Fees must cover operator costs
- Incentivize high-quality operators
- Prevent centralization
- Enable network growth

### Token Economics

- DAEMON token used for staking
- Rewards paid in DAEMON or ETH
- Staking provides security
- Rewards incentivize participation

## Future Enhancements

- Dynamic fee allocation based on network needs
- Operator reputation system
- Automated operator onboarding
- Cross-chain fee collection
- Fee prediction and optimization

