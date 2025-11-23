import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet } from '../wallet/WalletProvider';
import { getProfile, getUserPosts, followUser, unfollowUser } from '../api/client';
import Post from '../components/Post';
import './Profile.css';

export default function Profile() {
  const { did: urlDid } = useParams<{ did: string }>();
  const { did: currentUserDid } = useWallet();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Use URL did if provided, otherwise use current user's did
  const profileDid = urlDid ? decodeURIComponent(urlDid) : currentUserDid;
  const isOwnProfile = !urlDid && currentUserDid !== null;

  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['profile', profileDid],
    queryFn: () => getProfile(profileDid!),
    enabled: profileDid !== null,
    retry: false
  });

  // Get user's posts
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['profile-posts', profileDid],
    queryFn: () => getUserPosts(profileDid!, 50),
    enabled: profileDid !== null,
    retry: false
  });

  const posts = postsData?.posts || [];

  // Check if current user is following this profile
  const { data: isFollowing } = useQuery({
    queryKey: ['follow-status', currentUserDid, profileDid],
    queryFn: async () => {
      if (!currentUserDid || !profileDid || isOwnProfile) return false;
      // For now, we'll check by getting the current user's follows and checking if profileDid is in it
      // This is a simple implementation - in production you'd want a dedicated endpoint
      try {
        const response = await fetch(`${import.meta.env.VITE_GATEWAY_URL || 'http://localhost:4003'}/api/v1/profile/${encodeURIComponent(currentUserDid)}/follows`);
        if (response.ok) {
          const data = await response.json();
          return data.follows?.some((f: any) => f.did === profileDid) || false;
        }
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
      return false;
    },
    enabled: !!currentUserDid && !!profileDid && !isOwnProfile,
    retry: false
  });

  const followMutation = useMutation({
    mutationFn: () => followUser(currentUserDid!, profileDid!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-status', currentUserDid, profileDid] });
      queryClient.invalidateQueries({ queryKey: ['feed', currentUserDid] });
    }
  });

  const unfollowMutation = useMutation({
    mutationFn: () => unfollowUser(currentUserDid!, profileDid!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-status', currentUserDid, profileDid] });
      queryClient.invalidateQueries({ queryKey: ['feed', currentUserDid] });
    }
  });

  const handleFollow = () => {
    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  if (profileLoading) {
    return <div className="page-loading">Loading profile...</div>;
  }

  if (profileError || !profile) {
    if (isOwnProfile) {
      return (
        <div className="profile-page">
          <div className="page-error" style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>Profile Not Set Up</h2>
            <p>You haven't created your profile yet. Go to Settings to set up your profile.</p>
            <button
              onClick={() => navigate('/settings')}
              style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', cursor: 'pointer' }}
            >
              Go to Settings
            </button>
          </div>
        </div>
      );
    }
    return <div className="page-error">Profile not found</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-header-section">
        {profile.banner && (
          <img src={profile.banner} alt="Banner" className="profile-banner" />
        )}
        <div className="profile-info">
          <div className="profile-avatar-section">
            {profile.avatar ? (
              <img src={profile.avatar} alt="Avatar" className="profile-avatar" />
            ) : (
              <div className="profile-avatar-placeholder">👤</div>
            )}
          </div>
          <div className="profile-details">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <h2>{profile.displayName || `@${profile.username || profileDid}`}</h2>
              {isOwnProfile ? (
                <button
                  onClick={() => navigate('/settings')}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', cursor: 'pointer' }}
                >
                  Edit Profile
                </button>
              ) : currentUserDid && (
                <button
                  onClick={handleFollow}
                  disabled={followMutation.isPending || unfollowMutation.isPending}
                  style={{
                    padding: '0.5rem 1.5rem',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    backgroundColor: isFollowing ? '#333' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: 'bold'
                  }}
                >
                  {followMutation.isPending || unfollowMutation.isPending
                    ? '...'
                    : isFollowing
                    ? 'Following'
                    : 'Follow'}
                </button>
              )}
            </div>
            {profile.bio ? (
              <p className="profile-bio">{profile.bio}</p>
            ) : isOwnProfile ? (
              <p className="profile-bio" style={{ color: '#888', fontStyle: 'italic' }}>
                No bio yet. Add one in Settings.
              </p>
            ) : null}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="profile-website">
                {profile.website}
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="profile-tabs">
        <button className="tab active">Posts</button>
        <button className="tab">Replies</button>
        <button className="tab">Likes</button>
      </div>

      <div className="profile-posts">
        {postsLoading ? (
          <div className="page-loading">Loading posts...</div>
        ) : !posts || posts.length === 0 ? (
          <div className="page-empty">No posts yet</div>
        ) : (
          posts.map((post: any) => (
            <Post key={post.hash} post={post} />
          ))
        )}
      </div>
    </div>
  );
}

