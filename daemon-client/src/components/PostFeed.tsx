import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import Post from './Post';
import { getFeed } from '../api/client';
import './PostFeed.css';

interface PostFeedProps {
  did: string | null;
  feedType?: 'hot' | 'top' | 'new' | 'algorithmic';
}

const POSTS_PER_PAGE = 25;

export default function PostFeed({ did, feedType = 'hot' }: PostFeedProps) {
  const didString = did; // did is already a full DID string
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['feed', did, feedType],
    queryFn: ({ pageParam }) => {
      return getFeed(didString, feedType, POSTS_PER_PAGE, pageParam as string | undefined);
    },
    getNextPageParam: (lastPage) => {
      return lastPage.cursor || undefined;
    },
    enabled: did !== null,
    initialPageParam: undefined,
  });

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="feed-loading">
        <Loader2 className="spinner" />
        <p>Loading feed...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="feed-error">
        Error loading feed: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  const posts = data?.pages.flatMap((page) => page.posts || []) || [];

  if (posts.length === 0) {
    return <div className="feed-empty">No posts yet. Be the first to post!</div>;
  }

  return (
    <div className="post-feed">
      {posts.map((post: any) => (
        <Post key={post.hash} post={post} />
      ))}

      {/* Loading trigger */}
      <div ref={loadMoreRef} className="load-more-trigger">
        {isFetchingNextPage && (
          <div className="loading-more">
            <Loader2 className="spinner" />
            <span>Loading more posts...</span>
          </div>
        )}
        {!hasNextPage && posts.length > 0 && (
          <div className="feed-end">No more posts to load</div>
        )}
      </div>
    </div>
  );
}

