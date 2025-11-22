import { useQuery } from '@tanstack/react-query';
import { Bell, Heart, Repeat2, MessageCircle, UserPlus } from 'lucide-react';
import './Notifications.css';

export default function Notifications() {
  // TODO: Implement notifications API
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      // Placeholder - would fetch from API
      return [];
    }
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart size={20} />;
      case 'repost': return <Repeat2 size={20} />;
      case 'reply': return <MessageCircle size={20} />;
      case 'follow': return <UserPlus size={20} />;
      default: return <Bell size={20} />;
    }
  };

  if (isLoading) {
    return <div className="page-loading">Loading notifications...</div>;
  }

  return (
    <div className="notifications-page">
      <div className="page-header">
        <h2>Notifications</h2>
      </div>

      {!notifications || notifications.length === 0 ? (
        <div className="page-empty">
          <Bell size={48} className="empty-icon" />
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((notif: any) => (
            <div key={notif.id} className="notification-item">
              <div className="notification-icon">
                {getNotificationIcon(notif.type)}
              </div>
              <div className="notification-content">
                <p>{notif.message}</p>
                <span className="notification-time">{notif.time}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

