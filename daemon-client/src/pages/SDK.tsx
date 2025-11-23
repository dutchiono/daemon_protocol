import { useState } from 'react';
import './SDK.css';

export default function SDK() {
  const [activeTab, setActiveTab] = useState<'overview' | 'installation' | 'usage' | 'api'>('overview');

  return (
    <div className="sdk-page">
      <div className="sdk-header">
        <h1>Daemon SDK</h1>
        <p className="sdk-subtitle">TypeScript SDK for interacting with Daemon Protocol</p>
      </div>

      <div className="sdk-tabs">
        <button
          className={`sdk-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`sdk-tab ${activeTab === 'installation' ? 'active' : ''}`}
          onClick={() => setActiveTab('installation')}
        >
          Installation
        </button>
        <button
          className={`sdk-tab ${activeTab === 'usage' ? 'active' : ''}`}
          onClick={() => setActiveTab('usage')}
        >
          Usage
        </button>
        <button
          className={`sdk-tab ${activeTab === 'api' ? 'active' : ''}`}
          onClick={() => setActiveTab('api')}
        >
          API Reference
        </button>
      </div>

      <div className="sdk-content">
        {activeTab === 'overview' && (
          <div className="sdk-section">
            <h2>Overview</h2>
            <p>
              The Daemon SDK provides a TypeScript/JavaScript interface for interacting with
              Daemon Protocol smart contracts and services. It simplifies token deployment,
              pool management, and builder rewards interactions.
            </p>

            <h3>Key Features</h3>
            <ul>
              <li>📦 Token deployment utilities</li>
              <li>🏊 Pool management functions</li>
              <li>💰 Builder rewards integration</li>
              <li>🔧 Hook configuration helpers</li>
              <li>⚡ Full TypeScript support</li>
            </ul>

            <h3>Requirements</h3>
            <ul>
              <li>Node.js 18+</li>
              <li>ethers.js v6</li>
              <li>Web3 wallet (MetaMask, WalletConnect, etc.)</li>
            </ul>
          </div>
        )}

        {activeTab === 'installation' && (
          <div className="sdk-section">
            <h2>Installation</h2>

            <h3>Using npm</h3>
            <pre><code>npm install @daemon/sdk</code></pre>

            <h3>Using yarn</h3>
            <pre><code>yarn add @daemon/sdk</code></pre>

            <h3>Using pnpm</h3>
            <pre><code>pnpm add @daemon/sdk</code></pre>

            <h3>Peer Dependencies</h3>
            <pre><code>npm install ethers@^6.0.0</code></pre>
          </div>
        )}

        {activeTab === 'usage' && (
          <div className="sdk-section">
            <h2>Usage</h2>

            <h3>Initialize SDK</h3>
            <pre><code>{`import { ethers } from 'ethers';
import * as daemon from '@daemon/sdk';

const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');`}</code></pre>

            <h3>Hook Functions</h3>
            <pre><code>{`// Get hook configuration
const config = await daemon.getHookConfig(provider);

// Get pool information
const poolInfo = await daemon.getPoolInfo(provider, poolId);

// Get token admin for pool
const tokenAdmin = await daemon.getPoolTokenAdmin(provider, poolId);`}</code></pre>

            <h3>Builder Rewards</h3>
            <pre><code>{`// Get contributor score
const score = await daemon.getContributorScore(provider, contributorAddress);

// Get available rewards
const rewards = await daemon.getAvailableRewards(provider, contributorAddress);

// Claim rewards
const signer = await provider.getSigner();
const tx = await daemon.claimRewards(signer, contributorAddress);`}</code></pre>

            <h3>Token Deployment</h3>
            <pre><code>{`import { buildDeployTokenTx } from '@daemon/sdk';

const config = {
  tokenConfig: { /* ... */ },
  poolConfig: { /* ... */ },
  lockerConfig: { /* ... */ },
  mevModuleConfig: { /* ... */ },
};

const txRequest = await buildDeployTokenTx(config, factoryAddress, signer);
const tx = await signer.sendTransaction(txRequest);`}</code></pre>
          </div>
        )}

        {activeTab === 'api' && (
          <div className="sdk-section">
            <h2>API Reference</h2>

            <div className="api-item">
              <h3>Hook Functions</h3>
              <ul>
                <li><code>getHookConfig(provider)</code> - Get hook configuration</li>
                <li><code>getPoolInfo(provider, poolId)</code> - Get pool information</li>
                <li><code>getPoolTokenAdmin(provider, poolId)</code> - Get token admin for pool</li>
              </ul>
            </div>

            <div className="api-item">
              <h3>Builder Rewards</h3>
              <ul>
                <li><code>getContributorScore(provider, address)</code> - Get contributor score</li>
                <li><code>getAvailableRewards(provider, address)</code> - Get available rewards</li>
                <li><code>claimRewards(signer, address)</code> - Claim rewards</li>
              </ul>
            </div>

            <div className="api-item">
              <h3>Token Deployment</h3>
              <ul>
                <li><code>buildDeployTokenTx(config, factoryAddress, signer)</code> - Build deployment transaction</li>
              </ul>
            </div>

            <p className="api-note">
              📚 See TypeScript definitions in <code>sdk/src/</code> for complete API documentation.
            </p>
          </div>
        )}
      </div>

      <div className="sdk-footer">
        <p>
          Need help? Check out the{' '}
          <a href="https://github.com/dutchiono/daemon_protocol" target="_blank" rel="noopener noreferrer">
            GitHub repository
          </a>
          {' '}or{' '}
          <a href="/about">contact us</a>.
        </p>
      </div>
    </div>
  );
}

