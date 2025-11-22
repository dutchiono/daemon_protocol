import { useState } from 'react';
import { useWallet } from '../wallet/WalletProvider';
import './Settings.css';

interface SettingsProps {
  fid: number | null;
}

export default function Settings({ fid }: SettingsProps) {
  const { address, disconnect } = useWallet();
  const [activeTab, setActiveTab] = useState<'account' | 'network' | 'appearance' | 'about'>('account');

  return (
    <div className="settings">
      <div className="settings-header">
        <h1>Settings</h1>
      </div>

      <div className="settings-content">
        <div className="settings-sidebar">
          <button
            className={`settings-nav ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            Account
          </button>
          <button
            className={`settings-nav ${activeTab === 'network' ? 'active' : ''}`}
            onClick={() => setActiveTab('network')}
          >
            Network
          </button>
          <button
            className={`settings-nav ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            Appearance
          </button>
          <button
            className={`settings-nav ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            About
          </button>
        </div>

        <div className="settings-main">
          {activeTab === 'account' && (
            <div className="settings-section">
              <h2>Account</h2>
              <div className="settings-item">
                <label>Wallet Address</label>
                <div className="settings-value">
                  {address || 'Not connected'}
                </div>
              </div>
              <div className="settings-item">
                <label>FID</label>
                <div className="settings-value">
                  {fid || 'Not assigned'}
                </div>
              </div>
              {address && (
                <button className="settings-button danger" onClick={disconnect}>
                  Disconnect Wallet
                </button>
              )}
            </div>
          )}

          {activeTab === 'network' && (
            <div className="settings-section">
              <h2>Network</h2>
              <div className="settings-item">
                <label>Gateway URL</label>
                <input
                  type="text"
                  className="settings-input"
                  defaultValue={import.meta.env.VITE_GATEWAY_URL || 'http://localhost:4003'}
                  placeholder="http://localhost:4003"
                />
              </div>
              <div className="settings-item">
                <label>Hub Endpoint</label>
                <input
                  type="text"
                  className="settings-input"
                  defaultValue="http://localhost:4001"
                  placeholder="http://localhost:4001"
                />
              </div>
              <div className="settings-item">
                <label>PDS Endpoint</label>
                <input
                  type="text"
                  className="settings-input"
                  defaultValue="http://localhost:4002"
                  placeholder="http://localhost:4002"
                />
              </div>
              <button className="settings-button">
                Save Network Settings
              </button>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="settings-section">
              <h2>Appearance</h2>
              <div className="settings-item">
                <label>Theme</label>
                <select className="settings-select">
                  <option>Dark</option>
                  <option>Light</option>
                  <option>Auto</option>
                </select>
              </div>
              <div className="settings-item">
                <label>Font Size</label>
                <select className="settings-select">
                  <option>Small</option>
                  <option>Medium</option>
                  <option>Large</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="settings-section">
              <h2>About</h2>
              <div className="settings-item">
                <label>Version</label>
                <div className="settings-value">1.0.0</div>
              </div>
              <div className="settings-item">
                <label>Daemon Social Network</label>
                <div className="settings-value">
                  Decentralized social network powered by Daemon Protocol
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

