import { useState, useEffect } from 'react';
import { useWallet } from '../wallet/WalletProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings as SettingsIcon, Wallet, Bell, Globe, User, Edit } from 'lucide-react';
import { getProfile, updateProfile } from '../api/client';
import { ethers } from 'ethers';
import './Settings.css';

export default function Settings() {
  const { address, did, connect, disconnect, isConnected } = useWallet();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState('dark');

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    username: '',
    displayName: '',
    bio: '',
    website: '',
    avatar: '',
    banner: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [needsWalletSign, setNeedsWalletSign] = useState(false);

  // Load current profile
  const { data: currentProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', did],
    queryFn: () => getProfile(did || ''),
    enabled: !!did,
    retry: false
  });

  // Initialize profile data when profile loads
  useEffect(() => {
    if (currentProfile) {
      setProfileData({
        username: currentProfile.username || '',
        displayName: currentProfile.displayName || '',
        bio: currentProfile.bio || '',
        website: currentProfile.website || '',
        avatar: currentProfile.avatar || '',
        banner: currentProfile.banner || ''
      });
    }
  }, [currentProfile]);

  const handleSaveProfile = async () => {
    if (!did || !address || !isConnected) {
      alert('Please connect your wallet first');
      await connect();
      return;
    }

    // Check if username or displayName changed (requires wallet sign)
    const usernameChanged = currentProfile?.username !== profileData.username;
    const displayNameChanged = currentProfile?.displayName !== profileData.displayName;

    if (usernameChanged || displayNameChanged) {
      try {
        // Request wallet signature
        if (!window.ethereum) {
          alert('Please install MetaMask');
          return;
        }

        setNeedsWalletSign(true);

        // Ensure wallet is connected by requesting accounts
        let accounts: string[];
        try {
          accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        } catch (err: any) {
          // If request fails, try to reconnect via wallet provider
          if (err.code === -32603 || err.code === 4001) {
            await connect();
            accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          } else {
            throw err;
          }
        }

        if (!accounts || accounts.length === 0) {
          throw new Error('No accounts found. Please connect your wallet.');
        }

        // Verify the connected account matches
        if (accounts[0].toLowerCase() !== address?.toLowerCase()) {
          // Account changed, update the wallet provider
          await connect();
          throw new Error('Connected account changed. Please try again.');
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        // Verify we can get the address from signer
        const signerAddress = await signer.getAddress();
        if (signerAddress.toLowerCase() !== address?.toLowerCase()) {
          throw new Error('Signer address mismatch');
        }

        // Create message to sign
        const message = `Update profile:\nUsername: ${profileData.username}\nDisplay Name: ${profileData.displayName}\n\nThis will update your profile on Daemon Social.`;
        const signature = await signer.signMessage(message);

        setNeedsWalletSign(false);
      } catch (error: any) {
        setNeedsWalletSign(false);
        if (error.code === 4001) {
          // User rejected the signature request
          return;
        }
        console.error('Wallet signature error:', error);
        alert('Failed to get wallet signature: ' + (error.message || 'Unknown error. Please try again.'));
        return;
      }
    }

    setIsSaving(true);
    try {
      if (!did) {
        throw new Error('Wallet not connected');
      }
      await updateProfile(did, profileData);
      await queryClient.invalidateQueries({ queryKey: ['profile', did] });
      setIsEditingProfile(false);
      alert('Profile updated successfully!');
    } catch (error: any) {
      alert('Failed to update profile: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <h2>Settings</h2>
      </div>

      <div className="settings-sections">
        <section className="settings-section">
          <div className="section-header">
            <User size={20} />
            <h3>Profile</h3>
            {did && !isEditingProfile && (
              <button
                onClick={() => setIsEditingProfile(true)}
                className="edit-profile-btn"
                style={{ marginLeft: 'auto', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
              >
                <Edit size={16} style={{ marginRight: '0.25rem' }} />
                Edit
              </button>
            )}
          </div>
          {profileLoading ? (
            <div className="settings-item">Loading profile...</div>
          ) : !did ? (
            <div className="settings-item">
              <p>Connect your wallet to view and edit your profile.</p>
            </div>
          ) : isEditingProfile ? (
            <div className="settings-item">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Username {needsWalletSign && <span style={{ color: '#ff6b6b' }}>*</span>}
                  </label>
                  <input
                    type="text"
                    value={profileData.username}
                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                    className="settings-input"
                    placeholder="Enter username"
                    disabled={isSaving}
                  />
                  {needsWalletSign && (
                    <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.25rem' }}>
                      Changing username requires wallet signature
                    </p>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Display Name {needsWalletSign && <span style={{ color: '#ff6b6b' }}>*</span>}
                  </label>
                  <input
                    type="text"
                    value={profileData.displayName}
                    onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                    className="settings-input"
                    placeholder="Enter display name"
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Bio
                  </label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    className="settings-input"
                    placeholder="Tell us about yourself"
                    rows={4}
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Website
                  </label>
                  <input
                    type="url"
                    value={profileData.website}
                    onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                    className="settings-input"
                    placeholder="https://example.com"
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Avatar URL
                  </label>
                  <input
                    type="url"
                    value={profileData.avatar}
                    onChange={(e) => setProfileData({ ...profileData, avatar: e.target.value })}
                    className="settings-input"
                    placeholder="https://example.com/avatar.jpg"
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Banner URL
                  </label>
                  <input
                    type="url"
                    value={profileData.banner}
                    onChange={(e) => setProfileData({ ...profileData, banner: e.target.value })}
                    className="settings-input"
                    placeholder="https://example.com/banner.jpg"
                    disabled={isSaving}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button
                    onClick={handleSaveProfile}
                    className="connect-wallet-btn"
                    disabled={isSaving || needsWalletSign}
                    style={{ flex: 1 }}
                  >
                    {isSaving ? 'Saving...' : needsWalletSign ? 'Signing...' : 'Save Profile'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingProfile(false);
                      if (currentProfile) {
                        setProfileData({
                          username: currentProfile.username || '',
                          displayName: currentProfile.displayName || '',
                          bio: currentProfile.bio || '',
                          website: currentProfile.website || '',
                          avatar: currentProfile.avatar || '',
                          banner: currentProfile.banner || ''
                        });
                      }
                    }}
                    className="disconnect-btn-small"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : currentProfile ? (
            <div className="settings-item">
              <div className="settings-label">
                <span>Username</span>
                <span>{currentProfile.username || 'Not set'}</span>
              </div>
              <div className="settings-label">
                <span>Display Name</span>
                <span>{currentProfile.displayName || 'Not set'}</span>
              </div>
              {currentProfile.bio && (
                <div className="settings-label">
                  <span>Bio</span>
                  <span>{currentProfile.bio}</span>
                </div>
              )}
              {currentProfile.website && (
                <div className="settings-label">
                  <span>Website</span>
                  <a href={currentProfile.website} target="_blank" rel="noopener noreferrer">
                    {currentProfile.website}
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="settings-item">
              <p>No profile found. Click Edit to create your profile.</p>
            </div>
          )}
        </section>

        <section className="settings-section">
          <div className="section-header">
            <Wallet size={20} />
            <h3>Wallet</h3>
          </div>
          <div className="settings-item">
            <div className="settings-label">
              <span>Connected Wallet</span>
              {address ? (
                <span className="wallet-address">{address}</span>
              ) : (
                <button onClick={connect} className="connect-btn-small">
                  Connect
                </button>
              )}
            </div>
            {did && (
              <div className="settings-label">
                <span>Daemon ID</span>
                <span className="did-value">{did}</span>
              </div>
            )}
            {address && (
              <button onClick={disconnect} className="disconnect-btn-small">
                Disconnect
              </button>
            )}
          </div>
        </section>

        <section className="settings-section">
          <div className="section-header">
            <Bell size={20} />
            <h3>Notifications</h3>
          </div>
          <div className="settings-item">
            <div className="settings-label">
              <span>Enable Notifications</span>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <div className="section-header">
            <Globe size={20} />
            <h3>Appearance</h3>
          </div>
          <div className="settings-item">
            <div className="settings-label">
              <span>Theme</span>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="theme-select"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <div className="section-header">
            <SettingsIcon size={20} />
            <h3>Network</h3>
          </div>
          <div className="settings-item">
            <div className="settings-label">
              <span>Gateway URL</span>
              <input
                type="text"
                defaultValue={import.meta.env.VITE_GATEWAY_URL || 'http://localhost:4003'}
                className="settings-input"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

