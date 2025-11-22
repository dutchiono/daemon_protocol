/**
 * Admin Dashboard Component
 * Shows all contributors, scores, and payout history
 */

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { BuilderRewardSDK } from '../../sdk/builder-rewards.js';

interface AdminDashboardProps {
  provider: ethers.Provider;
  builderRewardDistributor: string;
  contributionRegistry: string;
}

export function AdminDashboard({
  provider,
  builderRewardDistributor,
  contributionRegistry,
}: AdminDashboardProps) {
  const [sdk] = useState(() =>
    new BuilderRewardSDK(provider, builderRewardDistributor, contributionRegistry)
  );
  const [contributors, setContributors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalContributors: 0,
    totalContributions: 0,
    totalRewardsDistributed: '0',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      // TODO: Fetch from API or contract
      // For now, use mock data
      setContributors([]);
      setStats({
        totalContributors: 0,
        totalContributions: 0,
        totalRewardsDistributed: '0',
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>

      <div className="stats">
        <div className="stat">
          <h2>Total Contributors</h2>
          <p>{stats.totalContributors}</p>
        </div>

        <div className="stat">
          <h2>Total Contributions</h2>
          <p>{stats.totalContributions}</p>
        </div>

        <div className="stat">
          <h2>Total Rewards Distributed</h2>
          <p>{stats.totalRewardsDistributed}</p>
        </div>
      </div>

      <div className="contributors">
        <h2>All Contributors</h2>
        <table>
          <thead>
            <tr>
              <th>Address</th>
              <th>Total Score</th>
              <th>Available Rewards</th>
              <th>Contributions</th>
            </tr>
          </thead>
          <tbody>
            {contributors.map((contrib, i) => (
              <tr key={i}>
                <td>{contrib.address}</td>
                <td>{contrib.totalScore.toString()}</td>
                <td>{ethers.formatEther(contrib.availableRewards)}</td>
                <td>{contrib.contributionCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

