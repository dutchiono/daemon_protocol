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
        <p className="launchpad-subtitle">Swap Fees Fund Everything</p>
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
            <h2>Swap Fees Fund Everything</h2>
            <p>
              Daemon is building a self-sustaining social network where swap fees from Uniswap V4 pools
              fund the entire platform. We're combining Fey mechanics with a social media platform and
              in-app swap functionality to create a sustainable ecosystem that covers costs and eventually
              pays back users when revenue exceeds expenses.
            </p>

            <h3>How Fees Fund the Platform</h3>
            <p>
              When users swap tokens in-app, fees are automatically collected and distributed:
            </p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '2rem' }}>
              <li><strong>5% to Builders</strong> - Automatic rewards for GitHub merged PRs and x402 contributions</li>
              <li><strong>3% to Social Network Fund</strong> - Pays for storage costs via x402 payments</li>
              <li><strong>Everyone is Pro</strong> - All users get premium features automatically</li>
              <li><strong>Monthly User Paybacks</strong> - When the platform makes more than it needs, users get paid back</li>
            </ul>

            <h3>What Gets Funded</h3>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">👨‍💻</div>
                <h4>Builder Rewards</h4>
                <p>GitHub merged PRs + x402 contributions automatically rewarded from swap fees</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">💾</div>
                <h4>Storage Costs</h4>
                <p>Storage payments via x402 are covered by the Social Network Fund</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">⭐</div>
                <h4>Pro Features</h4>
                <p>Everyone gets premium features - no subscriptions needed</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">💰</div>
                <h4>User Paybacks</h4>
                <p>Monthly distributions when platform revenue exceeds operational costs</p>
              </div>
            </div>

            <h3>Implementation Status</h3>
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <strong>✅ Contracts Deployed</strong>
                <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                  <li>DaemonHook - Uniswap V4 hook for fee collection</li>
                  <li>FeeSplitter - Routes 5% to builders, 3% to social network fund</li>
                  <li>BuilderRewardDistributor - Distributes rewards to contributors</li>
                  <li>SocialNetworkFund - Holds funds for platform operations</li>
                  <li>x402 Middleware - Payment system for API access and storage</li>
                </ul>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>🟡 Fee Collection (In Progress)</strong>
                <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                  <li>Hook collects fees on swaps</li>
                  <li>FeeSplitter routes fees automatically</li>
                  <li>Automated collection triggers - Coming soon</li>
                  <li>Integration with social network services - In progress</li>
                </ul>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>🟡 Distribution (In Progress)</strong>
                <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                  <li>BuilderRewardDistributor can distribute rewards</li>
                  <li>GitHub PR tracking integration - In progress</li>
                  <li>Automated payout scheduling - Coming soon</li>
                  <li>x402 payment integration for storage - In progress</li>
                </ul>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>❌ User Features (Coming Soon)</strong>
                <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                  <li>In-app swap UI - Planned</li>
                  <li>Pro features system - Planned</li>
                  <li>Monthly payback mechanism - Planned</li>
                  <li>Revenue tracking and excess calculation - Planned</li>
                </ul>
              </div>
            </div>

            <h3>How It Works</h3>
            <ol>
              <li>Users swap tokens in-app using Uniswap V4 pools</li>
              <li>Fees are automatically collected by DaemonHook</li>
              <li>FeeSplitter routes 5% to builders, 3% to social network fund</li>
              <li>Builder rewards distributed based on GitHub contributions</li>
              <li>Social network fund pays for storage via x402</li>
              <li>Excess revenue distributed monthly to users</li>
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

