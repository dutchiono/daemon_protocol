import axios from 'axios';

// Auto-detect URL from current page (HTTPS in production, HTTP in dev)
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const host = window.location.host;

    // If on production domain, use same protocol and host
    if (host.includes('daemon.bushleague.xyz') || host.includes('bushleague.xyz')) {
      return `${protocol}//${host}`;
    }
  }

  // Fallback to env var or localhost for dev
  return import.meta.env.VITE_GATEWAY_URL || 'http://localhost:4003';
};

const BASE_URL = getBaseUrl();
const API_URL = BASE_URL.replace(/\/api\/?$/, '');

// Simplified client - no x402 for now (can add later)
export async function getFeed(
  did?: string | null,
  type: string = 'algorithmic',
  limit: number = 50,
  cursor?: string
) {
  try {
    const params: any = { type, limit };
    if (did) params.did = did;
    if (cursor) params.cursor = cursor;

    const response = await axios.get(`${API_URL}/api/v1/feed`, {
      params,
      timeout: 10000 // 10 second timeout
    });
    return response.data;
  } catch (error: any) {
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || error.message?.includes('timeout')) {
      console.error('Network error: Could not connect to server. Please check if the server is running.');
      return { posts: [], error: 'Network error: Could not connect to server' };
    }
    if (error.response?.status === 402) {
      // Payment required - for now, return empty feed
      console.warn('Payment required for feed access');
      return { posts: [] };
    }
    throw error;
  }
}

export async function createPost(did: string, text: string, parentHash?: string) {
  try {
    const response = await axios.post(`${API_URL}/api/v1/posts`, {
      did,
      text,
      parentHash
    }, {
      timeout: 10000
    });
    return response.data;
  } catch (error: any) {
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || error.message?.includes('timeout')) {
      throw new Error('Network error: Could not connect to server. Please check if the server is running.');
    }
    throw error;
  }
}

export async function getPost(hash: string) {
  const response = await axios.get(`${API_URL}/api/v1/posts/${encodeURIComponent(hash)}`);
  return response.data;
}

export async function getProfile(did: string) {
  const response = await axios.get(`${API_URL}/api/v1/profile/${encodeURIComponent(did)}`);
  return response.data;
}

export async function updateProfile(
  did: string,
  updates: {
    username?: string;
    displayName?: string;
    bio?: string;
    avatar?: string;
    banner?: string;
    website?: string;
  }
) {
  const response = await axios.put(`${API_URL}/api/v1/profile/${encodeURIComponent(did)}`, updates, {
    timeout: 10000
  });
  return response.data;
}

export async function likePost(did: string, targetHash: string) {
  try {
    if (!did || !targetHash) {
      throw new Error('DID and target hash are required');
    }
    const response = await axios.post(`${API_URL}/api/v1/reactions`, {
      did,
      targetHash,
      type: 'like'
    });
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || error.message || 'Failed to like post';
    throw new Error(errorMessage);
  }
}

export async function repostPost(did: string, targetHash: string) {
  try {
    if (!did || !targetHash) {
      throw new Error('DID and target hash are required');
    }
    const response = await axios.post(`${API_URL}/api/v1/reactions`, {
      did,
      targetHash,
      type: 'repost'
    });
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || error.message || 'Failed to repost';
    throw new Error(errorMessage);
  }
}

export async function quotePost(did: string, targetHash: string) {
  try {
    if (!did || !targetHash) {
      throw new Error('DID and target hash are required');
    }
    const response = await axios.post(`${API_URL}/api/v1/reactions`, {
      did,
      targetHash,
      type: 'quote'
    });
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || error.message || 'Failed to create quote cast';
    throw new Error(errorMessage);
  }
}

export async function votePost(did: string, postHash: string, voteType: 'UP' | 'DOWN') {
  const response = await axios.post(`${API_URL}/api/v1/posts/${encodeURIComponent(postHash)}/vote`, {
    did,
    voteType
  }, {
    timeout: 10000
  });
  return response.data;
}

export async function voteComment(did: string, commentHash: string, voteType: 'UP' | 'DOWN') {
  const response = await axios.post(`${API_URL}/api/v1/comments/${encodeURIComponent(commentHash)}/vote`, {
    did,
    voteType
  }, {
    timeout: 10000
  });
  return response.data;
}

export async function voteReply(did: string, replyHash: string, voteType: 'UP' | 'DOWN') {
  // Replies use the same endpoint as comments
  return await voteComment(did, replyHash, voteType);
}

export async function getReactions(postHash: string, did?: string | null) {
  try {
    if (!did) {
      return { liked: false, reposted: false };
    }
    const response = await axios.get(`${API_URL}/api/v1/posts/${encodeURIComponent(postHash)}/reactions`, {
      params: { did },
      timeout: 10000
    });
    return response.data;
  } catch (error: any) {
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || error.message?.includes('timeout')) {
      return { liked: false, reposted: false };
    }
    return { liked: false, reposted: false };
  }
}

export async function getNotifications(did: string) {
  try {
    const response = await axios.get(`${API_URL}/api/v1/notifications`, {
      params: { did },
      timeout: 10000
    });
    return response.data;
  } catch (error: any) {
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || error.message?.includes('timeout')) {
      return { notifications: [] };
    }
    return { notifications: [] };
  }
}

export async function getUnreadNotificationCount(did: string) {
  try {
    const response = await axios.get(`${API_URL}/api/v1/notifications/count`, {
      params: { did },
      timeout: 10000
    });
    return response.data.count || 0;
  } catch (error: any) {
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || error.message?.includes('timeout')) {
      return 0;
    }
    return 0;
  }
}

export async function followUser(followerDid: string, followingDid: string) {
  try {
    const response = await axios.post(`${API_URL}/api/v1/follow`, {
      followerDid,
      followingDid
    }, {
      timeout: 10000
    });
    return response.data;
  } catch (error: any) {
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || error.message?.includes('timeout')) {
      throw new Error('Network error: Could not connect to server. Please check if the server is running.');
    }
    throw error;
  }
}

export async function unfollowUser(followerDid: string, followingDid: string) {
  try {
    const response = await axios.post(`${API_URL}/api/v1/unfollow`, {
      followerDid,
      followingDid
    }, {
      timeout: 10000
    });
    return response.data;
  } catch (error: any) {
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || error.message?.includes('timeout')) {
      throw new Error('Network error: Could not connect to server. Please check if the server is running.');
    }
    throw error;
  }
}

export async function getUserPosts(did: string, limit: number = 50, cursor?: string) {
  try {
    const params: any = { limit };
    if (cursor) params.cursor = cursor;
    const response = await axios.get(`${API_URL}/api/v1/users/${encodeURIComponent(did)}/posts`, {
      params,
      timeout: 10000
    });
    return response.data;
  } catch (error: any) {
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || error.message?.includes('timeout')) {
      throw new Error('Network error: Could not connect to server. Please check if the server is running.');
    }
    throw error;
  }
}

export async function getFollows(did: string) {
  try {
    const response = await axios.get(`${API_URL}/api/v1/profile/${encodeURIComponent(did)}/follows`, {
      timeout: 10000
    });
    return response.data;
  } catch (error: any) {
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || error.message?.includes('timeout')) {
      return { follows: [] };
    }
    return { follows: [] };
  }
}

export async function getReplies(postHash: string) {
  try {
    const response = await axios.get(`${API_URL}/api/v1/posts/${encodeURIComponent(postHash)}/replies`, {
      timeout: 10000
    });
    return response.data;
  } catch (error: any) {
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || error.message?.includes('timeout')) {
      return { replies: [] };
    }
    return { replies: [] };
  }
}

