import { useQuery } from '@tanstack/react-query';
import Post from './Post';
import { getFeed } from '../api/client';
import './Feed.css';

interface FeedProps {
  fid: number | null;
}

export default function Feed({ fid }: FeedProps) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['feed', fid],
    queryFn: () => getFeed(fid || 0, 'algorithmic', 50),
    enabled: fid !== null,
    refetchInterval: 30000 // Refetch every 30 seconds
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
        <button onClick={() => refetch()}>Refresh</button>
      </div>
      <div className="feed-posts">
        {data.posts.map((post) => (
          <Post key={post.hash} post={post} />
        ))}
      </div>
    </div>
  );
}

