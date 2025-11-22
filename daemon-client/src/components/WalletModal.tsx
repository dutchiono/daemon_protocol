import { useWallet } from '../wallet/WalletProvider';
import './WalletModal.css';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { address, did, connect, registerDID, isRegistering, isConnected } = useWallet();

  if (!isOpen) return null;

  const handleConnect = async () => {
    await connect();
    // Don't close immediately - let user register if needed
  };

  const handleRegister = async () => {
    await registerDID();
    onClose();
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
              <button
                onClick={handleRegister}
                className="connect-wallet-btn"
                disabled={isRegistering}
              >
                {isRegistering ? 'Registering...' : 'Register Daemon ID'}
              </button>
              <p className="wallet-modal-hint">This will register your Daemon ID on-chain</p>
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

