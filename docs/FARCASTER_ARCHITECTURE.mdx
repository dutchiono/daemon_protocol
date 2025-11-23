# Farcaster Contract Architecture Study

## Overview

Farcaster uses a modular contract architecture with three main contracts:
1. **IdRegistry** - Manages FID (Farcaster ID) ownership and registration
2. **KeyRegistry** - Manages Ed25519 signing keys associated with FIDs
3. **StorageRegistry** - Manages storage allocation and rent payments

## IdRegistry

**Purpose**: Maps wallet addresses to FIDs and manages FID ownership.

**Key Features**:
- FID registration (one FID per wallet)
- FID transfer (to another wallet)
- Recovery addresses (for account recovery)
- FID ownership tracking

**Core Functions**:
- `register()` - Register a new FID for the caller
- `transfer()` - Transfer FID to another address
- `recover()` - Recover FID using recovery address
- `fidOf(address)` - Get FID for a wallet
- `ownerOf(uint256 fid)` - Get owner of a FID

## KeyRegistry

**Purpose**: Manages Ed25519 signing keys for message signing.

**Key Features**:
- Add signing keys to a FID
- Remove/revoke signing keys
- Key metadata (expiration, permissions)
- Multiple keys per FID

**Core Functions**:
- `add()` - Add a signing key for a FID
- `remove()` - Remove a signing key
- `getKeys(uint256 fid)` - Get all keys for a FID

## StorageRegistry

**Purpose**: Manages storage allocation and rent payments.

**Key Features**:
- Storage units per FID
- Rent payment mechanism
- Storage expiration
- Price per storage unit

**Core Functions**:
- `rent()` - Pay for storage units
- `getStorageUnits(uint256 fid)` - Get storage units for a FID
- `getPrice()` - Get price per storage unit

## Our Implementation Plan

We'll build custom contracts based on Farcaster's architecture but adapted for our needs:

1. **IdRegistry.sol** - Simplified version with FID registration and ownership
2. **KeyRegistry.sol** - Ed25519 key management
3. **StorageRegistry.sol** - Storage with x402 integration (free on testnet)

## Integration Points

- **Hub**: Uses IdRegistry + KeyRegistry to verify FIDs and signatures
- **PDS**: Uses IdRegistry for wallet signup
- **Gateway**: Uses StorageRegistry for x402 payment verification

