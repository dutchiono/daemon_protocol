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

  const loadDID = async (walletAddress: string, retryCount = 0) => {
    // Check for wallet availability - support both ethereum and phantom
    const hasEthereum = typeof window !== 'undefined' && (window.ethereum || (window as any).phantom?.ethereum);
    if (!hasEthereum) {
      console.warn('No Ethereum wallet detected. Phantom wallet on mobile may require different connection method.');
      // Still try Gateway API lookup even without ethereum provider
    }

    try {
      // First try to get DID from on-chain contract (if ethereum provider available)
      if (hasEthereum) {
        try {
          const ethereumProvider = window.ethereum || (window as any).phantom?.ethereum;
          const provider = new ethers.BrowserProvider(ethereumProvider);
          const numericId = await getFIDFromAddress(provider, walletAddress); // Contract returns numeric ID

          if (numericId && numericId > 0) {
            // Convert numeric ID to full DID format
            const fullDid = `did:daemon:${numericId}`;
            setDid(fullDid);
            onDidChange?.(fullDid);
            return;
          }
        } catch (contractError) {
          console.warn('Contract lookup failed, trying Gateway API:', contractError);
          // Continue to Gateway API fallback
        }
      }

      // Fallback: Try to get DID from Gateway API (in case contract call failed but user exists)
      // This is especially important for mobile wallets where contract calls might fail
      try {
        const gatewayUrl = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:4003';
        const response = await fetch(`${gatewayUrl}/api/v1/wallet/${walletAddress}/did`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.did) {
            console.log('DID found via Gateway API:', data.did);
            setDid(data.did);
            onDidChange?.(data.did);
            return;
          }
        } else if (response.status === 404) {
          // User doesn't have a DID yet - this is expected for new users
          console.log('No DID found for wallet address. User needs to register.');
          setDid(null);
          onDidChange?.(null);
          return;
        }
      } catch (apiError) {
        console.warn('Gateway API lookup failed:', apiError);
        // Retry once if this is the first attempt
        if (retryCount === 0) {
          console.log('Retrying Gateway API lookup...');
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          return loadDID(walletAddress, 1);
        }
      }

      // No DID found after all attempts
      setDid(null);
      onDidChange?.(null);
    } catch (error) {
      console.error('Error loading Daemon ID:', error);

      // Try Gateway API as fallback even on error (one more time)
      if (retryCount === 0) {
        try {
          const gatewayUrl = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:4003';
          const response = await fetch(`${gatewayUrl}/api/v1/wallet/${walletAddress}/did`);
          if (response.ok) {
            const data = await response.json();
            if (data.did) {
              setDid(data.did);
              onDidChange?.(data.did);
              return;
            }
          }
        } catch (apiError) {
          console.warn('Gateway API fallback also failed:', apiError);
        }
      }

      setDid(null);
      onDidChange?.(null);
    }
  };

  useEffect(() => {
    // Check if wallet is already connected
    // Support both standard ethereum and phantom wallet
    const ethereumProvider = window.ethereum || (window as any).phantom?.ethereum;
    if (ethereumProvider) {
      ethereumProvider.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          loadDID(accounts[0]);
        }
      }).catch((error: any) => {
        console.warn('Error checking existing wallet connection:', error);
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
    // Check for wallet availability - support both ethereum and phantom
    const ethereumProvider = window.ethereum || (window as any).phantom?.ethereum;

    if (!ethereumProvider) {
      alert('Please install MetaMask, Phantom, or another Web3 wallet. On mobile, make sure your wallet app is installed and try again.');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(ethereumProvider);
      const accounts = await provider.send('eth_requestAccounts', []);

      if (!accounts || accounts.length === 0) {
        alert('No accounts found. Please unlock your wallet and try again.');
        return;
      }

      setAddress(accounts[0]);
      await loadDID(accounts[0]);
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);

      // Provide more specific error messages
      if (error.code === 4001) {
        alert('Wallet connection rejected. Please approve the connection request in your wallet.');
      } else if (error.code === -32002) {
        alert('Connection request already pending. Please check your wallet.');
      } else if (error.message?.includes('mobile') || error.message?.includes('Phantom')) {
        alert('Mobile wallet connection issue. Please ensure your wallet app is open and try again.');
      } else {
        alert(`Failed to connect wallet: ${error.message || 'Unknown error'}`);
      }
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
    phantom?: {
      ethereum?: any;
    };
  }
}

