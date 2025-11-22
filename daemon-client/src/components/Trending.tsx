import { useQuery } from '@tanstack/react-query';
import Post from './Post';
import { getFeed } from '../api/client';
import './Trending.css';

export default function Trending() {
  // For trending, we'd get a different feed (most popular posts)
  // For now, use regular feed
  const { data, isLoading, error } = useQuery({
    queryKey: ['trending'],
    queryFn: () => getFeed(0, 'algorithmic', 50), // No specific user for trending
    refetchInterval: 60000 // Every minute
  });

  if (isLoading) {
    return <div className="trending-loading">Loading trending posts...</div>;
  }

  if (error) {
    return <div className="trending-error">Error loading trending: {error.message}</div>;
  }

  if (!data || data.posts.length === 0) {
    return <div className="trending-empty">No trending posts yet</div>;
  }

  return (
    <div className="trending">
      <div className="trending-header">
        <h2>Trending Now</h2>
        <p className="trending-subtitle">Most popular posts right now</p>
      </div>
      <div className="trending-posts">
        {data.posts.map((post: any, index: number) => (
          <div key={post.hash} className="trending-item">
            <span className="trending-rank">#{index + 1}</span>
            <Post post={post} />
          </div>
        ))}
      </div>
    </div>
  );
}

