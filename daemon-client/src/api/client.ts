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
export async function getFeed(did?: string | null, type: string = 'algorithmic', limit: number = 50) {
  try {
    const params: any = { type, limit };
    if (did) params.did = did;

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
  const response = await axios.get(`${API_URL}/api/v1/posts/${hash}`);
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
  const response = await axios.post(`${API_URL}/api/v1/reactions`, {
    did,
    targetHash,
    type: 'like'
  });
  return response.data;
}

export async function repostPost(did: string, targetHash: string) {
  const response = await axios.post(`${API_URL}/api/v1/reactions`, {
    did,
    targetHash,
    type: 'repost'
  });
  return response.data;
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

