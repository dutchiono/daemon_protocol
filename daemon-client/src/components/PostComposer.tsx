import { useState } from 'react';
import { createPost } from '../api/client';
import './PostComposer.css';

interface PostComposerProps {
  did: number | null;
  onPostCreated: () => void;
  onCancel?: () => void;
}

export default function PostComposer({ did, onPostCreated, onCancel }: PostComposerProps) {
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

    if (text.length > 280) {
      setError('Post must be 280 characters or less');
      return;
    }

    setIsPosting(true);
    setError(null);

    try {
      const didString = did ? `did:daemon:${did}` : null;
      if (!didString) {
        throw new Error('Wallet not connected');
      }
      await createPost(didString, text);
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
      <h2>Create Post</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's on your mind?"
          maxLength={280}
          rows={4}
          className="composer-textarea"
        />
        <div className="composer-footer">
          <span className="char-count">{text.length}/280</span>
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

