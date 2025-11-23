import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useWallet } from '../wallet/WalletProvider';
import { getUnreadNotificationCount, getProfile } from '../api/client';
import { Github } from 'lucide-react';
import './Sidebar.css';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { did } = useWallet();

  const isActive = (path: string) => location.pathname === path;

  // Fetch unread notification count
  const { data: notificationCount = 0 } = useQuery({
    queryKey: ['notificationCount', did],
    queryFn: () => getUnreadNotificationCount(did ? `did:daemon:${did}` : ''),
    enabled: did !== null,
    enabled: !!did,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch user profile for username display
  const { data: userProfile } = useQuery({
    queryKey: ['profile', did],
    queryFn: () => getProfile(did ? `did:daemon:${did}` : ''),
    enabled: did !== null,
    enabled: !!did,
    retry: false
  });

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <img src="/daemon.jpg" alt="Daemon" className="logo-image" />
          <h1>Daemon</h1>
        </div>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`nav-item ${isActive('/') ? 'active' : ''}`}
          onClick={() => navigate('/')}
        >
          <span className="nav-icon">🏠</span>
          <span className="nav-label">Home</span>
        </button>

        <button
          className={`nav-item ${isActive('/feed') ? 'active' : ''}`}
          onClick={() => navigate('/feed')}
        >
          <span className="nav-icon">📰</span>
          <span className="nav-label">Feed</span>
        </button>

        <button
          className={`nav-item ${isActive('/notifications') ? 'active' : ''}`}
          onClick={() => navigate('/notifications')}
        >
          <span className="nav-icon">🔔</span>
          <span className="nav-label">Notifications</span>
          {notificationCount > 0 && (
            <span className="nav-badge">{notificationCount > 99 ? '99+' : notificationCount}</span>
          )}
        </button>

        <button
          className={`nav-item ${isActive('/channels') ? 'active' : ''}`}
          onClick={() => navigate('/channels')}
        >
          <span className="nav-icon">💬</span>
          <span className="nav-label">Channels</span>
        </button>

        <button
          className={`nav-item ${isActive('/compose') ? 'active' : ''}`}
          onClick={() => navigate('/compose')}
        >
          <span className="nav-icon">✍️</span>
          <span className="nav-label">Compose</span>
        </button>

        {did && (
          <button
            className={`nav-item ${isActive(`/profile/${did}`) ? 'active' : ''}`}
            onClick={() => navigate(`/profile/${did}`)}
          >
            <span className="nav-icon">👤</span>
            <span className="nav-label">Profile</span>
          </button>
        )}

        <div className="nav-divider"></div>

        <button
          className={`nav-item ${isActive('/about') ? 'active' : ''}`}
          onClick={() => navigate('/about')}
        >
          <span className="nav-icon">ℹ️</span>
          <span className="nav-label">About</span>
        </button>

        <a
          href="https://github.com/dutchiono/daemon_protocol"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-item nav-link"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <span className="nav-icon"><Github size={20} /></span>
          <span className="nav-label">GitHub</span>
        </a>

        <button
          className={`nav-item ${isActive('/settings') ? 'active' : ''}`}
          onClick={() => navigate('/settings')}
        >
          <span className="nav-icon">⚙️</span>
          <span className="nav-label">Settings</span>
        </button>
      </nav>

      {did && (
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">👤</div>
            <div className="user-details">
              <div className="user-name">DID: {did}</div>
              <div className="user-handle">
                @{userProfile?.username || userProfile?.displayName || `user${did}`}
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
