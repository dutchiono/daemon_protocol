import { useState } from 'react';
import { useWallet } from '../wallet/WalletProvider';
import PostComposer from '../components/PostComposer';
import Feed from '../components/Feed';
import './HomePage.css';

export default function HomePage() {
  const { did } = useWallet();
  const [showComposer, setShowComposer] = useState(false);

  return (
    <div className="homepage">
      {!showComposer ? (
        <>
          <div className="homepage-header">
            <h2>Home</h2>
            {did && (
              <button
                onClick={() => setShowComposer(true)}
                className="compose-fab"
              >
                ✍️ Compose
              </button>
            )}
          </div>
          <Feed did={did} />
        </>
      ) : (
        <div className="compose-view">
          <PostComposer
            did={did}
            onPostCreated={() => {
              setShowComposer(false);
            }}
            onCancel={() => setShowComposer(false)}
          />
        </div>
      )}
    </div>
  );
}

