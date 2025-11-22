import React from 'react';
import ReactDOM from 'react-dom/client';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { injected, coinbaseWallet } from 'wagmi/connectors';
import { base } from 'wagmi/chains';
import App from './App';
import './index.css';
import '@rainbow-me/rainbowkit/styles.css';

// Simple wallet connectors that don't require WalletConnect
// These work with MetaMask, Coinbase Wallet, and other injected wallets
const connectors = [
  injected({ target: 'metaMask' }), // MetaMask and other injected wallets
  coinbaseWallet({ appName: 'Daemon' }), // Coinbase Wallet
  injected(), // Generic browser wallet injection
];

const config = createConfig({
  chains: [base],
  connectors,
  transports: {
    [base.id]: http(),
  },
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);

