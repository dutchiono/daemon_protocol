import React, { useState } from 'react';

export default function TokenForm() {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    image: '',
    feeShareBps: 5000, // 50% default
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement token deployment
    console.log('Deploying token:', formData);
  };

  return (
    <form onSubmit={handleSubmit} className="token-form">
      <h2>Token Information</h2>

      <div className="form-group">
        <label>Token Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label>Token Symbol</label>
        <input
          type="text"
          value={formData.symbol}
          onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
          required
          maxLength={10}
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label>Fee Share with Stakers (BPS)</label>
        <input
          type="number"
          value={formData.feeShareBps}
          onChange={(e) => setFormData({ ...formData, feeShareBps: parseInt(e.target.value) })}
          min={0}
          max={10000}
        />
        <p className="help-text">0-10000 basis points (0-100%)</p>
      </div>

      <button type="submit" className="submit-button">
        Deploy Token
      </button>
    </form>
  );
}

