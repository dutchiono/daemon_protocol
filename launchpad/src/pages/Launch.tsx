import React from 'react';
import TokenForm from '../components/TokenForm';
import BuilderRewards from '../components/BuilderRewards';
import ContributionTracker from '../components/ContributionTracker';

export default function Launch() {
  return (
    <div className="launch-page">
      <h1>Launch Token on Daemon Protocol</h1>
      <div className="launch-content">
        <div className="launch-form">
          <TokenForm />
        </div>
        <div className="launch-sidebar">
          <BuilderRewards />
          <ContributionTracker />
        </div>
      </div>
    </div>
  );
}

