/**
 * Contributor Dashboard Component
 * Shows personal contribution score, history, and available rewards
 */

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { BuilderRewardSDK } from '../../sdk/builder-rewards.js';

interface ContributorDashboardProps {
  contributorAddress: string;
  provider: ethers.Provider;
  builderRewardDistributor: string;
  contributionRegistry: string;
}

export function ContributorDashboard({
  contributorAddress,
  provider,
  builderRewardDistributor,
  contributionRegistry,
}: ContributorDashboardProps) {
  const [sdk] = useState(() =>
    new BuilderRewardSDK(provider, builderRewardDistributor, contributionRegistry)
  );
  const [score, setScore] = useState<bigint>(BigInt(0));
  const [availableRewards, setAvailableRewards] = useState<bigint>(BigInt(0));
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    loadData();
  }, [contributorAddress]);

  async function loadData() {
    try {
      setLoading(true);
      const [totalScore, rewards, contribHistory] = await Promise.all([
        sdk.getContributorTotalScore(contributorAddress),
        sdk.getAvailableRewards(contributorAddress),
        sdk.getContributionHistory(contributorAddress),
      ]);

      setScore(totalScore);
      setAvailableRewards(rewards);
      setHistory(contribHistory.hashes.map((hash, i) => ({
        hash,
        score: contribHistory.scores[i],
        timestamp: contribHistory.timestamps[i],
      })));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleClaimRewards() {
    if (!window.ethereum) {
      alert('Please install MetaMask');
      return;
    }

    try {
      setClaiming(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const receipt = await sdk.claimRewards(signer);
      alert(`Rewards claimed! Transaction: ${receipt.hash}`);
      await loadData();
    } catch (error) {
      console.error('Error claiming rewards:', error);
      alert('Failed to claim rewards');
    } finally {
      setClaiming(false);
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard">
      <h1>Contributor Dashboard</h1>

      <div className="stats">
        <div className="stat">
          <h2>Total Score</h2>
          <p>{score.toString()}</p>
        </div>

        <div className="stat">
          <h2>Available Rewards</h2>
          <p>{ethers.formatEther(availableRewards)}</p>
        </div>
      </div>

      <div className="actions">
        <button
          onClick={handleClaimRewards}
          disabled={availableRewards === BigInt(0) || claiming}
        >
          {claiming ? 'Claiming...' : 'Claim Rewards'}
        </button>
      </div>

      <div className="history">
        <h2>Contribution History</h2>
        <ul>
          {history.map((contrib, i) => (
            <li key={i}>
              <div>Hash: {contrib.hash}</div>
              <div>Score: {contrib.score.toString()}</div>
              <div>Date: {new Date(Number(contrib.timestamp) * 1000).toLocaleDateString()}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

