import { useState } from 'react';
import { useWallet } from '../wallet/WalletProvider';
import './Launchpad.css';

export default function Launchpad() {
  const { did } = useWallet();
  const [activeTab, setActiveTab] = useState<'overview' | 'deploy' | 'dashboard'>('overview');

  return (
    <div className="launchpad-page">
      <div className="launchpad-header">
        <h1>Daemon Launchpad</h1>
        <p className="launchpad-subtitle">Deploy tokens on Daemon Protocol with ease</p>
      </div>

      <div className="launchpad-tabs">
        <button
          className={`launchpad-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`launchpad-tab ${activeTab === 'deploy' ? 'active' : ''}`}
          onClick={() => setActiveTab('deploy')}
        >
          Deploy Token
        </button>
        <button
          className={`launchpad-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
      </div>

      <div className="launchpad-content">
        {activeTab === 'overview' && (
          <div className="launchpad-section">
            <h2>Welcome to Daemon Launchpad</h2>
            <p>
              The Daemon Launchpad is a web UI for deploying tokens on Daemon Protocol.
              Built on Uniswap V4 with automatic builder rewards, it makes token launches
              simple and secure.
            </p>

            <h3>Features</h3>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">🚀</div>
                <h4>Token Deployment</h4>
                <p>Deploy tokens with a simple form interface</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">💰</div>
                <h4>Builder Rewards</h4>
                <p>Automatic rewards for GitHub contributors</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📊</div>
                <h4>Contribution Tracking</h4>
                <p>Track your GitHub contributions linked to your wallet</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🤖</div>
                <h4>AI Chat</h4>
                <p>Get help with deployment using AI assistant</p>
              </div>
            </div>

            <h3>How It Works</h3>
            <ol>
              <li>Connect your wallet</li>
              <li>Link your GitHub account for builder rewards</li>
              <li>Fill out the token deployment form</li>
              <li>Review and deploy your token</li>
              <li>Start earning builder rewards from protocol fees</li>
            </ol>

            {!did && (
              <div className="wallet-prompt">
                <p>🔌 Connect your wallet to get started</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'deploy' && (
          <div className="launchpad-section">
            <h2>Deploy Token</h2>

            {!did ? (
              <div className="wallet-required">
                <p>⚠️ Please connect your wallet to deploy tokens</p>
                <p>The launchpad requires a connected wallet to proceed.</p>
              </div>
            ) : (
              <div className="deploy-info">
                <p>
                  For full token deployment functionality, please visit the dedicated Launchpad app:
                </p>
                <div className="launchpad-link">
                  <a
                    href="/launchpad"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="launchpad-button"
                  >
                    Open Launchpad App →
                  </a>
                </div>
                <p className="launchpad-note">
                  The launchpad app runs on a separate port and provides full token deployment capabilities
                  including forms, builder rewards display, and AI chat integration.
                </p>
              </div>
            )}

            <h3>What You'll Need</h3>
            <ul>
              <li>Token name and symbol</li>
              <li>Token description</li>
              <li>Initial supply and distribution</li>
              <li>Fee share configuration</li>
              <li>Pool parameters</li>
            </ul>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="launchpad-section">
            <h2>Dashboard</h2>

            {!did ? (
              <div className="wallet-required">
                <p>⚠️ Please connect your wallet to view your dashboard</p>
              </div>
            ) : (
              <div className="dashboard-info">
                <p>View your deployed tokens and builder rewards in the Launchpad Dashboard.</p>
                <div className="launchpad-link">
                  <a
                    href="/launchpad/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="launchpad-button"
                  >
                    Open Dashboard →
                  </a>
                </div>

                <h3>Dashboard Features</h3>
                <ul>
                  <li>View all your deployed tokens</li>
                  <li>Track builder rewards</li>
                  <li>Monitor contribution scores</li>
                  <li>View token performance</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="launchpad-footer">
        <p>
          Learn more about the{' '}
          <a href="/sdk">Daemon SDK</a>
          {' '}or check out{' '}
          <a href="https://github.com/dutchiono/daemon_protocol" target="_blank" rel="noopener noreferrer">
            the documentation
          </a>.
        </p>
      </div>
    </div>
  );
}

