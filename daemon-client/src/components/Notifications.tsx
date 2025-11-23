import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getNotifications } from '../api/client';
import { useWallet } from '../wallet/WalletProvider';
import './Notifications.css';

interface Notification {
  id: string;
  type: 'like' | 'repost' | 'reply' | 'follow' | 'mention';
  from: {
    did?: string;
    fid?: number;
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
  const { did } = useWallet();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Fetch real notifications from API
  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications', did],
    queryFn: () => getNotifications(did!),
    enabled: !!did,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const notifications: Notification[] = data?.notifications || [];

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const formatTimestamp = (timestamp: number) => {
    // Timestamp is in seconds, convert to milliseconds
    const date = new Date(timestamp * 1000);
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
    const from = notification.from.username || notification.from.did || notification.from.fid || 'someone';
    switch (notification.type) {
      case 'like':
        return `${from} liked your post`;
      case 'repost':
        return `${from} reposted your post`;
      case 'reply':
        return `${from} replied to your post`;
      case 'follow':
        return `${from} started following you`;
      case 'mention':
        return `${from} mentioned you`;
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
        {isLoading ? (
          <div className="notifications-empty">Loading notifications...</div>
        ) : error ? (
          <div className="notifications-empty">Error loading notifications</div>
        ) : filteredNotifications.length === 0 ? (
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

