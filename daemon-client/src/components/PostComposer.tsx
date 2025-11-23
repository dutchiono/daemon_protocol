import { useState, useRef } from 'react';
import { createPost, uploadMedia } from '../api/client';
import './PostComposer.css';

interface PostComposerProps {
  did: string | null;
  onPostCreated: () => void;
  onCancel?: () => void;
  parentHash?: string; // For replies/comments
}

interface ImagePreview {
  file: File;
  preview: string;
}

export default function PostComposer({ did, onPostCreated, onCancel, parentHash }: PostComposerProps) {
  const [text, setText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addImages(files);
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addImages = (files: File[]) => {
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Image must be 10MB or less');
        return false;
      }
      return true;
    });

    if (imagePreviews.length + validFiles.length > 4) {
      setError('Maximum 4 images per post');
      return;
    }

    const newPreviews: ImagePreview[] = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setImagePreviews([...imagePreviews, ...newPreviews]);
    setError(null);
  };

  const removeImage = (index: number) => {
    const preview = imagePreviews[index];
    URL.revokeObjectURL(preview.preview);
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    addImages(files);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageFiles: File[] = [];

    items.forEach(item => {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    });

    if (imageFiles.length > 0) {
      e.preventDefault();
      addImages(imageFiles);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!did) {
      setError('Please connect your wallet and register a Daemon ID first');
      return;
    }

    if (text.trim().length === 0 && imagePreviews.length === 0) {
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
      if (!did) {
        throw new Error('Wallet not connected');
      }

      // Upload images if any
      let embeds: Array<{ type: string; url: string }> | undefined;
      if (imagePreviews.length > 0) {
        const files = imagePreviews.map(p => p.file);
        const ipfsUrls = await uploadMedia(files);
        embeds = ipfsUrls.map(url => ({ type: 'image', url }));
      }

      await createPost(did, text, parentHash, embeds);

      // Clean up preview URLs
      imagePreviews.forEach(preview => URL.revokeObjectURL(preview.preview));
      setText('');
      setImagePreviews([]);
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
      <form
        onSubmit={handleSubmit}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="composer-content">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onPaste={handlePaste}
            placeholder={parentHash ? "Write a reply..." : "What's on your mind?"}
            maxLength={10000}
            rows={parentHash ? 4 : 8}
            className="composer-textarea"
          />

          {imagePreviews.length > 0 && (
            <div className="image-previews">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="image-preview">
                  <img src={preview.preview} alt={`Preview ${index + 1}`} />
                  <button
                    type="button"
                    className="remove-image"
                    onClick={() => removeImage(index)}
                    title="Remove image"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="composer-footer">
          <div className="composer-tools">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="image-upload-button"
              title="Add image"
              disabled={isPosting || imagePreviews.length >= 4}
            >
              📷
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />
            <span className="char-count">{text.length}/10,000</span>
          </div>
          {error && <span className="error">{error}</span>}
          <div className="composer-actions">
            {onCancel && (
              <button type="button" onClick={onCancel} className="cancel-button">
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isPosting || (text.trim().length === 0 && imagePreviews.length === 0)}
              className="post-button"
            >
              {isPosting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

