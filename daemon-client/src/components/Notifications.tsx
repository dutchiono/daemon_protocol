import { useState } from 'react';
import './Notifications.css';

interface Notification {
  id: string;
  type: 'like' | 'repost' | 'reply' | 'follow' | 'mention';
  from: {
    fid: number;
    username?: string;
  };
  post?: {
    hash: string;
    text: string;
  };
  timestamp: number;
  read: boolean;
}

interface NotificationsProps {
  fid: number | null;
}

export default function Notifications({ fid }: NotificationsProps) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Mock notifications - would come from API
  const [notifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'like',
      from: { fid: 123 },
      post: { hash: '0x123', text: 'Check out this post!' },
      timestamp: Date.now() - 3600000,
      read: false
    },
    {
      id: '2',
      type: 'repost',
      from: { fid: 456 },
      post: { hash: '0x456', text: 'Amazing content!' },
      timestamp: Date.now() - 7200000,
      read: false
    },
    {
      id: '3',
      type: 'follow',
      from: { fid: 789 },
      timestamp: Date.now() - 10800000,
      read: true
    }
  ]);

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like': return '♥';
      case 'repost': return '↻';
      case 'reply': return '💬';
      case 'follow': return '➕';
      case 'mention': return '@';
      default: return '🔔';
    }
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case 'like':
        return `@${notification.from.fid} liked your post`;
      case 'repost':
        return `@${notification.from.fid} reposted your post`;
      case 'reply':
        return `@${notification.from.fid} replied to your post`;
      case 'follow':
        return `@${notification.from.fid} started following you`;
      case 'mention':
        return `@${notification.from.fid} mentioned you`;
      default:
        return 'New notification';
    }
  };

  return (
    <div className="notifications">
      <div className="notifications-header">
        <h1>Notifications</h1>
        <div className="notifications-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread
          </button>
        </div>
      </div>

      <div className="notifications-list">
        {filteredNotifications.length === 0 ? (
          <div className="notifications-empty">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <div
              key={notification.id}
              className={`notification-item ${!notification.read ? 'unread' : ''}`}
            >
              <div className="notification-icon">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="notification-content">
                <div className="notification-text">
                  {getNotificationText(notification)}
                </div>
                {notification.post && (
                  <div className="notification-post">
                    {notification.post.text}
                  </div>
                )}
                <div className="notification-time">
                  {formatTimestamp(notification.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

