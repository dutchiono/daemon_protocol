import { useState, useRef, useEffect } from 'react';
import type { TokenFormData } from './LaunchTokenModal';
import './AIChat.css';

interface AIChatProps {
  formData: TokenFormData;
  onDataUpdate: (updates: Partial<TokenFormData>, imageFile?: File) => void;
  address: string | undefined;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string; // Base64 or URL
}

export default function AIChat({ formData, onDataUpdate, address }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm Daemon AI. I can help you launch your token! You can:\n\n• Describe your token idea and I'll fill in the details\n• Paste or drag an image and I'll extract metadata\n• Ask questions about token deployment\n\nWhat would you like to create?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (content: string, image?: string) => {
    if (!content.trim() && !image) return;

    // Note: image parameter kept for compatibility but won't be sent to AI
    // Images are uploaded separately to IPFS and just update the form field
    const userMessage: Message = { role: 'user', content, image };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content, // Only send text - no images to AI
          })),
          currentFormData: formData,
          walletAddress: address,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Update form data if AI provided structured updates
      if (data.updates) {
        onDataUpdate(data.updates);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() || pendingImage) {
      sendMessage(input.trim() || 'Check this image', pendingImage || undefined);
      setInput('');
      setPendingImage(null);
    }
  };

  const handleImagePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          await handleImageUpload(file, true); // Attach to message
        }
      }
    }
  };

  const handleImageUpload = async (file: File, attachToMessage: boolean = false) => {
    // Store image locally - don't upload until launch
    // Create preview for form and pass the File object so it can be uploaded on launch
    const previewUrl = URL.createObjectURL(file);
    onDataUpdate({ image: previewUrl }, file); // Pass file object so parent can store it

    // If attaching to message, show preview
    if (attachToMessage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPendingImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // Just confirm - user can describe it in text if they want
      sendMessage(`I've selected an image. You can describe your token idea and I'll help fill in the form! The image will be uploaded to IPFS when you launch.`);
    }
  };

  const handleChatImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file, true); // Attach to message instead of sending immediately
    }
    // Reset input so same file can be selected again
    if (chatFileInputRef.current) {
      chatFileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file, false); // Send immediately
    }
  };

  const handleRemovePendingImage = () => {
    setPendingImage(null);
  };

  return (
    <div className="ai-chat">
      <div className="chat-header">
        <div className="chat-title">
          <span className="ai-icon">✨</span>
          <h3>Daemon AI</h3>
        </div>
        <button
          type="button"
          className="upload-image-button"
          onClick={() => fileInputRef.current?.click()}
          title="Upload image"
        >
          📷
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            {message.image && (
              <div className="message-image">
                <img src={message.image} alt="User upload" />
              </div>
            )}
            <div className="message-content">
              {message.content.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSubmit} onPaste={handleImagePaste}>
        {pendingImage && (
          <div className="pending-image-preview">
            <img src={pendingImage} alt="Pending upload" />
            <button
              type="button"
              className="remove-image-button"
              onClick={handleRemovePendingImage}
              title="Remove image"
            >
              ×
            </button>
          </div>
        )}
        <div className="chat-input-wrapper">
          <button
            type="button"
            className="attach-image-button"
            onClick={() => chatFileInputRef.current?.click()}
            title="Attach image"
            disabled={isLoading}
          >
            📎
          </button>
          <input
            ref={chatFileInputRef}
            type="file"
            accept="image/*"
            onChange={handleChatImageSelect}
            style={{ display: 'none' }}
          />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your token idea or paste an image..."
            className="chat-input"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="send-button"
            disabled={isLoading || (!input.trim() && !pendingImage)}
          >
            →
          </button>
        </div>
      </form>
    </div>
  );
}

