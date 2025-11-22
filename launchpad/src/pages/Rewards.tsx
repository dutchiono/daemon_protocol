import React, { useState, useEffect } from 'react';
import { useDaemonSDK } from '../hooks/useDaemonSDK';

export default function Rewards() {
  const { getAvailableRewards, claimRewards } = useDaemonSDK();
  const [availableRewards, setAvailableRewards] = useState<bigint>(0n);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    // Get wallet address from provider
    const walletAddress = '0x...'; // TODO: Get from wallet connection

    if (walletAddress) {
      getAvailableRewards(walletAddress).then((rewards) => {
        if (rewards) {
          setAvailableRewards(rewards);
        }
      });
    }
  }, [getAvailableRewards]);

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const walletAddress = '0x...'; // TODO: Get from wallet connection
      await claimRewards(walletAddress);
      // Refresh rewards
      const rewards = await getAvailableRewards(walletAddress);
      if (rewards) {
        setAvailableRewards(rewards);
      }
    } catch (error) {
      console.error('Error claiming rewards:', error);
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="rewards-page">
      <h1>Builder Rewards</h1>
      <div className="rewards-content">
        <div className="rewards-card">
          <h3>Available Rewards</h3>
          <p className="rewards-amount">{availableRewards.toString()}</p>
          <button
            onClick={handleClaim}
            disabled={claiming || availableRewards === 0n}
            className="claim-button"
          >
            {claiming ? 'Claiming...' : 'Claim Rewards'}
          </button>
        </div>
      </div>
    </div>
  );
}

