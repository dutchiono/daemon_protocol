import React, { useState, useEffect } from 'react';
import { useDaemonSDK } from '../hooks/useDaemonSDK';

export default function BuilderRewards() {
  const { getContributorScore, getAvailableRewards } = useDaemonSDK();
  const [score, setScore] = useState<bigint>(0n);
  const [rewards, setRewards] = useState<bigint>(0n);

  useEffect(() => {
    // Get wallet address from provider
    const walletAddress = '0x...'; // TODO: Get from wallet connection

    if (walletAddress) {
      Promise.all([
        getContributorScore(walletAddress),
        getAvailableRewards(walletAddress),
      ]).then(([contributorScore, availableRewards]) => {
        if (contributorScore) setScore(contributorScore);
        if (availableRewards) setRewards(availableRewards);
      });
    }
  }, [getContributorScore, getAvailableRewards]);

  return (
    <div className="builder-rewards">
      <h3>Your Builder Rewards</h3>
      <div className="rewards-stats">
        <div className="stat">
          <label>Active Score</label>
          <p>{score.toString()}</p>
        </div>
        <div className="stat">
          <label>Available Rewards</label>
          <p>{rewards.toString()}</p>
        </div>
      </div>
      <a href="/rewards" className="view-rewards-link">
        View Full Rewards →
      </a>
    </div>
  );
}

