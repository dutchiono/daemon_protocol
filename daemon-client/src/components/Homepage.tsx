import { useState } from 'react';
import Feed from './Feed';
import Trending from './Trending';
import './Homepage.css';

interface HomepageProps {
  fid: number | null;
}

export default function Homepage({ fid }: HomepageProps) {
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
          <Feed fid={fid} />
        ) : (
          <Trending />
        )}
      </div>
    </div>
  );
}

