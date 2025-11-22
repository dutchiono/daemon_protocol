import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProfile } from '../api/client';
import Post from '../components/Post';
import './Profile.css';

export default function Profile() {
  const { fid } = useParams<{ fid: string }>();
  const profileFid = fid ? parseInt(fid) : null;

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', profileFid],
    queryFn: () => getProfile(profileFid!),
    enabled: profileFid !== null
  });

  // TODO: Get user's posts
  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['profile-posts', profileFid],
    queryFn: async () => {
      // Placeholder - would fetch user's posts
      return [];
    },
    enabled: profileFid !== null
  });

  if (profileLoading) {
    return <div className="page-loading">Loading profile...</div>;
  }

  if (!profile) {
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
            {profile.avatar && (
              <img src={profile.avatar} alt="Avatar" className="profile-avatar" />
            )}
          </div>
          <div className="profile-details">
            <h2>{profile.displayName || `@${profile.username || fid}`}</h2>
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}
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

