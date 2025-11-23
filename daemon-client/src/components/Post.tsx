import { useState } from 'react';
import { likePost, repostPost } from '../api/client';
import { useWallet } from '../wallet/WalletProvider';
import PostVoteClient from './post-vote/PostVoteClient';
import CommentsSection from './CommentsSection';
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
}

interface PostProps {
  post: PostData;
}

export default function Post({ post }: PostProps) {
  const { did } = useWallet();
  const [liked, setLiked] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const handleLike = async () => {
    if (!did) return;
    try {
      await likePost(did, post.hash);
      setLiked(!liked);
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleRepost = async () => {
    if (!did) return;
    try {
      await repostPost(did, post.hash);
      setReposted(!reposted);
    } catch (error) {
      console.error('Failed to repost:', error);
    }
  };

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
            <span className="post-author">@{post.fid}</span>
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
              onClick={handleLike}
            >
              ♥ Like
            </button>
            <button
              className={`post-action ${reposted ? 'reposted' : ''}`}
              onClick={handleRepost}
            >
              ↻ Repost
            </button>
            <button
              className="post-action"
              onClick={() => setShowComments(!showComments)}
            >
              💬 {showComments ? 'Hide' : 'Reply'}
            </button>
          </div>
        </div>
      </div>
      {showComments && !post.parentHash && (
        <CommentsSection postHash={post.hash} />
      )}
    </div>
  );
}

