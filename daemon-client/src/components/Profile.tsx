import { useQuery } from '@tanstack/react-query';
import { getProfile } from '../api/client';
import './Profile.css';

interface ProfileProps {
  fid: number;
}

export default function Profile({ fid }: ProfileProps) {
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', fid],
    queryFn: () => getProfile(fid)
  });

  if (isLoading) {
    return <div className="profile-loading">Loading profile...</div>;
  }

  if (error || !profile) {
    return <div className="profile-error">Error loading profile</div>;
  }

  return (
    <div className="profile">
      <div className="profile-header">
        {profile.banner && (
          <img src={profile.banner} alt="Banner" className="profile-banner" />
        )}
        <div className="profile-avatar-section">
          {profile.avatar && (
            <img src={profile.avatar} alt="Avatar" className="profile-avatar" />
          )}
        </div>
      </div>
      <div className="profile-content">
        <h2>{profile.displayName || `@${profile.username || fid}`}</h2>
        {profile.bio && <p className="profile-bio">{profile.bio}</p>}
        {profile.website && (
          <a href={profile.website} target="_blank" rel="noopener noreferrer">
            {profile.website}
          </a>
        )}
      </div>
    </div>
  );
}

