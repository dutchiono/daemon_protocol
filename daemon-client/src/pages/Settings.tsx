import { useState } from 'react';
import { useWallet } from '../wallet/WalletProvider';
import { Settings as SettingsIcon, Wallet, Bell, Globe } from 'lucide-react';
import './Settings.css';

export default function Settings() {
  const { address, did, connect, disconnect } = useWallet();
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState('dark');

  return (
    <div className="settings-page">
      <div className="page-header">
        <h2>Settings</h2>
      </div>

      <div className="settings-sections">
        <section className="settings-section">
          <div className="section-header">
            <Wallet size={20} />
            <h3>Wallet</h3>
          </div>
          <div className="settings-item">
            <div className="settings-label">
              <span>Connected Wallet</span>
              {address ? (
                <span className="wallet-address">{address}</span>
              ) : (
                <button onClick={connect} className="connect-btn-small">
                  Connect
                </button>
              )}
            </div>
            {did && (
              <div className="settings-label">
                <span>Daemon ID</span>
                <span className="did-value">{did}</span>
              </div>
            )}
            {address && (
              <button onClick={disconnect} className="disconnect-btn-small">
                Disconnect
              </button>
            )}
          </div>
        </section>

        <section className="settings-section">
          <div className="section-header">
            <Bell size={20} />
            <h3>Notifications</h3>
          </div>
          <div className="settings-item">
            <div className="settings-label">
              <span>Enable Notifications</span>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <div className="section-header">
            <Globe size={20} />
            <h3>Appearance</h3>
          </div>
          <div className="settings-item">
            <div className="settings-label">
              <span>Theme</span>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="theme-select"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <div className="section-header">
            <SettingsIcon size={20} />
            <h3>Network</h3>
          </div>
          <div className="settings-item">
            <div className="settings-label">
              <span>Gateway URL</span>
              <input
                type="text"
                defaultValue={import.meta.env.VITE_GATEWAY_URL || 'http://localhost:4003'}
                className="settings-input"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

