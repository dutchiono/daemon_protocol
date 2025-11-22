import { useState, useRef } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import AIChat from './AIChat';
import './LaunchTokenModal.css';

interface LaunchTokenPageProps {
  onLaunch: (formData: TokenFormData) => Promise<void>;
}

export interface TokenFormData {
  name: string;
  symbol: string;
  image: string;
  description: string;
  fee_share_bps: number; // Fee sharing with stakers in basis points (0-10000)
}

export default function LaunchTokenPage({ onLaunch }: LaunchTokenPageProps) {
  const { address } = useAccount();
  const [formData, setFormData] = useState<TokenFormData>({
    name: '',
    symbol: '',
    image: '',
    description: '',
    fee_share_bps: 0, // Default: 0% shared with stakers
  });
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null); // Store file locally until launch
  const [imagePreview, setImagePreview] = useState<string>(''); // Local preview URL
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);


  // Update form data from AI chat
  const handleAIDataUpdate = (updates: Partial<TokenFormData>, imageFileFromAI?: File) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    // If AI chat provided an image file, store it for launch
    if (imageFileFromAI) {
      setImageFile(imageFileFromAI);
      // Clean up old preview if exists
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      const previewUrl = URL.createObjectURL(imageFileFromAI);
      setImagePreview(previewUrl);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          handleImageFile(file);
        }
      }
    }
  };

  const handleImageFile = (file: File) => {
    // Store file locally - don't upload until launch
    setImageFile(file);

    // Create local preview URL
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setFormData((prev) => ({ ...prev, image: previewUrl })); // Use preview for display

    // Clean up old preview URL if exists
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
  };

  const uploadImageToIPFS = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    // Upload to backend which will handle IPFS/metadata
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/upload/image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image to IPFS');
    }

    const data = await response.json();
    return data.imageUrl; // Returns ipfs://hash
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }

    if (!imageFile) {
      alert('Please upload an image first');
      return;
    }

    try {
      setUploadingImage(true);

      // Upload image to IPFS first
      const ipfsUrl = await uploadImageToIPFS(imageFile);

      // Update form data with IPFS URL
      const formDataWithIPFS = {
        ...formData,
        image: ipfsUrl,
      };

      await onLaunch(formDataWithIPFS);

      // Reset form after successful launch
      setFormData({
        name: '',
        symbol: '',
        image: '',
        description: '',
        fee_share_bps: 0,
      });

      // Clean up preview URL
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      setImageFile(null);
      setImagePreview('');

      alert('Token launched successfully!');
    } catch (error) {
      console.error('Error launching token:', error);
      alert(`Failed to launch token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const feeSharePercent = formData.fee_share_bps / 100;

  return (
    <div className="launch-page">
      <div className="launch-header">
        <h1>Daemon</h1>
        <ConnectButton />
      </div>

      <div className="launch-content">
          <div className="launch-container">
            {/* AI Chat Section */}
            <div className="ai-chat-section">
              <AIChat
                formData={formData}
                onDataUpdate={handleAIDataUpdate}
                address={address}
              />
            </div>

            {/* Form Section */}
            <div className="form-section">
              <form onSubmit={handleSubmit} onPaste={handlePaste}>
                {/* Image Upload */}
                <div className="form-group">
                  <label>Token Image</label>
                  <div
                    ref={dropZoneRef}
                    className={`image-drop-zone ${isDragging ? 'dragging' : ''} ${formData.image ? 'has-image' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {imagePreview || formData.image ? (
                      <img
                        src={
                          imagePreview
                            ? imagePreview
                            : formData.image.startsWith('ipfs://')
                            ? formData.image.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
                            : formData.image
                        }
                        alt="Token preview"
                      />
                    ) : (
                      <div className="drop-zone-content">
                        {uploadingImage ? (
                          <div className="upload-spinner">Uploading...</div>
                        ) : (
                          <>
                            <div className="drop-icon">📷</div>
                            <p>Drag & drop image, paste, or click to upload</p>
                          </>
                        )}
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>

                {/* Token Name */}
                <div className="form-group">
                  <label>
                    Token Name <span className="ai-badge">AI</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. My Awesome Token"
                    required
                  />
                </div>

                {/* Symbol */}
                <div className="form-group">
                  <label>
                    Symbol <span className="ai-badge">AI</span>
                  </label>
                  <input
                    type="text"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                    placeholder="e.g. MAT"
                    maxLength={10}
                    required
                  />
                </div>

                {/* Description */}
                <div className="form-group">
                  <label>
                    Description <span className="ai-badge">AI</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your token..."
                    rows={3}
                  />
                </div>

                {/* Fee Sharing Slider */}
                <div className="form-group">
                  <label>
                    Share Fees with Stakers: {feeSharePercent.toFixed(1)}%
                  </label>
                  <div className="slider-container">
                    <input
                      type="range"
                      min="0"
                      max="10000"
                      value={formData.fee_share_bps}
                      onChange={(e) => setFormData({ ...formData, fee_share_bps: parseInt(e.target.value) })}
                      className="fee-slider"
                    />
                    <div className="slider-labels">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  <small>
                    {feeSharePercent > 0
                      ? `${feeSharePercent.toFixed(1)}% of protocol fees will be shared with stakers`
                      : 'All fees go to you (no sharing with stakers)'}
                  </small>
                </div>

                <div className="form-actions">
                  <button type="submit" className="launch-button" disabled={!address}>
                    {address ? 'Launch Token' : 'Connect Wallet First'}
                  </button>
                </div>
              </form>
            </div>
          </div>
      </div>
    </div>
  );
}

