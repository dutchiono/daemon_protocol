import { useQuery } from '@tanstack/react-query';
import { getFeed } from '../api/client';
import ReplyVotes from './ReplyVotes';
import './RepliesSection.css';

interface ReplyData {
  hash: string;
  fid: number;
  did?: string;
  username?: string;
  text: string;
  timestamp: number;
  parentHash?: string;
  voteCount?: number;
  upvoteCount?: number;
  downvoteCount?: number;
  currentVote?: 'UP' | 'DOWN' | null;
}

interface RepliesSectionProps {
  postHash: string;
}

export default function RepliesSection({ postHash }: RepliesSectionProps) {
  // Fetch replies for this post
  const { data, isLoading } = useQuery({
    queryKey: ['replies', postHash],
    queryFn: async () => {
      try {
        // Get all posts, filter for ones with parentHash matching this post
        const feedData = await getFeed(null, 'new', 200);
        const allPosts = feedData.posts || [];

        // Filter for replies (posts with this postHash as parentHash)
        const replies = allPosts.filter(
          (post: ReplyData) => post.parentHash === postHash
        ) as ReplyData[];

        // Sort by vote count (highest first), then by timestamp (newest first)
        const sorted = replies.sort((a: ReplyData, b: ReplyData) => {
          const aVotes = a.voteCount || 0;
          const bVotes = b.voteCount || 0;
          if (aVotes !== bVotes) return bVotes - aVotes;
          return b.timestamp - a.timestamp;
        });

        return sorted;
      } catch (error) {
        console.error('Error fetching replies:', error);
        return [];
      }
    },
    enabled: !!postHash,
    refetchInterval: 30000, // Refetch every 30 seconds to get new replies
  });

  const replies: ReplyData[] = data || [];

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="replies-section">
      {isLoading ? (
        <div className="replies-loading">Loading replies...</div>
      ) : replies.length === 0 ? (
        <div className="replies-empty">No replies yet.</div>
      ) : (
        <div className="replies-list">
          {replies.map((reply) => (
            <div key={reply.hash} className="reply">
              <div className="reply-container">
                <ReplyVotes
                  replyHash={reply.hash}
                  initialVoteCount={reply.voteCount ?? 0}
                  initialVote={reply.currentVote ?? null}
                />
                <div className="reply-content">
                  <div className="reply-header">
                    <span className="reply-author">
                      @{reply.username || reply.did || reply.fid || 'unknown'}
                    </span>
                    <span className="reply-time">{formatTimestamp(reply.timestamp)}</span>
                  </div>
                  <div className="reply-text" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {reply.text}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

