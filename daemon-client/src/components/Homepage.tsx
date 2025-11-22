import { useState } from 'react';
import { useWallet } from '../wallet/WalletProvider';
import Feed from './Feed';
import Trending from './Trending';
import './Homepage.css';

export default function Homepage() {
  const { did } = useWallet();
  const [activeTab, setActiveTab] = useState<'feed' | 'trending'>('feed');

  return (
    <div className="homepage">
      <div className="homepage-header">
        <h1>Home</h1>
        <div className="homepage-tabs">
          <button
            className={`tab ${activeTab === 'feed' ? 'active' : ''}`}
            onClick={() => setActiveTab('feed')}
          >
            Following
          </button>
          <button
            className={`tab ${activeTab === 'trending' ? 'active' : ''}`}
            onClick={() => setActiveTab('trending')}
          >
            Trending
          </button>
        </div>
      </div>

      <div className="homepage-content">
        {activeTab === 'feed' ? (
          <Feed did={did} />
        ) : (
          <Trending />
        )}
      </div>
    </div>
  );
}

