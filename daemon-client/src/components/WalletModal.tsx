import { useState } from 'react';
import { useWallet } from '../wallet/WalletProvider';
import axios from 'axios';
import './WalletModal.css';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { address, did, connect, registerDID, isRegistering, isConnected } = useWallet();
  const [username, setUsername] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [hasRegisteredFID, setHasRegisteredFID] = useState(false);

  const PDS_URL = import.meta.env.VITE_PDS_URL || 'http://50.21.187.69:4002';

  if (!isOpen) return null;

  const handleConnect = async () => {
    await connect();
    // Don't close immediately - let user register if needed
  };

  const handleRegisterFID = async () => {
    try {
      await registerDID();
      setHasRegisteredFID(true);
    } catch (error: any) {
      alert(error.message || 'Failed to register Daemon ID');
    }
  };

  const handleCreateAccount = async () => {
    if (!username.trim() || !address || !did) return;

    setIsCreatingAccount(true);
    try {
      const response = await axios.post(`${PDS_URL}/xrpc/com.atproto.server.createAccount`, {
        walletAddress: address,
        handle: username.trim()
      });
      
      alert(`Account created! Username: ${response.data.handle}`);
      onClose();
      // Refresh page to update user state
      window.location.reload();
    } catch (error: any) {
      alert(error.response?.data?.error || error.message || 'Failed to create account');
    } finally {
      setIsCreatingAccount(false);
    }
  };

  return (
    <div className="wallet-modal-overlay" onClick={onClose}>
      <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wallet-modal-header">
          <h2>{isConnected ? 'Wallet Connected' : 'Connect Wallet'}</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        <div className="wallet-modal-content">
          {!isConnected ? (
            <>
              <p>Connect your wallet to use Daemon Social</p>
              <button onClick={handleConnect} className="connect-wallet-btn">
                Connect MetaMask
              </button>
            </>
          ) : !did ? (
            <>
              <p>Your wallet is connected, but you don't have a Daemon ID yet.</p>
              <p className="wallet-address">Address: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
              {!hasRegisteredFID ? (
                <>
                  <button
                    onClick={handleRegisterFID}
                    className="connect-wallet-btn"
                    disabled={isRegistering}
                  >
                    {isRegistering ? 'Registering...' : 'Register Daemon ID'}
                  </button>
                  <p className="wallet-modal-hint">This will register your Daemon ID on-chain</p>
                </>
              ) : (
                <>
                  <p className="wallet-modal-success">✅ Daemon ID registered! Now choose your username:</p>
                  <input
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="wallet-modal-input"
                    disabled={isCreatingAccount}
                  />
                  <button
                    onClick={handleCreateAccount}
                    className="connect-wallet-btn"
                    disabled={!username.trim() || isCreatingAccount}
                  >
                    {isCreatingAccount ? 'Creating Account...' : 'Create Account'}
                  </button>
                  <p className="wallet-modal-hint">This will create your Daemon Social account</p>
                </>
              )}
            </>
          ) : (
            <>
              <p>Wallet connected successfully!</p>
              <p className="wallet-address">Address: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
              <p className="wallet-did">Daemon ID: {did}</p>
              <button onClick={onClose} className="connect-wallet-btn">
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

