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
          <h2>Technology</h2>
          <p>
            Daemon is built using:
          </p>
          <ul className="tech-list">
            <li><strong>Base Blockchain</strong> - For identity and on-chain data</li>
            <li><strong>AT Protocol</strong> - For decentralized data storage</li>
            <li><strong>LibP2P</strong> - For peer-to-peer networking</li>
            <li><strong>PostgreSQL</strong> - For data persistence</li>
            <li><strong>React</strong> - For the user interface</li>
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
          <h2>Status</h2>
          <p>
            Daemon is currently in <strong>beta</strong>. Features are being actively developed.
            If you encounter any issues, please report them on GitHub.
          </p>
        </section>
      </div>
    </div>
  );
}

