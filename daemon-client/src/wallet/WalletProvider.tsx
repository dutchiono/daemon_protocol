import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { getFIDFromAddress, registerFID } from '../contracts/identityRegistry';

interface WalletContextType {
  address: string | null;
  did: string | null; // Daemon DID (full format: did:daemon:${id})
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnected: boolean;
  registerDID: () => Promise<void>;
  isRegistering: boolean;
}

interface WalletProviderProps {
  children: ReactNode;
  onDidChange?: (did: string | null) => void;
}

export const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children, onDidChange }: WalletProviderProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [did, setDid] = useState<string | null>(null); // Daemon DID (full format: did:daemon:${id})
  const [isRegistering, setIsRegistering] = useState(false);

  const loadDID = async (walletAddress: string) => {
    if (!window.ethereum) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const numericId = await getFIDFromAddress(provider, walletAddress); // Contract returns numeric ID
      // Convert numeric ID to full DID format
      const fullDid = numericId ? `did:daemon:${numericId}` : null;
      setDid(fullDid);
      onDidChange?.(fullDid);
    } catch (error) {
      console.error('Error loading Daemon ID:', error);
      setDid(null);
      onDidChange?.(null);
    }
  };

  useEffect(() => {
    // Check if wallet is already connected
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          loadDID(accounts[0]);
        }
      });
    }
  }, []);

  const handleRegisterDID = async () => {
    if (!address || !window.ethereum) return;

    setIsRegistering(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const numericId = await registerFID(signer); // Contract function returns numeric ID
      // Convert numeric ID to full DID format
      const fullDid = numericId ? `did:daemon:${numericId}` : null;
      setDid(fullDid);
      onDidChange?.(fullDid);
    } catch (error: any) {
      console.error('Failed to register Daemon ID:', error);
      if (error.message?.includes('Already registered')) {
        // Try to load existing DID
        await loadDID(address);
      } else {
        alert(error.message || 'Failed to register Daemon ID. Please try again.');
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const connect = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask or another Web3 wallet');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      setAddress(accounts[0]);
      await loadDID(accounts[0]);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect wallet');
    }
  };

  const disconnect = () => {
    setAddress(null);
    setDid(null);
    onDidChange?.(null);
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        did,
        connect,
        disconnect,
        isConnected: address !== null,
        registerDID: handleRegisterDID,
        isRegistering
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

