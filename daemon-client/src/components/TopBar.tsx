import { useState } from 'react';
import { useWallet } from '../wallet/WalletProvider';
import WalletModal from './WalletModal';
import './TopBar.css';

export default function TopBar() {
  const { address, did, connect, disconnect, isConnected } = useWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);

  return (
    <div className="topbar">
      <div className="topbar-left">
        <img src="/daemon.jpg" alt="Daemon" className="topbar-logo-image" />
        <h1 className="topbar-logo">Daemon</h1>
      </div>
      <div className="topbar-right">
        {isConnected ? (
          <>
            {did && <span className="wallet-did">DID: {did}</span>}
            <span className="wallet-address">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
            {!did && (
              <button onClick={() => setShowWalletModal(true)} className="register-btn">
                Register DID
              </button>
            )}
            <button onClick={disconnect} className="disconnect-btn">
              Disconnect
            </button>
          </>
        ) : (
          <button onClick={() => setShowWalletModal(true)} className="connect-btn">
            Connect Wallet
          </button>
        )}
      </div>
      <WalletModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
    </div>
  );
}

