import { useQuery } from '@tanstack/react-query';
import Post from './Post';
import { getFeed } from '../api/client';
import './Feed.css';

interface FeedProps {
  did: number | null;
}

export default function Feed({ did }: FeedProps) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['feed', did],
    queryFn: () => getFeed(did || 0, 'algorithmic', 50),
    enabled: did !== null,
    refetchInterval: 30000
  });

  if (isLoading) {
    return <div className="feed-loading">Loading feed...</div>;
  }

  if (error) {
    return <div className="feed-error">Error loading feed: {error.message}</div>;
  }

  if (!data || data.posts.length === 0) {
    return <div className="feed-empty">No posts yet. Be the first to post!</div>;
  }

  return (
    <div className="feed">
      <div className="feed-header">
        <h2>Feed</h2>
        <button onClick={() => refetch()} className="refresh-btn">Refresh</button>
      </div>
      <div className="feed-posts">
        {data.posts.map((post) => (
          <Post key={post.hash} post={post} />
        ))}
      </div>
    </div>
  );
}

