import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Link } from 'react-router-dom';
import { getTokensByFid } from '../api/backend';
import type { TokenInfo } from '../api/backend';
import './Dashboard.css';

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For now, we'll need to get FID from somewhere
  // In a real implementation, you'd get this from session/auth
  const [fid] = useState<string | null>(null);

  const _fetchTokens = async (fidToFetch: string) => {
    setLoading(true);
    setError(null);
    try {
      const tokenList = await getTokensByFid(fidToFetch);
      setTokens(tokenList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tokens');
      console.error('Error fetching tokens:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const shortenAddress = (address: string | null) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Daemon Dashboard</h1>
        <div className="header-actions">
          <ConnectButton />
          <Link to="/" className="launch-button">
            Launch New Token
          </Link>
        </div>
      </header>

      <main className="dashboard-main">
        {!isConnected && (
          <div className="info-banner">
            <p>🔗 Connect your wallet to view your deployed tokens</p>
            <p>You can also launch new tokens once connected</p>
          </div>
        )}

        {isConnected && !fid && (
          <div className="info-banner">
            <p>📝 Link your Farcaster account to see tokens deployed via Daemon</p>
            <p>Or use the backend API to fetch tokens by wallet address</p>
          </div>
        )}

        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your tokens...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <p>❌ {error}</p>
          </div>
        )}

        {!loading && !error && tokens.length === 0 && fid && (
          <div className="empty-state">
            <p>📭 No tokens found</p>
            <p>You haven't deployed any tokens yet. Launch your first token!</p>
            <Link to="/" className="launch-button">
              Launch Token
            </Link>
          </div>
        )}

        {!loading && !error && tokens.length > 0 && (
          <div className="tokens-section">
            <h2>Your Tokens ({tokens.length})</h2>
            <div className="tokens-grid">
              {tokens.map((token) => (
                <div key={token.token_address} className="token-card">
                  {token.image && (
                    <div className="token-image">
                      <img src={token.image} alt={token.name || token.symbol || 'Token'} />
                    </div>
                  )}
                  <div className="token-info">
                    <h3 className="token-name">
                      {token.name || 'Unnamed Token'}
                    </h3>
                    <p className="token-symbol">{token.symbol || 'N/A'}</p>
                    <div className="token-details">
                      <div className="detail-row">
                        <span className="detail-label">Address:</span>
                        <span className="detail-value">
                          <a
                            href={`https://basescan.org/token/${token.token_address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="address-link"
                          >
                            {shortenAddress(token.token_address)}
                          </a>
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Owner:</span>
                        <span className="detail-value">
                          {shortenAddress(token.owner_address)}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Created:</span>
                        <span className="detail-value">{formatDate(token.created_at)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Status:</span>
                        <span
                          className={`status-badge ${token.confirmed ? 'confirmed' : 'pending'}`}
                        >
                          {token.confirmed ? '✓ Confirmed' : '⏳ Pending'}
                        </span>
                      </div>
                      {token.context && (
                        <div className="token-context">
                          <p>{token.context}</p>
                        </div>
                      )}
                    </div>
                    <div className="token-actions">
                      <a
                        href={`https://basescan.org/token/${token.token_address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="action-link"
                      >
                        View on Basescan
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
