import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';

interface WalletContextType {
  address: string | null;
  fid: number | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnected: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
  onFidChange?: (fid: number | null) => void;
}

export function WalletProvider({ children, onFidChange }: WalletProviderProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [fid, setFid] = useState<number | null>(null);

  useEffect(() => {
    // Check if wallet is already connected
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          // TODO: Get FID from address
        }
      });
    }
  }, []);

  const connect = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      setAddress(accounts[0]);

      // TODO: Get FID from identity registry contract
      // For now, use a placeholder
      const placeholderFid = 1;
      setFid(placeholderFid);
      onFidChange?.(placeholderFid);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const disconnect = () => {
    setAddress(null);
    setFid(null);
    onFidChange?.(null);
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        fid,
        connect,
        disconnect,
        isConnected: address !== null
      }}
    >
      {children}
      {!address && (
        <div className="wallet-connect-prompt">
          <button onClick={connect}>Connect Wallet</button>
        </div>
      )}
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

