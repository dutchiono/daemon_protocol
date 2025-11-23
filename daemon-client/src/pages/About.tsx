import { Github, Code, Users, Zap } from 'lucide-react';
import './About.css';

export default function About() {
  return (
    <div className="about-page">
      <div className="about-header">
        <h1>About Daemon</h1>
        <p className="about-subtitle">A decentralized social network built on Base</p>
      </div>

      <div className="about-content">
        <section className="about-section">
          <h2>What is Daemon?</h2>
          <p>
            Daemon is a decentralized social network that gives you full control over your data and identity.
            Built on Base blockchain, Daemon combines the best of Web3 and social networking.
          </p>
        </section>

        <section className="about-section">
          <h2>Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <Zap className="feature-icon" />
              <h3>Wallet-Based Identity</h3>
              <p>Connect with your Web3 wallet. No email or password required.</p>
            </div>
            <div className="feature-card">
              <Users className="feature-icon" />
              <h3>Decentralized</h3>
              <p>Your data is stored on your Personal Data Server (PDS), not a central server.</p>
            </div>
            <div className="feature-card">
              <Code className="feature-icon" />
              <h3>Open Source</h3>
              <p>Fully open source. View the code, contribute, or run your own node.</p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>Economic Model</h2>
          <p>
            Daemon is building a self-sustaining platform funded entirely by swap fees from Uniswap V4 pools.
            We're combining Fey mechanics with a social media platform and in-app swap functionality to create
            a sustainable ecosystem that covers costs and eventually pays back users when revenue exceeds expenses.
          </p>
          <p>
            The vision is simple: <strong>swap fees fund everything</strong>. When users swap tokens in-app,
            fees are automatically collected and distributed to:
          </p>
          <ul className="tech-list">
            <li><strong>Builder Rewards (5%)</strong> - Automatic rewards for GitHub merged PRs and x402 contributions</li>
            <li><strong>Social Network Fund (3%)</strong> - Pays for storage costs via x402 payments</li>
            <li><strong>Pro Features</strong> - Everyone gets premium features automatically (no subscriptions)</li>
            <li><strong>User Paybacks</strong> - Monthly distributions when platform revenue exceeds operational costs</li>
          </ul>
        </section>

        <section className="about-section">
          <h2>Fee Flow</h2>
          <p>
            Here's how swap fees flow through the system:
          </p>
          <ol className="tech-list" style={{ marginLeft: '1.5rem' }}>
            <li><strong>User swaps tokens</strong> in-app using Uniswap V4 pools</li>
            <li><strong>DaemonHook collects fees</strong> automatically on each swap</li>
            <li><strong>FeeSplitter routes fees</strong>:
              <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                <li>5% → BuilderRewardDistributor (for GitHub contributors)</li>
                <li>3% → SocialNetworkFund (for storage and platform costs)</li>
                <li>92% → Token developers and stakers (remaining after builder/platform cuts)</li>
              </ul>
            </li>
            <li><strong>BuilderRewardDistributor</strong> distributes rewards based on GitHub merged PRs and x402 contributions</li>
            <li><strong>SocialNetworkFund</strong> pays for storage via x402 payments</li>
            <li><strong>Excess revenue</strong> is distributed monthly to users when platform makes more than it needs</li>
          </ol>
          <p style={{ marginTop: '1rem' }}>
            This creates a sustainable model where the platform funds itself through usage, rewards contributors,
            and eventually returns value to users.
          </p>
        </section>

        <section className="about-section">
          <h2>Technology</h2>
          <p>
            Daemon is built using:
          </p>
          <ul className="tech-list">
            <li><strong>Base Blockchain</strong> - For identity and on-chain data</li>
            <li><strong>Uniswap V4</strong> - For in-app token swaps and fee collection</li>
            <li><strong>AT Protocol</strong> - For decentralized data storage</li>
            <li><strong>LibP2P</strong> - For peer-to-peer networking</li>
            <li><strong>PostgreSQL</strong> - For data persistence</li>
            <li><strong>React</strong> - For the user interface</li>
            <li><strong>x402 Protocol</strong> - For API access payments and storage costs</li>
          </ul>
        </section>

        <section className="about-section">
          <h2>Get Involved</h2>
          <p>
            Daemon is open source and we welcome contributions!
          </p>
          <div className="github-link">
            <a
              href="https://github.com/dutchiono/daemon_protocol"
              target="_blank"
              rel="noopener noreferrer"
              className="github-button"
            >
              <Github size={20} />
              <span>View on GitHub</span>
            </a>
          </div>
        </section>

        <section className="about-section">
          <h2>Implementation Readiness</h2>
          <p>
            Here's the current state of the swap fee funding system:
          </p>

          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>✅ Phase 1: Contracts (Complete)</h3>
            <ul className="tech-list" style={{ marginLeft: '1.5rem' }}>
              <li><strong>DaemonHook</strong> - Uniswap V4 hook deployed and collecting fees</li>
              <li><strong>FeeSplitter</strong> - Routes 5% to builders, 3% to social network fund</li>
              <li><strong>BuilderRewardDistributor</strong> - Contract ready to distribute rewards</li>
              <li><strong>SocialNetworkFund</strong> - Contract ready to hold and distribute platform funds</li>
              <li><strong>x402 Middleware</strong> - Payment system implemented for API access</li>
              <li><strong>ContributionRegistry</strong> - Tracks GitHub contributions</li>
            </ul>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>🟡 Phase 2: Fee Collection (In Progress)</h3>
            <ul className="tech-list" style={{ marginLeft: '1.5rem' }}>
              <li>Hook collects fees on swaps ✅</li>
              <li>FeeSplitter routes fees automatically ✅</li>
              <li>Automated collection triggers - Coming soon</li>
              <li>Integration with social network services - In progress</li>
            </ul>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>🟡 Phase 3: Distribution (In Progress)</h3>
            <ul className="tech-list" style={{ marginLeft: '1.5rem' }}>
              <li>BuilderRewardDistributor can distribute rewards ✅</li>
              <li>GitHub PR tracking integration - In progress</li>
              <li>Automated payout scheduling - Coming soon</li>
              <li>x402 payment integration for storage - In progress</li>
            </ul>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>❌ Phase 4: User Features (Coming Soon)</h3>
            <ul className="tech-list" style={{ marginLeft: '1.5rem' }}>
              <li>In-app swap UI - Planned</li>
              <li>Pro features system - Planned</li>
              <li>Monthly payback mechanism - Planned</li>
              <li>Revenue tracking and excess calculation - Planned</li>
            </ul>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>❌ Phase 5: Integration (Coming Soon)</h3>
            <ul className="tech-list" style={{ marginLeft: '1.5rem' }}>
              <li>Connect swap fees to x402 payments - Planned</li>
              <li>Connect social network fund to storage costs - Planned</li>
              <li>Connect builder rewards to GitHub contributions - Planned</li>
              <li>User payback distribution system - Planned</li>
            </ul>
          </div>

          <p style={{ marginTop: '1.5rem' }}>
            Daemon is currently in <strong>beta</strong>. The core contracts are deployed and ready,
            but full integration and user-facing features are still in development. If you encounter
            any issues, please report them on GitHub.
          </p>
        </section>
      </div>
    </div>
  );
}

