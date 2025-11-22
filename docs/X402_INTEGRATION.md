# x402 Payment Integration

## Overview

x402 is an HTTP-based payment protocol that uses the `402 Payment Required` status code to enable machine-to-machine payments. This document describes how x402 payments are integrated into the Daemon Social Network for scalable API access.

## x402 Protocol Basics

### HTTP 402 Status Code

The `402 Payment Required` status code indicates that payment is required to access a resource. The response includes payment information that the client can use to make a payment.

### Payment Flow

```
1. Client requests resource
2. Server responds with 402 Payment Required
3. Client makes payment
4. Client retries request with payment proof
5. Server grants access
```

## Integration Architecture

### Components

1. **x402 Payment Service**: Handles payment verification and token generation
2. **Gateway Middleware**: Intercepts requests and enforces payments
3. **Client SDK**: Handles payment flow automatically
4. **Payment Registry**: On-chain or off-chain payment tracking

## Payment Service

### Implementation

```typescript
// backend/src/services/x402.ts

export interface PaymentRequest {
  amount: string;           // Payment amount
  currency: string;         // Payment currency (ETH, DAEMON, etc.)
  recipient: string;       // Payment recipient address
  nonce: string;           // Unique payment nonce
  expiry: number;          // Payment expiry timestamp
}

export interface PaymentProof {
  transactionHash: string;  // On-chain transaction hash
  blockNumber: number;      // Block number
  amount: string;           // Paid amount
  currency: string;         // Payment currency
  timestamp: number;        // Payment timestamp
}

export class X402Service {
  /**
   * Generate payment request for a resource
   */
  async generatePaymentRequest(
    resource: string,
    userId?: string
  ): Promise<PaymentRequest> {
    // Calculate payment amount based on resource
    const amount = this.calculateAmount(resource);

    // Generate unique nonce
    const nonce = generateNonce();

    // Set expiry (e.g., 5 minutes)
    const expiry = Date.now() + 5 * 60 * 1000;

    return {
      amount,
      currency: 'DAEMON', // or ETH
      recipient: this.getPaymentRecipient(),
      nonce,
      expiry
    };
  }

  /**
   * Verify payment proof
   */
  async verifyPayment(proof: PaymentProof): Promise<boolean> {
    // Verify on-chain transaction
    const tx = await this.provider.getTransaction(proof.transactionHash);

    // Verify transaction details
    if (tx.to !== this.getPaymentRecipient()) return false;
    if (tx.value.toString() !== proof.amount) return false;

    // Verify block confirmation
    const currentBlock = await this.provider.getBlockNumber();
    if (currentBlock - proof.blockNumber < this.minConfirmations) {
      return false;
    }

    return true;
  }

  /**
   * Generate access token from payment proof
   */
  async generateAccessToken(proof: PaymentProof): Promise<string> {
    // Create JWT token with payment proof embedded
    const token = jwt.sign({
      paymentHash: proof.transactionHash,
      amount: proof.amount,
      currency: proof.currency,
      expiresAt: Date.now() + this.tokenValidityPeriod
    }, this.secretKey);

    return token;
  }
}
```

## Gateway Middleware

### Implementation

```typescript
// social-network/gateway/x402-middleware.ts

import { Request, Response, NextFunction } from 'express';
import { X402Service } from '../../backend/src/services/x402.js';

export function x402Middleware(x402Service: X402Service) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Check if endpoint requires payment
    if (!requiresPayment(req.path)) {
      return next();
    }

    // Check for valid access token
    const token = req.headers['x-access-token'] as string;

    if (token) {
      // Verify token
      const isValid = await x402Service.verifyAccessToken(token);
      if (isValid) {
        return next();
      }
    }

    // Generate payment request
    const paymentRequest = await x402Service.generatePaymentRequest(
      req.path,
      req.user?.id
    );

    // Return 402 with payment information
    res.status(402).json({
      error: 'Payment Required',
      payment: {
        amount: paymentRequest.amount,
        currency: paymentRequest.currency,
        recipient: paymentRequest.recipient,
        nonce: paymentRequest.nonce,
        expiry: paymentRequest.expiry
      },
      instructions: {
        method: 'POST',
        url: '/api/v1/payments/verify',
        body: {
          transactionHash: '<transaction-hash>',
          nonce: paymentRequest.nonce
        }
      }
    });
  };
}
```

## Client SDK

### Implementation

```typescript
// sdk/src/social/x402-client.ts

export class X402Client {
  private accessToken?: string;
  private tokenExpiry?: number;

  /**
   * Make API request with automatic payment handling
   */
  async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Add access token if available and valid
    if (this.accessToken && this.isTokenValid()) {
      options.headers = {
        ...options.headers,
        'x-access-token': this.accessToken
      };
    }

    let response = await fetch(url, options);

    // Handle 402 Payment Required
    if (response.status === 402) {
      const paymentInfo = await response.json();

      // Make payment
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

  /**
   * Make payment transaction
   */
  private async makePayment(paymentRequest: PaymentRequest): Promise<PaymentProof> {
    // Get wallet signer
    const signer = await this.getSigner();

    // Create transaction
    const tx = await signer.sendTransaction({
      to: paymentRequest.recipient,
      value: ethers.parseEther(paymentRequest.amount),
      // Include nonce in data if needed
    });

    // Wait for confirmation
    const receipt = await tx.wait();

    return {
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      amount: paymentRequest.amount,
      currency: paymentRequest.currency,
      timestamp: Date.now()
    };
  }

  /**
   * Verify payment and get access token
   */
  private async verifyPayment(proof: PaymentProof): Promise<string> {
    const response = await fetch('/api/v1/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proof)
    });

    const data = await response.json();
    return data.accessToken;
  }

  /**
   * Check if access token is still valid
   */
  private isTokenValid(): boolean {
    if (!this.tokenExpiry) return false;
    return Date.now() < this.tokenExpiry;
  }
}
```

## Payment Endpoints

### Verify Payment

```typescript
// backend/src/routes/x402.ts

router.post('/payments/verify', async (req, res) => {
  const { transactionHash, nonce, blockNumber, amount, currency } = req.body;

  // Verify payment
  const proof: PaymentProof = {
    transactionHash,
    blockNumber,
    amount,
    currency,
    timestamp: Date.now()
  };

  const isValid = await x402Service.verifyPayment(proof);

  if (!isValid) {
    return res.status(400).json({ error: 'Invalid payment proof' });
  }

  // Generate access token
  const accessToken = await x402Service.generateAccessToken(proof);

  res.json({ accessToken, expiresIn: 3600 });
});
```

## Payment Pricing

### Pricing Model

Different resources have different pricing:

```typescript
const PRICING = {
  '/api/v1/feed': '0.001',           // 0.001 DAEMON per request
  '/api/v1/posts': '0.002',          // 0.002 DAEMON per post creation
  '/api/v1/search': '0.0005',        // 0.0005 DAEMON per search
  '/api/v1/profile': '0.0001',       // 0.0001 DAEMON per profile view
};
```

### Free Tier

- First N requests per day free
- Verified users get free tier
- Contributors get extended free tier

## Access Token Management

### Token Structure

```typescript
interface AccessToken {
  paymentHash: string;      // Payment transaction hash
  amount: string;           // Paid amount
  currency: string;          // Payment currency
  issuedAt: number;         // Token issuance timestamp
  expiresAt: number;       // Token expiry timestamp
  scope: string[];          // Allowed endpoints
}
```

### Token Validation

```typescript
async function validateAccessToken(token: string): Promise<boolean> {
  try {
    const decoded = jwt.verify(token, secretKey) as AccessToken;

    // Check expiry
    if (Date.now() > decoded.expiresAt) {
      return false;
    }

    // Verify payment still valid (not refunded, etc.)
    const paymentValid = await verifyPaymentStillValid(decoded.paymentHash);

    return paymentValid;
  } catch (error) {
    return false;
  }
}
```

## Rate Limiting

### Payment-Based Rate Limiting

- Higher payment = higher rate limit
- Access tokens include rate limit info
- Rate limits reset with new payment

```typescript
interface RateLimit {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
}
```

## Security Considerations

1. **Payment Verification**: Verify on-chain transactions
2. **Nonce Reuse**: Prevent nonce reuse attacks
3. **Token Expiry**: Short-lived access tokens
4. **Payment Replay**: Prevent payment replay attacks
5. **Amount Verification**: Verify exact payment amount

## Future Enhancements

- Off-chain payment channels (Lightning Network style)
- Subscription-based payments
- Batch payments for multiple requests
- Payment aggregation
- Multi-currency support

