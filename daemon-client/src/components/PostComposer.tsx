import { useState } from 'react';
import { createPost } from '../api/client';
import './PostComposer.css';

interface PostComposerProps {
  did: number | null;
  onPostCreated: () => void;
  onCancel?: () => void;
  parentHash?: string; // For replies/comments
}

export default function PostComposer({ did, onPostCreated, onCancel, parentHash }: PostComposerProps) {
  const [text, setText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!did) {
      setError('Please connect your wallet and register a Daemon ID first');
      return;
    }

    if (text.trim().length === 0) {
      setError('Post cannot be empty');
      return;
    }

    // Removed 280 character limit - posts can be longer now
    if (text.length > 10000) {
      setError('Post must be 10,000 characters or less');
      return;
    }

    setIsPosting(true);
    setError(null);

    try {
      const didString = did ? `did:daemon:${did}` : null;
      if (!didString) {
        throw new Error('Wallet not connected');
      }
      await createPost(didString, text, parentHash);
      setText('');
      onPostCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="post-composer">
      {!parentHash && <h2>Create Post</h2>}
      <form onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={parentHash ? "Write a reply..." : "What's on your mind?"}
          maxLength={10000}
          rows={parentHash ? 4 : 8}
          className="composer-textarea"
        />
        <div className="composer-footer">
          <span className="char-count">{text.length}/10,000</span>
          {error && <span className="error">{error}</span>}
          <div className="composer-actions">
            {onCancel && (
              <button type="button" onClick={onCancel} className="cancel-button">
                Cancel
              </button>
            )}
            <button type="submit" disabled={isPosting || !text.trim()} className="post-button">
              {isPosting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

