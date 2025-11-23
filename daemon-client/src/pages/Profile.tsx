import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet } from '../wallet/WalletProvider';
import { getProfile, getUserPosts, getUserReplies, getUserReactions, followUser, unfollowUser, getFollows } from '../api/client';
import Post from '../components/Post';
import './Profile.css';

export default function Profile() {
  const { did: urlDid } = useParams<{ did: string }>();
  const { did: currentUserDid } = useWallet();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'likes'>('posts');

  // Use URL did if provided, otherwise use current user's did
  const profileDid = urlDid ? decodeURIComponent(urlDid) : currentUserDid;
  const isOwnProfile = !urlDid && currentUserDid !== null;

  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['profile', profileDid],
    queryFn: () => getProfile(profileDid!),
    enabled: profileDid !== null,
    retry: false
  });

  // Get user's posts (top-level only)
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['profile-posts', profileDid],
    queryFn: () => getUserPosts(profileDid!, 50),
    enabled: profileDid !== null && activeTab === 'posts',
    retry: false
  });

  // Get user's replies
  const { data: repliesData, isLoading: repliesLoading } = useQuery({
    queryKey: ['profile-replies', profileDid],
    queryFn: () => getUserReplies(profileDid!, 50),
    enabled: profileDid !== null && activeTab === 'replies',
    retry: false
  });

  // Get user's likes
  const { data: likesData, isLoading: likesLoading } = useQuery({
    queryKey: ['profile-likes', profileDid],
    queryFn: () => getUserReactions(profileDid!, 'like', 50),
    enabled: profileDid !== null && activeTab === 'likes',
    retry: false
  });

  const posts = postsData?.posts || [];
  const replies = repliesData?.posts || [];
  const likes = likesData?.posts || [];

  const currentPosts = activeTab === 'posts' ? posts : activeTab === 'replies' ? replies : likes;
  const isLoading = activeTab === 'posts' ? postsLoading : activeTab === 'replies' ? repliesLoading : likesLoading;

  // Check if current user is following this profile
  const { data: isFollowing } = useQuery({
    queryKey: ['follow-status', currentUserDid, profileDid],
    queryFn: async () => {
      if (!currentUserDid || !profileDid || isOwnProfile) return false;
      // Check by getting the current user's follows and checking if profileDid is in it
      try {
        const data = await getFollows(currentUserDid);
        return data.follows?.some((f: any) => f.did === profileDid) || false;
      } catch (error) {
        console.error('Error checking follow status:', error);
        return false;
      }
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
              <img
                src={profile.avatar.startsWith('ipfs://')
                  ? profile.avatar.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
                  : profile.avatar}
                alt="Avatar"
                className="profile-avatar"
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const placeholder = target.nextElementSibling as HTMLElement;
                  if (placeholder) placeholder.style.display = 'flex';
                }}
              />
            ) : null}
            {!profile.avatar && (
              <div className="profile-avatar-placeholder">👤</div>
            )}
            {isOwnProfile && (
              <button
                onClick={async () => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        alert('Profile picture must be 5MB or less');
                        return;
                      }
                      try {
                        const { uploadProfilePicture, updateProfile } = await import('../api/client');
                        const ipfsUrl = await uploadProfilePicture(file);
                        await updateProfile(profileDid!, { avatar: ipfsUrl });
                        queryClient.invalidateQueries({ queryKey: ['profile', profileDid] });
                        alert('Profile picture updated!');
                      } catch (error: any) {
                        alert('Failed to upload profile picture: ' + (error.message || 'Unknown error'));
                      }
                    }
                  };
                  input.click();
                }}
                style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#007bff',
                  border: '2px solid #1a1a1a',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  padding: 0
                }}
                title="Upload profile picture"
              >
                📷
              </button>
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
        <button
          className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          Posts
        </button>
        <button
          className={`tab ${activeTab === 'replies' ? 'active' : ''}`}
          onClick={() => setActiveTab('replies')}
        >
          Replies
        </button>
        <button
          className={`tab ${activeTab === 'likes' ? 'active' : ''}`}
          onClick={() => setActiveTab('likes')}
        >
          Likes
        </button>
      </div>

      <div className="profile-posts">
        {isLoading ? (
          <div className="page-loading">Loading {activeTab}...</div>
        ) : !currentPosts || currentPosts.length === 0 ? (
          <div className="page-empty">
            {activeTab === 'posts' && 'No posts yet'}
            {activeTab === 'replies' && 'No replies yet'}
            {activeTab === 'likes' && 'No likes yet'}
          </div>
        ) : (
          currentPosts.map((post: any) => (
            <Post key={post.hash} post={post} />
          ))
        )}
      </div>
    </div>
  );
}

