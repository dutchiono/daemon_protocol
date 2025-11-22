import { useState } from 'react';
import Post from './Post';
import './Channels.css';

interface Channel {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  posts: any[];
}

interface ChannelsProps {
  fid: number | null;
}

export default function Channels({ fid }: ChannelsProps) {
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

  // Mock channels - would come from API
  const [channels] = useState<Channel[]>([
    {
      id: '1',
      name: 'General',
      description: 'General discussion',
      memberCount: 1234,
      posts: []
    },
    {
      id: '2',
      name: 'Dev',
      description: 'Developer discussions',
      memberCount: 567,
      posts: []
    },
    {
      id: '3',
      name: 'Crypto',
      description: 'Cryptocurrency talk',
      memberCount: 890,
      posts: []
    }
  ]);

  const currentChannel = channels.find(c => c.id === selectedChannel);

  return (
    <div className="channels">
      <div className="channels-sidebar">
        <div className="channels-header">
          <h2>Channels</h2>
          <button className="new-channel-btn">+ New</button>
        </div>
        <div className="channels-list">
          {channels.map(channel => (
            <button
              key={channel.id}
              className={`channel-item ${selectedChannel === channel.id ? 'active' : ''}`}
              onClick={() => setSelectedChannel(channel.id)}
            >
              <div className="channel-info">
                <div className="channel-name">#{channel.name}</div>
                <div className="channel-meta">
                  {channel.memberCount} members
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="channels-main">
        {currentChannel ? (
          <>
            <div className="channel-header">
              <h1>#{currentChannel.name}</h1>
              <p className="channel-description">{currentChannel.description}</p>
            </div>
            <div className="channel-posts">
              {currentChannel.posts.length === 0 ? (
                <div className="channel-empty">
                  No posts in this channel yet. Be the first to post!
                </div>
              ) : (
                currentChannel.posts.map(post => (
                  <Post key={post.hash} post={post} />
                ))
              )}
            </div>
          </>
        ) : (
          <div className="channels-welcome">
            <h2>Select a channel</h2>
            <p>Choose a channel from the sidebar to view posts</p>
          </div>
        )}
      </div>
    </div>
  );
}

