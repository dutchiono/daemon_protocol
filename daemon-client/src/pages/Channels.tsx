import { useState } from 'react';
import { Hash, Users } from 'lucide-react';
import './Channels.css';

export default function Channels() {
  const [channels] = useState([
    { id: 1, name: 'general', description: 'General discussion', members: 1234 },
    { id: 2, name: 'dev', description: 'Development talk', members: 567 },
    { id: 3, name: 'crypto', description: 'Crypto discussion', members: 890 },
  ]);

  return (
    <div className="channels-page">
      <div className="page-header">
        <h2>Channels</h2>
        <button className="create-channel-btn">+ Create Channel</button>
      </div>

      <div className="channels-list">
        {channels.map((channel) => (
          <div key={channel.id} className="channel-card">
            <div className="channel-icon">
              <Hash size={24} />
            </div>
            <div className="channel-info">
              <h3>#{channel.name}</h3>
              <p>{channel.description}</p>
              <div className="channel-meta">
                <Users size={16} />
                <span>{channel.members} members</span>
              </div>
            </div>
            <button className="join-btn">Join</button>
          </div>
        ))}
      </div>
    </div>
  );
}

