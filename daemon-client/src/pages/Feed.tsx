import { useQuery } from '@tanstack/react-query';
import Post from '../components/Post';
import { getFeed } from '../api/client';
import { useWallet } from '../wallet/WalletProvider';
import './Feed.css';

export default function Feed() {
  const { did } = useWallet();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['feed', did],
    queryFn: () => getFeed(did, 'algorithmic', 50),
    enabled: did !== null,
    refetchInterval: 30000,
    retry: 2
  });

  if (isLoading) {
    return <div className="page-loading">Loading feed...</div>;
  }

  if (error) {
    return (
      <div className="page-error">
        <h3>Error loading feed</h3>
        <p>{error.message || 'Failed to connect to server'}</p>
        <p style={{ fontSize: '0.9rem', color: '#888', marginTop: '0.5rem' }}>
          Check if server is running at {import.meta.env.VITE_GATEWAY_URL || 'http://50.21.187.69:4003'}
        </p>
        <button onClick={() => refetch()} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
          Retry
        </button>
      </div>
    );
  }

  if (!data || (data.posts && data.posts.length === 0)) {
    return (
      <div className="page-empty">
        <h2>Feed</h2>
        <p>No posts yet. Be the first to post!</p>
      </div>
    );
  }

  return (
    <div className="feed-page">
      <div className="page-header">
        <h2>Feed</h2>
        <button onClick={() => refetch()} className="refresh-btn">
          Refresh
        </button>
      </div>
      <div className="feed-posts">
        {data.posts.map((post: any) => (
          <Post key={post.hash} post={post} />
        ))}
      </div>
    </div>
  );
}

