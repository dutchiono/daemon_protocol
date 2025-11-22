import { useState, useEffect } from 'react';
import './SocialContributorDashboard.css';

interface Contributor {
  author: string;
  contributions: number;
  totalAdditions: number;
  totalDeletions: number;
  types: Record<string, number>;
}

interface Contribution {
  prNumber: number;
  prUrl: string;
  author: string;
  title: string;
  contributionType: string;
  filesChanged: number;
  additions: number;
  deletions: number;
  timestamp: number;
}

export default function SocialContributorDashboard() {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContributor, setSelectedContributor] = useState<string | null>(null);

  useEffect(() => {
    fetchContributors();
    fetchContributions();
  }, []);

  const fetchContributors = async () => {
    try {
      const response = await fetch('/api/v1/social/contributors');
      const data = await response.json();
      setContributors(data.contributors || []);
    } catch (error) {
      console.error('Failed to fetch contributors:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContributions = async () => {
    try {
      const response = await fetch('/api/v1/social/contributors/contributions');
      const data = await response.json();
      setContributions(data.contributions || []);
    } catch (error) {
      console.error('Failed to fetch contributions:', error);
    }
  };

  const filteredContributions = selectedContributor
    ? contributions.filter(c => c.author === selectedContributor)
    : contributions;

  if (loading) {
    return <div className="dashboard-loading">Loading contributors...</div>;
  }

  return (
    <div className="social-contributor-dashboard">
      <h1>Social Network Contributors</h1>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Contributors</h3>
          <p>{contributors.length}</p>
        </div>
        <div className="stat-card">
          <h3>Total Contributions</h3>
          <p>{contributions.length}</p>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="contributors-list">
          <h2>Contributors</h2>
          <div className="contributors-grid">
            {contributors.map(contributor => (
              <div
                key={contributor.author}
                className={`contributor-card ${selectedContributor === contributor.author ? 'selected' : ''}`}
                onClick={() => setSelectedContributor(
                  selectedContributor === contributor.author ? null : contributor.author
                )}
              >
                <h3>{contributor.author}</h3>
                <p className="contributor-stats">
                  {contributor.contributions} contributions
                </p>
                <p className="contributor-changes">
                  +{contributor.totalAdditions} / -{contributor.totalDeletions}
                </p>
                <div className="contributor-types">
                  {Object.entries(contributor.types).map(([type, count]) => (
                    <span key={type} className="type-badge">{type}: {count}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="contributions-list">
          <h2>
            {selectedContributor ? `Contributions by ${selectedContributor}` : 'All Contributions'}
          </h2>
          <div className="contributions-table">
            <table>
              <thead>
                <tr>
                  <th>PR</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Changes</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredContributions.map(contrib => (
                  <tr key={contrib.prNumber}>
                    <td>
                      <a href={contrib.prUrl} target="_blank" rel="noopener noreferrer">
                        #{contrib.prNumber}
                      </a>
                    </td>
                    <td>{contrib.title}</td>
                    <td>
                      <span className={`type-badge ${contrib.contributionType}`}>
                        {contrib.contributionType}
                      </span>
                    </td>
                    <td>
                      +{contrib.additions} / -{contrib.deletions}
                      <br />
                      <small>{contrib.filesChanged} files</small>
                    </td>
                    <td>{new Date(contrib.timestamp).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

