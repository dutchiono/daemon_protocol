import axios from 'axios';

const API_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:4003';

// Simplified client - no x402 for now (can add later)
export async function getFeed(fid: number, type: string = 'algorithmic', limit: number = 50) {
  try {
    const response = await axios.get(`${API_URL}/api/v1/feed`, {
      params: { fid, type, limit }
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 402) {
      // Payment required - for now, return empty feed
      console.warn('Payment required for feed access');
      return { posts: [] };
    }
    throw error;
  }
}

export async function createPost(fid: number, text: string, parentHash?: string) {
  const response = await axios.post(`${API_URL}/api/v1/posts`, {
    fid,
    text,
    parentHash
  });
  return response.data;
}

export async function getPost(hash: string) {
  const response = await axios.get(`${API_URL}/api/v1/posts/${hash}`);
  return response.data;
}

export async function getProfile(fid: number) {
  const response = await axios.get(`${API_URL}/api/v1/profile/${fid}`);
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

