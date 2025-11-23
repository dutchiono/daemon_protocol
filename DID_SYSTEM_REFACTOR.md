# DID System Refactoring - Complete Removal of FID

## Overview
Daemon Social Network now uses DIDs (Decentralized Identifiers) as the primary identifier throughout the entire system. All FID (Farcaster ID) references have been removed from the application code.

## Changes Made

### 1. Database Schema
- **Migration**: `backend/db/migrations/remove-fid-completely.sql`
  - Removed all `fid` columns from tables
  - Made `did` the primary key in `users` and `profiles` tables
  - Updated all foreign key relationships to use `did`
  - Updated all indexes to use `did` instead of `fid`

### 2. Hub Service
- **Types**: `Message` interface now uses `did: string` instead of `fid: number`
- **Database**: All queries use `did` column instead of `fid`
- **API Endpoints**:
  - Changed `/api/v1/messages/fid/:fid` to `/api/v1/messages/did/:did`
  - Updated `/api/v1/messages/batch` to accept `dids` parameter instead of `fids`

### 3. Gateway Service
- **Aggregation Layer**:
  - `getFollows()` now returns `string[]` (DIDs) instead of `number[]` (FIDs)
  - `getPostsFromUsers()` now accepts `dids: string[]` instead of `fids: number[]`
  - All database queries use `did` directly
  - Removed all `didToFid()` conversion calls
- **Gateway Service**:
  - Removed all `didToFid()` conversion calls
  - All methods work with DIDs directly

### 4. PDS Service
- **Database**: `createProfile()` now uses `did` as primary key, no FID extraction
- **Service**: `createAccountWithWallet()` updated to focus on DIDs
  - Still calls IdRegistry contract (which uses "fidOf" method name)
  - But treats returned value as numeric identifier, not "FID"
  - Returns only `{ did, handle }` - no `fid` in response

### 5. Type Definitions
- **Hub**: `Message.mentions` changed from `number[]` to `string[]` (array of DIDs)
- **Gateway**: All types updated to use `did: string` with comments clarifying it's a Daemon DID

## What Remains

### Contract Interface
The IdRegistry contract still uses "FID" terminology in method names (`fidOf`, `nextFID`), but:
- This is just the contract's naming convention
- The returned numeric value is used to construct `did:daemon:${numericId}`
- The application code treats it as a numeric identifier, not a "FID"

### Client Code
- Client components may still reference FIDs in some places
- These need to be updated to use DIDs only

### Utility Functions
- `didToFid()` and `fidToDid()` functions still exist but should be deprecated
- They may be needed temporarily for backwards compatibility during migration

## Migration Steps

1. Run the database migration: `backend/db/migrations/remove-fid-completely.sql`
2. Rebuild all services (Hub, PDS, Gateway)
3. Update client code to use DIDs only
4. Test end-to-end flow

## Notes

- DIDs are the primary identifier: `did:daemon:${numericId}`
- The numeric part is just part of the DID string - never extracted and used separately
- All database queries use `did` column directly
- All API endpoints accept and return DIDs

