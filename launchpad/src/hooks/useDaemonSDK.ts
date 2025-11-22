import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import * as builderRewards from '../../../sdk/src/functions/builder-rewards.js';
import * as hook from '../../../sdk/src/functions/hook.js';
import * as token from '../../../sdk/src/functions/token.js';

export function useDaemonSDK() {
  const [provider, setProvider] = useState<ethers.Provider | null>(null);

  useEffect(() => {
    // Initialize provider (in production, get from wallet connection)
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      setProvider(provider);
    }
  }, []);

  const getContributorScore = async (walletAddress: string) => {
    if (!provider) return null;
    return builderRewards.getContributorScore(provider, walletAddress);
  };

  const getAvailableRewards = async (walletAddress: string) => {
    if (!provider) return null;
    return builderRewards.getAvailableRewards(provider, walletAddress);
  };

  const claimRewards = async (walletAddress: string) => {
    if (!provider) return null;
    const signer = await provider.getSigner();
    return builderRewards.claimRewards(signer, walletAddress);
  };

  const getContributorInfo = async (walletAddress: string) => {
    if (!provider) return null;
    return builderRewards.getContributorInfo(provider, walletAddress);
  };

  const getTokenInfo = async (tokenAddress: string) => {
    if (!provider) return null;
    return token.getTokenMetadata(provider, tokenAddress);
  };

  return {
    provider,
    getContributorScore,
    getAvailableRewards,
    claimRewards,
    getContributorInfo,
    getTokenInfo,
  };
}

