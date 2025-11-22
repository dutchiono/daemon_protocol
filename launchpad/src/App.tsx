import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LaunchTokenPage from './components/LaunchTokenModal';
import Dashboard from './pages/Dashboard';
import { useAccount, useWalletClient } from 'wagmi';
import { useState, useEffect } from 'react';
import { Transaction, parseTransaction } from 'viem';

function App() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Create session when wallet connects
  useEffect(() => {
    if (address && isConnected && !sessionToken) {
      createSession();
    }
  }, [address, isConnected]);

  const createSession = async (): Promise<string | null> => {
    if (!address) return null;

    try {
      // Get nonce first
      const nonceResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/auth/nonce`, {
        method: 'POST',
      });

      if (!nonceResponse.ok) {
        throw new Error('Failed to get nonce');
      }

      const { nonce } = await nonceResponse.json();

      // Sign nonce with wallet (for now, just send address - backend trusts wallet connection)
      // TODO: Actually sign the nonce when backend verification is implemented
      const signinResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/auth/web/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          signature: '0x', // Placeholder - backend trusts wallet connection for now
          nonce,
        }),
      });

      if (!signinResponse.ok) {
        const errorText = await signinResponse.text().catch(() => 'Unknown error');
        throw new Error(`Failed to create session: ${errorText}`);
      }

      const { session_token } = await signinResponse.json();
      setSessionToken(session_token);
      return session_token;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  };

  const handleLaunch = async (formData: any) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    if (!walletClient) {
      throw new Error('Wallet client not available');
    }

    try {
      // Ensure we have a session token
      let token = sessionToken;
      if (!token) {
        token = await createSession();
        if (!token) {
          throw new Error('Failed to create session - please try again');
        }
      }

      // Create draft via backend
      const draftResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/factory/draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          fee_share_bps: formData.fee_share_bps,
        }),
      });

      if (!draftResponse.ok) {
        let errorMessage = `Failed to create draft (${draftResponse.status})`;
        try {
          // Clone response so we can read it as both JSON and text if needed
          const clonedResponse = draftResponse.clone();
          const errorData = await clonedResponse.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // If response isn't JSON, try text
          try {
            const errorText = await draftResponse.text();
            if (errorText) errorMessage = errorText;
          } catch {
            // Use default error message
          }
        }
        throw new Error(errorMessage);
      }

      const { unsigned_tx, draft } = await draftResponse.json();

      // Parse the unsigned transaction (it's a serialized ethers hex string)
      // Try to parse it - if it fails, we'll extract fields from draft instead
      let tx;
      try {
        tx = parseTransaction(unsigned_tx as `0x${string}`);
      } catch (e) {
        // If parsing fails, we'll use sendRawTransaction approach
        // For now, extract what we need from the draft
        throw new Error('Failed to parse transaction. Please check backend transaction format.');
      }

      // Sign and send transaction with wallet
      // Note: wagmi's sendTransaction signs and broadcasts automatically
      const hash = await walletClient.sendTransaction({
        to: tx.to!,
        value: tx.value || 0n,
        data: tx.input || '0x',
        gas: tx.gas || undefined,
        gasPrice: tx.gasPrice || undefined,
        nonce: tx.nonce,
      });

      // The transaction is now sent directly to the network
      // We'll notify the backend for tracking
      const signedTx = hash;

      // Deploy the token
      const deployResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/factory/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          draft,
          signed_tx: signedTx,
        }),
      });

      if (!deployResponse.ok) {
        const errorData = await deployResponse.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to deploy token');
      }

      const { job_id, status } = await deployResponse.json();
      console.log('Token deployment started:', { job_id, status });
    } catch (error) {
      console.error('Error launching token:', error);
      throw error;
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LaunchTokenPage onLaunch={handleLaunch} />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
