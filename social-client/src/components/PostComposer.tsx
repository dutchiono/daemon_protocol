import { useState } from 'react';
import { createPost } from '../api/client';
import './PostComposer.css';

interface PostComposerProps {
  fid: number | null;
  onPostCreated: () => void;
}

export default function PostComposer({ fid, onPostCreated }: PostComposerProps) {
  const [text, setText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fid) {
      setError('Please connect your wallet first');
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
      await createPost(fid, text);
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
        />
        <div className="composer-footer">
          <span className="char-count">{text.length}/280</span>
          {error && <span className="error">{error}</span>}
          <button type="submit" disabled={isPosting || !text.trim()}>
            {isPosting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}

