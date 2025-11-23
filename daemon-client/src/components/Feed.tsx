import { useState } from 'react';
import PostFeed from './PostFeed';
import './Feed.css';

interface FeedProps {
  did: number | null;
}

type FeedType = 'hot' | 'top' | 'new' | 'algorithmic';

export default function Feed({ did }: FeedProps) {
  const [feedType, setFeedType] = useState<FeedType>('hot');

  return (
    <div className="feed">
      <div className="feed-header">
        <h2>Feed</h2>
        <div className="feed-type-selector">
          <button
            className={`feed-type-btn ${feedType === 'hot' ? 'active' : ''}`}
            onClick={() => setFeedType('hot')}
          >
            Hot
          </button>
          <button
            className={`feed-type-btn ${feedType === 'top' ? 'active' : ''}`}
            onClick={() => setFeedType('top')}
          >
            Top
          </button>
          <button
            className={`feed-type-btn ${feedType === 'new' ? 'active' : ''}`}
            onClick={() => setFeedType('new')}
          >
            New
          </button>
          <button
            className={`feed-type-btn ${feedType === 'algorithmic' ? 'active' : ''}`}
            onClick={() => setFeedType('algorithmic')}
          >
            For You
          </button>
        </div>
      </div>
      <PostFeed did={did} feedType={feedType} />
    </div>
  );
}

