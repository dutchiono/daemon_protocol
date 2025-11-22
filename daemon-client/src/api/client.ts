import axios from 'axios';

// Remove trailing /api if present - the requests already include /api/v1/...
const BASE_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:4003';
const API_URL = BASE_URL.replace(/\/api\/?$/, '');

// Simplified client - no x402 for now (can add later)
export async function getFeed(fid?: number, type: string = 'algorithmic', limit: number = 50) {
  try {
    const params: any = { type, limit };
    if (fid) params.fid = fid;

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

export async function createPost(fid: number, text: string, parentHash?: string) {
  try {
    const response = await axios.post(`${API_URL}/api/v1/posts`, {
      fid,
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

export async function getProfile(fid: number) {
  const response = await axios.get(`${API_URL}/api/v1/profile/${fid}`);
  return response.data;
}

export async function updateProfile(
  fid: number,
  updates: {
    username?: string;
    displayName?: string;
    bio?: string;
    avatar?: string;
    banner?: string;
    website?: string;
  }
) {
  const response = await axios.put(`${API_URL}/api/v1/profile/${fid}`, updates, {
    timeout: 10000
  });
  return response.data;
}

export async function likePost(targetHash: string) {
  // Would need fid from context
  const response = await axios.post(`${API_URL}/api/v1/reactions`, {
    targetHash,
    type: 'like'
  });
  return response.data;
}

export async function repostPost(targetHash: string) {
  const response = await axios.post(`${API_URL}/api/v1/reactions`, {
    targetHash,
    type: 'repost'
  });
  return response.data;
}

export async function getUnreadNotificationCount(fid: number) {
  try {
    const response = await axios.get(`${API_URL}/api/v1/notifications/count`, {
      params: { fid },
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

