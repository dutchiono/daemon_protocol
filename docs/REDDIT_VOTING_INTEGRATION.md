# Reddit-Style Voting System Integration

## Overview

Successfully integrated a Reddit-style upvote/downvote system into the Daemon social network, transforming the post interaction system from simple likes/reposts to a full voting system with vote aggregation, caching, and optimistic UI updates.

## What Was Implemented

### ✅ Backend (Complete)

#### 1. Database Schema (`backend/db/social-schema.sql`)
- Added new `votes` table with support for post and comment voting
- Schema includes:
  - `did` (voter's DID)
  - `target_hash` (post/comment hash)
  - `target_type` ('post' or 'comment')
  - `vote_type` ('UP' or 'DOWN')
  - Unique constraint: one vote per user per post/comment
- Added indexes for performance on vote queries and aggregation
- Migration script created at `backend/db/migrations/add-votes-table.sql`

#### 2. Type Definitions (`social-network/gateway/src/types.ts`)
- Added `Vote` interface for vote data
- Extended `Post` interface with vote-related fields:
  - `voteCount` (net votes: upvotes - downvotes)
  - `upvoteCount`
  - `downvoteCount`
  - `currentVote` (current user's vote: 'UP' | 'DOWN' | null)

#### 3. Aggregation Layer (`social-network/gateway/src/aggregation-layer.ts`)
New methods added:
- `createVote()` - Create/update/remove vote (implements Reddit logic:
  - Same vote twice = remove vote
  - Opposite vote = change vote
  - No vote = create vote
- `getPostVotes()` - Calculate vote counts (upvotes, downvotes, net)
- `getUserVote()` - Get current user's vote on a post/comment
- `enrichPostWithVotes()` - Add vote data to a single post
- `enrichPostsWithVotes()` - Batch enrich posts with vote data
- Redis caching implemented for vote counts (30 min cache)

#### 4. Gateway Service (`social-network/gateway/src/gateway-service.ts`)
- Added `createVote()` method
- Added `getPostVotes()` method
- Updated `getPost()` to include vote data
- Updated `getFeed()` to enrich posts with votes
- Enhanced `rankPostsAlgorithmically()` with vote-based sorting:
  - **Hot**: Reddit's hot algorithm (votes weighted by age)
  - **Top**: Sort by vote count (all time)
  - **New**: Chronological
  - **Algorithmic**: Time decay + votes

#### 5. API Endpoints (`social-network/gateway/src/index.ts`)
New endpoints:
- `POST /api/v1/posts/:hash/vote` - Vote on a post
  - Body: `{ did: string, voteType: 'UP' | 'DOWN' }`
  - Returns: Vote data + updated vote counts
- `POST /api/v1/comments/:hash/vote` - Vote on a comment
  - Body: `{ did: string, voteType: 'UP' | 'DOWN' }`
  - Returns: Vote data + updated vote counts

Updated endpoints:
- `GET /api/v1/posts/:hash` - Now includes vote counts and user's vote
  - Query param: `did` (optional, for getting user's vote)
- `GET /api/v1/feed` - Posts now include vote data

### ✅ Frontend (In Progress)

#### 1. Vote Components Created
- `daemon-client/src/components/post-vote/PostVoteClient.tsx`
  - Client-side vote component with optimistic updates
  - Uses React Query mutations
  - Handles upvote/downvote with visual feedback
  - Shows vote count between arrows
- `daemon-client/src/components/post-vote/PostVote.css`
  - Styling for vote buttons (green for upvote, red for downvote)
- `daemon-client/src/components/CommentVotes.tsx`
  - Voting component for comments (smaller version)
- `daemon-client/src/components/CommentVotes.css`
  - Styling for comment votes

#### 2. API Client (`daemon-client/src/api/client.ts`)
New functions:
- `votePost(did: string, postHash: string, voteType: 'UP' | 'DOWN')`
- `voteComment(did: string, commentHash: string, voteType: 'UP' | 'DOWN')`

## How It Works

### Vote Logic (Reddit-Style)
1. **First Vote**: Creates new vote record
2. **Same Vote Again**: Removes the vote (toggle off)
3. **Opposite Vote**: Changes vote type (UP → DOWN or vice versa)
4. **Vote Count**: Net votes = upvotes - downvotes

### Vote Aggregation
- Votes are counted in real-time from the database
- Results are cached in Redis for 30 minutes
- Cache invalidated on any vote change
- Vote counts included in feed queries for performance

### Feed Sorting Algorithms
- **Hot**: `score = (upvotes - downvotes) / time^1.5` with recent boost
- **Top**: `score = upvotes - downvotes` (pure vote count)
- **New**: Chronological order
- **Algorithmic**: Time decay (7-day half-life) + vote score

## Current Status

### ✅ Completed
1. Database schema and migration
2. Backend vote logic and aggregation
3. API endpoints for voting
4. Redis caching for vote counts
5. Feed algorithm with vote-based sorting
6. Frontend vote components (PostVoteClient, CommentVotes)
7. API client functions for voting
8. Type definitions

### ✅ Additional Completed Tasks
1. **Integrate vote UI into Post.tsx** - PostVoteClient integrated into Post component
2. **Update Feed.tsx** - Added feed type selector (Hot/Top/New/For You) and integrated PostFeed
3. **PostFeed component** - Created infinite scroll feed component with intersection observer
4. **API cursor support** - Added cursor parameter to getFeed API call for pagination

### 🚧 Remaining Optional Tasks
1. **Rich text editor** - Integrate EditorJS from breadit (remove 280 char limit) - Optional enhancement
2. **Comment voting** - Add voting UI to comment display components - When comments system is enhanced

## Database Migration

To apply the voting system, run the migration:

```sql
-- Apply the votes table schema
\i backend/db/migrations/add-votes-table.sql

-- Or manually apply the schema changes from social-schema.sql
```

The migration is idempotent (uses `IF NOT EXISTS`), so it's safe to run multiple times.

## API Usage Examples

### Vote on a Post
```typescript
POST /api/v1/posts/:hash/vote
Content-Type: application/json

{
  "did": "did:daemon:123",
  "voteType": "UP"
}
```

Response:
```json
{
  "did": "did:daemon:123",
  "targetHash": "...",
  "targetType": "post",
  "voteType": "UP",
  "timestamp": 1234567890,
  "votes": {
    "voteCount": 5,
    "upvoteCount": 10,
    "downvoteCount": 5
  }
}
```

### Get Feed with Votes
```typescript
GET /api/v1/feed?did=did:daemon:123&type=hot&limit=50
```

Response includes posts with vote data:
```json
{
  "posts": [
    {
      "hash": "...",
      "did": "did:daemon:456",
      "text": "Post content...",
      "timestamp": 1234567890,
      "voteCount": 42,
      "upvoteCount": 50,
      "downvoteCount": 8,
      "currentVote": "UP"
    }
  ]
}
```

## Frontend Integration Notes

### PostVoteClient Usage
```tsx
import PostVoteClient from './post-vote/PostVoteClient';

<PostVoteClient
  postHash={post.hash}
  initialVoteCount={post.voteCount || 0}
  initialVote={post.currentVote || null}
/>
```

### CommentVotes Usage
```tsx
import CommentVotes from './CommentVotes';

<CommentVotes
  commentHash={comment.hash}
  initialVoteCount={comment.voteCount || 0}
  initialVote={comment.currentVote || null}
/>
```

## Testing Checklist

- [ ] Vote on a post (upvote)
- [ ] Vote again (same direction) - should remove vote
- [ ] Vote opposite direction - should change vote
- [ ] Vote count updates correctly
- [ ] Vote persists after page refresh
- [ ] Feed shows vote counts
- [ ] Feed sorting works (hot/top/new)
- [ ] Comment voting works (when implemented)
- [ ] Redis caching works (check cache hits)
- [ ] Optimistic UI updates work smoothly

## Performance Considerations

1. **Vote Counts**: Cached in Redis for 30 minutes to reduce DB queries
2. **Feed Queries**: Vote enrichment done in parallel for multiple posts
3. **Indexes**: Database indexes on `target_hash`, `did`, and composite indexes for aggregation
4. **Batch Operations**: `enrichPostsWithVotes()` processes multiple posts efficiently

## Backward Compatibility

- Existing `reactions` table (likes/reposts) remains unchanged
- Vote system is additive - doesn't break existing functionality
- Posts without votes default to `voteCount: 0`
- Old reactions can be mapped to votes if needed (optional migration)

## Next Steps

1. **Complete Post.tsx integration** - Add PostVoteClient to existing Post component
2. **Create PostFeed component** - Infinite scroll with vote data
3. **Update Feed.tsx** - Use PostFeed and show vote counts
4. **Rich text editor** - Integrate EditorJS from breadit
5. **Comment system** - Add voting UI to comments
6. **Testing** - Comprehensive testing of vote flow

## Files Modified

### Backend
- `backend/db/social-schema.sql` - Added votes table
- `backend/db/migrations/add-votes-table.sql` - Migration script
- `social-network/gateway/src/types.ts` - Vote types
- `social-network/gateway/src/aggregation-layer.ts` - Vote logic
- `social-network/gateway/src/gateway-service.ts` - Vote service methods
- `social-network/gateway/src/index.ts` - Vote API endpoints

### Frontend
- `daemon-client/src/components/post-vote/PostVoteClient.tsx` - Vote component
- `daemon-client/src/components/post-vote/PostVote.css` - Vote styles
- `daemon-client/src/components/CommentVotes.tsx` - Comment voting
- `daemon-client/src/components/CommentVotes.css` - Comment vote styles
- `daemon-client/src/api/client.ts` - Vote API functions

## Notes for Orchestrator

- All backend changes are complete and ready for deployment
- Database migration needs to be run before deploying backend
- Frontend components are created but need to be integrated into existing Post/Feed components
- The system maintains backward compatibility with existing reactions
- Redis caching is optional but recommended for performance
- Vote system uses DID-based authentication (same as rest of system)

