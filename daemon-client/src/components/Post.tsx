import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { likePost, repostPost, createPost, getReactions, getFeed, getReplies } from '../api/client';
import { useWallet } from '../wallet/WalletProvider';
import PostVoteClient from './post-vote/PostVoteClient';
import RepliesSection from './RepliesSection';
import './Post.css';

interface PostData {
  hash: string;
  fid: number;
  did?: string; // Added for vote system
  text: string;
  timestamp: number;
  parentHash?: string;
  embeds?: any[];
  voteCount?: number; // Vote data
  upvoteCount?: number;
  downvoteCount?: number;
  currentVote?: 'UP' | 'DOWN' | null;
  signature?: string; // Ed25519 signature
  signingKey?: string; // Ed25519 public key
  verified?: boolean; // Computed: signature && signingKey
  username?: string; // Username from profile
  liked?: boolean; // Whether current user liked this
  reposted?: boolean; // Whether current user reposted this
  replyCount?: number; // Number of replies
}

interface PostProps {
  post: PostData;
}

export default function Post({ post }: PostProps) {
  const { did } = useWallet();
  const queryClient = useQueryClient();
  const [showReplies, setShowReplies] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');

  // Fetch reaction state for this post
  const { data: reactions } = useQuery({
    queryKey: ['reactions', post.hash, did],
    queryFn: () => getReactions(post.hash, did),
    enabled: !!did && !!post.hash,
  });

  const liked = reactions?.liked ?? post.liked ?? false;
  const reposted = reactions?.reposted ?? post.reposted ?? false;

  // Fetch reply count
  const { data: replyCount } = useQuery({
    queryKey: ['replyCount', post.hash],
    queryFn: async () => {
      try {
        const repliesData = await getReplies(post.hash);
        return repliesData.replies?.length || 0;
      } catch {
        return 0;
      }
    },
    enabled: !!post.hash && !post.parentHash,
  });

  const { mutate: submitReply, isPending: isSubmittingReply } = useMutation({
    mutationFn: async (text: string) => {
      if (!did) throw new Error('Wallet not connected');
      if (!text.trim()) throw new Error('Reply cannot be empty');
      return await createPost(did, text, post.hash);
    },
    onSuccess: () => {
      setReplyText('');
      setShowReplyInput(false);
      queryClient.invalidateQueries({ queryKey: ['replyCount', post.hash] });
      queryClient.invalidateQueries({ queryKey: ['replies', post.hash] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: (error) => {
      console.error('Error submitting reply:', error);
      alert('Failed to post reply. Please try again.');
    },
  });

  const { mutate: handleLike, isPending: isLiking } = useMutation({
    mutationFn: async () => {
      if (!did) throw new Error('Wallet not connected');
      return await likePost(did, post.hash);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reactions', post.hash, did] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: (error) => {
      console.error('Failed to like post:', error);
      alert('Failed to like post. Please try again.');
    },
  });

  const { mutate: handleRepost, isPending: isReposting } = useMutation({
    mutationFn: async () => {
      if (!did) throw new Error('Wallet not connected');
      return await repostPost(did, post.hash);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reactions', post.hash, did] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: (error) => {
      console.error('Failed to repost:', error);
      alert('Failed to repost. Please try again.');
    },
  });

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
    <div className="post">
      <div className="post-container">
        <PostVoteClient
          postHash={post.hash}
          initialVoteCount={post.voteCount ?? 0}
          initialVote={post.currentVote ?? null}
        />
        <div className="post-content-wrapper">
          <div className="post-header">
            <span className="post-author">
              @{post.username || post.did || post.fid || 'unknown'}
              {post.verified && (
                <span className="verified-badge" title="Cryptographically signed post">
                  ✓
                </span>
              )}
            </span>
            <span className="post-time">{formatTimestamp(post.timestamp)}</span>
          </div>
          <div className="post-content">
            <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{post.text}</p>
            {post.embeds && post.embeds.length > 0 && (
              <div className="post-embeds">
                {post.embeds.map((embed, i) => (
                  <div key={i} className="post-embed">
                    {embed.type === 'image' && embed.url && (
                      <img src={embed.url} alt="Embed" />
                    )}
                    {embed.type === 'url' && embed.metadata && (
                      <a href={embed.url} target="_blank" rel="noopener noreferrer">
                        <h4>{embed.metadata.title}</h4>
                        <p>{embed.metadata.description}</p>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="post-actions">
            <button
              className={`post-action ${liked ? 'liked' : ''}`}
              onClick={() => handleLike()}
              disabled={isLiking || !did}
            >
              ♥ {liked ? 'Liked' : 'Like'}
            </button>
            <button
              className={`post-action ${reposted ? 'reposted' : ''}`}
              onClick={() => handleRepost()}
              disabled={isReposting || !did}
            >
              ↻ {reposted ? 'Reposted' : 'Repost'}
            </button>
            <button
              className="post-action"
              onClick={() => {
                if (!showReplyInput) {
                  setShowReplyInput(true);
                  setShowReplies(true);
                } else {
                  setShowReplyInput(false);
                }
              }}
              disabled={!did}
            >
              💬 {replyCount ? `${replyCount} ` : ''}Reply
            </button>
          </div>
        </div>
      </div>

      {/* Inline reply input */}
      {showReplyInput && did && !post.parentHash && (
        <div className="reply-input-section">
          <textarea
            className="reply-textarea"
            placeholder="Write a reply..."
            rows={3}
            maxLength={1000}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <div className="reply-actions">
            <button
              className="reply-cancel-button"
              onClick={() => {
                setShowReplyInput(false);
                setReplyText('');
              }}
              disabled={isSubmittingReply}
            >
              Cancel
            </button>
            <button
              className="reply-submit-button"
              onClick={() => {
                const text = replyText.trim();
                if (text) {
                  submitReply(text);
                }
              }}
              disabled={isSubmittingReply || !replyText.trim()}
            >
              {isSubmittingReply ? 'Posting...' : 'Reply'}
            </button>
          </div>
        </div>
      )}

      {/* Threaded replies section */}
      {showReplies && !post.parentHash && (
        <div className="replies-thread">
          <RepliesSection postHash={post.hash} />
        </div>
      )}
    </div>
  );
}

