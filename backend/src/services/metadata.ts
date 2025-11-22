import FormData from 'form-data';
import axios from 'axios';
import env from '../config/env.js';

/**
 * Upload metadata to IPFS/pinning service
 */
export async function uploadMetadata(metadata: {
  name: string;
  description: string;
  image: string;
}): Promise<string> {
  // Placeholder implementation
  // In production, this would upload to Pinata, NFT.Storage, or similar

  if (env.PINATA_API_KEY && env.PINATA_SECRET_KEY) {
    // TODO: Implement Pinata upload
    // const formData = new FormData();
    // formData.append('file', JSON.stringify(metadata));
    // const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    //   method: 'POST',
    //   headers: {
    //     'pinata_api_key': env.PINATA_API_KEY,
    //     'pinata_secret_api_key': env.PINATA_SECRET_KEY,
    //   },
    //   body: formData,
    // });
    // const result = await response.json();
    // return `ipfs://${result.IpfsHash}`;
  }

  // Fallback: return a placeholder URI
  return `ipfs://placeholder-${Date.now()}`;
}

/**
 * Upload image to IPFS via Pinata
 */
export async function uploadImage(imageData: string | Buffer, mimeType?: string): Promise<string> {
  // Check for JWT first (preferred), then fall back to API_KEY + SECRET_KEY
  if (!env.PINATA_JWT && (!env.PINATA_API_KEY || !env.PINATA_SECRET_KEY)) {
    throw new Error('Pinata credentials not configured (need PINATA_JWT or PINATA_API_KEY + PINATA_SECRET_KEY)');
  }

  // Convert string (data URL or base64) to Buffer if needed
  let buffer: Buffer;
  if (typeof imageData === 'string') {
    // Handle data URL (data:image/png;base64,...)
    if (imageData.startsWith('data:')) {
      const base64Data = imageData.split(',')[1];
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      // Assume it's base64
      buffer = Buffer.from(imageData, 'base64');
    }
  } else {
    buffer = imageData;
  }

  // Upload to Pinata using form-data with axios (works better than fetch)
  const formData = new FormData();

  // Append file directly as buffer (form-data package accepts buffers)
  formData.append('file', buffer, {
    filename: `token-image-${Date.now()}.png`,
    contentType: mimeType || 'image/png',
  });

  // Prepare headers - use JWT if available, otherwise use API key/secret
  const headers: Record<string, string> = { ...formData.getHeaders() };

  if (env.PINATA_JWT) {
    // Use JWT authentication (simpler, matches Pumpkin code)
    headers['Authorization'] = `Bearer ${env.PINATA_JWT}`;
  } else {
    // Use API key/secret authentication
    headers['pinata_api_key'] = env.PINATA_API_KEY!;
    headers['pinata_secret_api_key'] = env.PINATA_SECRET_KEY!;

    // Add optional metadata and options for API key/secret method
    const pinataMetadata = {
      name: `token-image-${Date.now()}`,
      keyvalues: {
        uploadedAt: new Date().toISOString(),
      },
    };
    formData.append('pinataMetadata', JSON.stringify(pinataMetadata));

    const pinataOptions = {
      cidVersion: 0,
    };
    formData.append('pinataOptions', JSON.stringify(pinataOptions));
  }

  // Use axios instead of fetch - it handles form-data better
  const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
    headers,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  const ipfsHash = response.data.IpfsHash;

  // Return IPFS URL
  return `ipfs://${ipfsHash}`;
}

export default {
  uploadMetadata,
  uploadImage,
};

