import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useWallet } from '../wallet/WalletProvider';
import { getUnreadNotificationCount, getProfile } from '../api/client';
import { Github, Menu, ChevronLeft } from 'lucide-react';
import './Sidebar.css';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { did } = useWallet();

  // Load collapsed state from localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });

  // Update Layout margin when sidebar state changes
  useEffect(() => {
    const mainContent = document.querySelector('.main-content') as HTMLElement;
    if (mainContent) {
      mainContent.style.marginLeft = isCollapsed ? '80px' : '280px';
    }
  }, [isCollapsed]);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
  };

  const isActive = (path: string) => location.pathname === path;

  // Fetch unread notification count
  const { data: notificationCount = 0 } = useQuery({
    queryKey: ['notificationCount', did],
    queryFn: () => getUnreadNotificationCount(did || ''),
    enabled: !!did,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch user profile for username display
  const { data: userProfile } = useQuery({
    queryKey: ['profile', did],
    queryFn: () => getProfile(did || ''),
    enabled: !!did,
    retry: false
  });

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <img src="/daemon.jpg" alt="Daemon" className="logo-image" />
          {!isCollapsed && <h1>Daemon</h1>}
        </div>
        <button className="sidebar-toggle" onClick={toggleCollapse} title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`nav-item ${isActive('/') ? 'active' : ''}`}
          onClick={() => navigate('/')}
          title="Home"
        >
          <span className="nav-icon">🏠</span>
          {!isCollapsed && <span className="nav-label">Home</span>}
        </button>

        <button
          className={`nav-item ${isActive('/feed') ? 'active' : ''}`}
          onClick={() => navigate('/feed')}
          title="Feed"
        >
          <span className="nav-icon">📰</span>
          {!isCollapsed && <span className="nav-label">Feed</span>}
        </button>

        <button
          className={`nav-item ${isActive('/notifications') ? 'active' : ''}`}
          onClick={() => navigate('/notifications')}
          title="Notifications"
        >
          <span className="nav-icon">🔔</span>
          {!isCollapsed && <span className="nav-label">Notifications</span>}
          {notificationCount > 0 && (
            <span className="nav-badge">{notificationCount > 99 ? '99+' : notificationCount}</span>
          )}
        </button>


        {did && (
          <button
            className={`nav-item ${isActive(`/profile/${did}`) ? 'active' : ''}`}
            onClick={() => navigate(`/profile/${did}`)}
            title="Profile"
          >
            <span className="nav-icon">👤</span>
            {!isCollapsed && <span className="nav-label">Profile</span>}
          </button>
        )}

        <div className="nav-divider"></div>

        <button
          className={`nav-item ${isActive('/sdk') ? 'active' : ''}`}
          onClick={() => navigate('/sdk')}
          title="SDK"
        >
          <span className="nav-icon">📦</span>
          {!isCollapsed && <span className="nav-label">SDK</span>}
        </button>

        <button
          className={`nav-item ${isActive('/launchpad') ? 'active' : ''}`}
          onClick={() => navigate('/launchpad')}
          title="Launchpad"
        >
          <span className="nav-icon">🚀</span>
          {!isCollapsed && <span className="nav-label">Launchpad</span>}
        </button>

        <button
          className={`nav-item ${isActive('/about') ? 'active' : ''}`}
          onClick={() => navigate('/about')}
          title="About"
        >
          <span className="nav-icon">ℹ️</span>
          {!isCollapsed && <span className="nav-label">About</span>}
        </button>

        <a
          href="https://github.com/dutchiono/daemon_protocol"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-item nav-link"
          style={{ textDecoration: 'none', color: 'inherit' }}
          title="GitHub"
        >
          <span className="nav-icon"><Github size={20} /></span>
          {!isCollapsed && <span className="nav-label">GitHub</span>}
        </a>

        <button
          className={`nav-item ${isActive('/settings') ? 'active' : ''}`}
          onClick={() => navigate('/settings')}
          title="Settings"
        >
          <span className="nav-icon">⚙️</span>
          {!isCollapsed && <span className="nav-label">Settings</span>}
        </button>
      </nav>

      {did && (
        <div className="sidebar-footer">
          <div className="user-info">
            {userProfile?.avatar ? (
              <img
                src={userProfile.avatar.startsWith('ipfs://')
                  ? userProfile.avatar.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
                  : userProfile.avatar}
                alt="Avatar"
                className="user-avatar-img"
              />
            ) : (
              <div className="user-avatar">👤</div>
            )}
            {!isCollapsed && (
              <div className="user-details">
                <div className="user-name">DID: {did}</div>
                <div className="user-handle">
                  @{userProfile?.username || userProfile?.displayName || `user${did}`}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
