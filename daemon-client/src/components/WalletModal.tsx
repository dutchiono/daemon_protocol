import { useState, useEffect } from 'react';
import { useWallet } from '../wallet/WalletProvider';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { getProfile } from '../api/client';
import './WalletModal.css';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { address, did, connect, registerDID, isRegistering, isConnected } = useWallet();
  const [username, setUsername] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [fidJustRegistered, setFidJustRegistered] = useState(false);

  // Normalize PDS URL - remove trailing /xrpc if present (Nginx proxies /xrpc/ to PDS)
  const PDS_BASE = import.meta.env.VITE_PDS_URL || 'http://50.21.187.69:4002';
  const PDS_URL = PDS_BASE.replace(/\/xrpc\/?$/, '');
  const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:4003';

  // Check if user has a profile/username
  const { data: existingProfile, isLoading: checkingProfile } = useQuery({
    queryKey: ['profile', did],
    queryFn: () => getProfile(did!),
    enabled: !!did && isOpen,
    retry: false
  });

  const hasProfile = !!existingProfile && existingProfile.username && existingProfile.username !== `fid-${did}`;
  const needsUsername = did && !hasProfile && !checkingProfile;

  // Check if PDS account exists by trying to get profile from PDS
  const [checkingPDSAccount, setCheckingPDSAccount] = useState(false);
  const [needsPDSAccount, setNeedsPDSAccount] = useState(false);

  useEffect(() => {
    const checkPDSAccount = async () => {
      if (!did || !hasProfile || !address) return;

      setCheckingPDSAccount(true);
      try {
        // Try to get profile from PDS - if it fails, we need to create PDS account
        const response = await axios.get(`${PDS_URL}/xrpc/com.atproto.repo.getProfile`, {
          params: { did: `did:daemon:${did}` }
        });
        setNeedsPDSAccount(false);
      } catch (error: any) {
        // If 404 or error, PDS account doesn't exist
        if (error.response?.status === 404 || error.response?.status >= 400) {
          setNeedsPDSAccount(true);
        }
      } finally {
        setCheckingPDSAccount(false);
      }
    };

    if (hasProfile && did && address) {
      checkPDSAccount();
    }
  }, [hasProfile, did, address, PDS_URL]);

  // Reset username input when modal opens or when did changes
  useEffect(() => {
    if (isOpen && did) {
      setUsername('');
      setFidJustRegistered(false);
    }
  }, [isOpen, did]);

  if (!isOpen) return null;

  const handleConnect = async () => {
    await connect();
    // Don't close immediately - let user register if needed
  };

  const handleRegisterFID = async () => {
    try {
      await registerDID();
      setFidJustRegistered(true);
    } catch (error: any) {
      alert(error.message || 'Failed to register Daemon ID');
    }
  };

  const handleCreateAccount = async () => {
    if (!address || !did) return;

    // Use existing username if available, otherwise use input
    const handleToUse = existingProfile?.username || username.trim();
    if (!handleToUse) {
      alert('Please enter a username');
      return;
    }

    setIsCreatingAccount(true);
    try {
      const response = await axios.post(`${PDS_URL}/xrpc/com.atproto.server.createAccount`, {
        walletAddress: address,
        handle: handleToUse
      });

      alert(`PDS account created! Username: ${response.data.handle}`);
      setNeedsPDSAccount(false);
      onClose();
      // Refresh page to update user state
      window.location.reload();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to create account';
      alert(errorMsg);
      // If account already exists, that's okay
      if (errorMsg.includes('already') || errorMsg.includes('taken')) {
        setNeedsPDSAccount(false);
      }
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
              {!fidJustRegistered ? (
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
                  <div style={{ marginTop: '1rem', width: '100%' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      Username
                    </label>
                    <input
                      type="text"
                      placeholder="Enter username (e.g., alice, bob123)"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="wallet-modal-input"
                      disabled={isCreatingAccount}
                      style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && username.trim() && !isCreatingAccount) {
                          handleCreateAccount();
                        }
                      }}
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={handleCreateAccount}
                    className="connect-wallet-btn"
                    disabled={!username.trim() || isCreatingAccount}
                    style={{ marginTop: '1rem', width: '100%' }}
                  >
                    {isCreatingAccount ? 'Creating Account...' : 'Create Account'}
                  </button>
                  <p className="wallet-modal-hint">This will create your Daemon Social account with your username</p>
                </>
              )}
            </>
          ) : needsUsername ? (
            <>
              <p className="wallet-modal-success">✅ Daemon ID: {did}</p>
              <p>You need to set a username to complete your profile.</p>
              <div style={{ marginTop: '1rem', width: '100%' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Choose Your Username
                </label>
                <input
                  type="text"
                  placeholder="Enter username (e.g., alice, bob123)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="wallet-modal-input"
                  disabled={isCreatingAccount}
                  style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && username.trim() && !isCreatingAccount) {
                      handleCreateAccount();
                    }
                  }}
                  autoFocus
                />
              </div>
              <button
                onClick={handleCreateAccount}
                className="connect-wallet-btn"
                disabled={!username.trim() || isCreatingAccount}
                style={{ marginTop: '1rem', width: '100%' }}
              >
                {isCreatingAccount ? 'Setting Username...' : 'Set Username'}
              </button>
              <p className="wallet-modal-hint">This will create your Daemon Social account with your username</p>
            </>
          ) : needsPDSAccount ? (
            <>
              <p className="wallet-modal-warning">⚠️ Account Setup Incomplete</p>
              <p>You have a Gateway profile but need to create your PDS account to post.</p>
              <p className="wallet-did">Daemon ID: {did}</p>
              {existingProfile?.username && (
                <p className="wallet-did">Username: @{existingProfile.username}</p>
              )}
              <button
                onClick={handleCreateAccount}
                className="connect-wallet-btn"
                disabled={isCreatingAccount || checkingPDSAccount}
                style={{ marginTop: '1rem', width: '100%' }}
              >
                {isCreatingAccount ? 'Creating PDS Account...' : 'Complete Account Setup'}
              </button>
              <p className="wallet-modal-hint">This will create your PDS account with username: @{existingProfile?.username || 'your-username'}</p>
            </>
          ) : (
            <>
              <p>Wallet connected successfully!</p>
              <p className="wallet-address">Address: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
              <p className="wallet-did">Daemon ID: {did}</p>
              {existingProfile?.username && (
                <p className="wallet-did">Username: @{existingProfile.username}</p>
              )}
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

