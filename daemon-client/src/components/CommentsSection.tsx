import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFeed, createPost } from '../api/client';
import { useWallet } from '../wallet/WalletProvider';
import { fidToDid } from '../utils/did';
import CommentVotes from './CommentVotes';
import './CommentsSection.css';

interface CommentData {
  hash: string;
  fid: number;
  did?: string;
  text: string;
  timestamp: number;
  parentHash?: string;
  voteCount?: number;
  upvoteCount?: number;
  downvoteCount?: number;
  currentVote?: 'UP' | 'DOWN' | null;
}

interface CommentsSectionProps {
  postHash: string;
}

export default function CommentsSection({ postHash }: CommentsSectionProps) {
  const { did } = useWallet();
  const queryClient = useQueryClient();
  const [showComposer, setShowComposer] = useState(false);
  const [commentText, setCommentText] = useState('');
  const didString = did ? fidToDid(did) : null;

  // Fetch replies (comments) for this post
  // Comments are posts with parentHash matching this post's hash
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['comments', postHash],
    queryFn: async () => {
      try {
        // Get all posts, filter for ones with parentHash matching this post
        const feedData = await getFeed(null, 'new', 200);
        const allPosts = feedData.posts || [];

        // Filter for comments (posts with this postHash as parentHash)
        const comments = allPosts.filter(
          (post: CommentData) => post.parentHash === postHash
        ) as CommentData[];

        // Enrich comments with vote data if needed
        // Sort by vote count (highest first), then by timestamp (newest first)
        const sorted = comments.sort((a: CommentData, b: CommentData) => {
          const aVotes = a.voteCount || 0;
          const bVotes = b.voteCount || 0;
          if (aVotes !== bVotes) return bVotes - aVotes;
          return b.timestamp - a.timestamp;
        });

        return sorted;
      } catch (error) {
        console.error('Error fetching comments:', error);
        return [];
      }
    },
    enabled: !!postHash,
    refetchInterval: 30000, // Refetch every 30 seconds to get new comments
  });

  const { mutate: submitComment, isPending: isSubmitting } = useMutation({
    mutationFn: async (text: string) => {
      if (!didString) throw new Error('Wallet not connected');
      if (!text.trim()) throw new Error('Comment cannot be empty');
      return await createPost(didString, text, postHash);
    },
    onSuccess: () => {
      setShowComposer(false);
      setCommentText('');
      // Invalidate and refetch comments
      queryClient.invalidateQueries({ queryKey: ['comments', postHash] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      // Refetch after a short delay to ensure backend has processed
      setTimeout(() => {
        refetch();
      }, 500);
    },
    onError: (error) => {
      console.error('Error submitting comment:', error);
    },
  });

  const comments: CommentData[] = data || [];

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
    <div className="comments-section">
      <div className="comments-header">
        <h3>{comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}</h3>
        {did && (
          <button
            className="reply-button"
            onClick={() => setShowComposer(!showComposer)}
            disabled={isSubmitting}
          >
            {showComposer ? 'Cancel' : 'Add Comment'}
          </button>
        )}
      </div>

      {showComposer && did && (
        <div className="comment-composer-wrapper">
          <div className="simple-composer">
            <textarea
              className="comment-textarea"
              placeholder="Write a comment..."
              rows={3}
              maxLength={1000}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <div className="composer-actions">
              <button
                className="cancel-button"
                onClick={() => {
                  setShowComposer(false);
                  setCommentText('');
                }}
              >
                Cancel
              </button>
              <button
                className="submit-button"
                onClick={() => {
                  const text = commentText.trim();
                  if (text) {
                    submitComment(text);
                    setCommentText('');
                  }
                }}
                disabled={isSubmitting || !commentText.trim()}
              >
                {isSubmitting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="comments-loading">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="comments-empty">
          {did ? 'No comments yet. Be the first to comment!' : 'No comments yet.'}
        </div>
      ) : (
        <div className="comments-list">
          {comments.map((comment) => (
            <div key={comment.hash} className="comment">
              <div className="comment-container">
                <CommentVotes
                  commentHash={comment.hash}
                  initialVoteCount={comment.voteCount ?? 0}
                  initialVote={comment.currentVote ?? null}
                />
                <div className="comment-content">
                  <div className="comment-header">
                    <span className="comment-author">@{comment.fid}</span>
                    <span className="comment-time">{formatTimestamp(comment.timestamp)}</span>
                  </div>
                  <div className="comment-text" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{comment.text}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

