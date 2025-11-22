import React, { useState, useEffect } from 'react';

export default function ContributionTracker() {
  const [contributions, setContributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch contributions from API or contract
    // For now, show placeholder
    setLoading(false);
  }, []);

  return (
    <div className="contribution-tracker">
      <h3>GitHub Contributions</h3>
      {loading ? (
        <p>Loading contributions...</p>
      ) : contributions.length === 0 ? (
        <div className="empty-state">
          <p>No contributions yet</p>
          <p className="help-text">
            Link your GitHub account to start tracking contributions
          </p>
        </div>
      ) : (
        <div className="contributions-list">
          {contributions.map((contribution, index) => (
            <div key={index} className="contribution-item">
              <a href={contribution.prUrl} target="_blank" rel="noopener noreferrer">
                {contribution.prUrl}
              </a>
              <span className="score">+{contribution.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

