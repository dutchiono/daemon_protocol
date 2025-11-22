import axios from 'axios';

const API_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:4003';

// x402 client for automatic payment handling
class X402Client {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    // Add access token if available and valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      options.headers = {
        ...options.headers,
        'x-access-token': this.accessToken
      };
    }

    let response = await fetch(url, options);

    // Handle 402 Payment Required
    if (response.status === 402) {
      const paymentInfo = await response.json();

      // Make payment (simplified - would need wallet integration)
      const paymentProof = await this.makePayment(paymentInfo.payment);

      // Verify payment and get access token
      this.accessToken = await this.verifyPayment(paymentProof);
      this.tokenExpiry = Date.now() + 3600000; // 1 hour

      // Retry request with access token
      options.headers = {
        ...options.headers,
        'x-access-token': this.accessToken
      };
      response = await fetch(url, options);
    }

    if (!response.ok) {
      throw new Error(`Request failed: ${response.statusText}`);
    }

    return response.json();
  }

  private async makePayment(paymentRequest: any): Promise<any> {
    // TODO: Implement actual payment using wallet
    // For now, return mock proof
    return {
      transactionHash: '0x' + Math.random().toString(16).substring(2),
      blockNumber: 0,
      amount: paymentRequest.amount,
      currency: paymentRequest.currency,
      timestamp: Date.now()
    };
  }

  private async verifyPayment(proof: any): Promise<string> {
    const response = await fetch(`${API_URL}/api/v1/payments/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proof)
    });

    const data = await response.json();
    return data.accessToken;
  }
}

const x402Client = new X402Client();

export async function getFeed(fid: number, type: string = 'algorithmic', limit: number = 50) {
  return x402Client.request(`${API_URL}/api/v1/feed?fid=${fid}&type=${type}&limit=${limit}`);
}

export async function createPost(fid: number, text: string, parentHash?: string) {
  return x402Client.request(`${API_URL}/api/v1/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fid, text, parentHash })
  });
}

export async function getPost(hash: string) {
  return x402Client.request(`${API_URL}/api/v1/posts/${hash}`);
}

export async function getProfile(fid: number) {
  return x402Client.request(`${API_URL}/api/v1/profile/${fid}`);
}

export async function likePost(targetHash: string) {
  // Would need fid from context
  return x402Client.request(`${API_URL}/api/v1/reactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetHash, type: 'like' })
  });
}

export async function repostPost(targetHash: string) {
  return x402Client.request(`${API_URL}/api/v1/reactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetHash, type: 'repost' })
  });
}

