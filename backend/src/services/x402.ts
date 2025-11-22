/**
 * @title x402 Payment Service
 * @notice Handles HTTP 402 Payment Required protocol for API access
 */

import { ethers } from 'ethers';
import jwt from 'jsonwebtoken';
import pg from 'pg';

const { Pool } = pg;

export interface PaymentRequest {
  amount: string;
  currency: string;
  recipient: string;
  nonce: string;
  expiry: number;
}

export interface PaymentProof {
  transactionHash: string;
  blockNumber: number;
  amount: string;
  currency: string;
  timestamp: number;
}

export interface AccessToken {
  paymentHash: string;
  amount: string;
  currency: string;
  issuedAt: number;
  expiresAt: number;
  scope: string[];
}

export class X402Service {
  private provider: ethers.JsonRpcProvider;
  private db: pg.Pool;
  private secretKey: string;
  private minConfirmations: number = 3;
  private tokenValidityPeriod: number = 3600 * 1000; // 1 hour

  constructor(
    rpcUrl: string,
    databaseUrl: string,
    secretKey: string
  ) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.db = new Pool({ connectionString: databaseUrl });
    this.secretKey = secretKey;
  }

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
    const nonce = this.generateNonce();

    // Set expiry (e.g., 5 minutes)
    const expiry = Date.now() + 5 * 60 * 1000;

    // Get payment recipient (from config or contract)
    const recipient = await this.getPaymentRecipient();

    return {
      amount,
      currency: 'DAEMON', // or ETH
      recipient,
      nonce,
      expiry
    };
  }

  /**
   * Verify payment proof
   */
  async verifyPayment(proof: PaymentProof): Promise<boolean> {
    // Check if payment already used
    const existing = await this.db.query(
      `SELECT * FROM x402_payments WHERE transaction_hash = $1`,
      [proof.transactionHash]
    );

    if (existing.rows.length > 0 && existing.rows[0].used) {
      return false; // Payment already used
    }

    // Verify on-chain transaction
    try {
      const tx = await this.provider.getTransaction(proof.transactionHash);
      if (!tx) return false;

      // Verify transaction details
      const receipt = await tx.wait();
      if (!receipt) return false;

      // Verify recipient
      const recipient = await this.getPaymentRecipient();
      if (tx.to?.toLowerCase() !== recipient.toLowerCase()) {
        return false;
      }

      // Verify amount (convert to wei for comparison)
      const paidAmount = ethers.formatEther(tx.value);
      if (Math.abs(parseFloat(paidAmount) - parseFloat(proof.amount)) > 0.0001) {
        return false;
      }

      // Verify block confirmation
      const currentBlock = await this.provider.getBlockNumber();
      if (currentBlock - receipt.blockNumber < this.minConfirmations) {
        return false;
      }

      // Store payment record
      await this.db.query(
        `INSERT INTO x402_payments (
          transaction_hash, payer_address, amount, currency, block_number, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (transaction_hash) DO NOTHING`,
        [
          proof.transactionHash,
          tx.from,
          proof.amount,
          proof.currency,
          receipt.blockNumber,
          Math.floor(Date.now() / 1000)
        ]
      );

      return true;
    } catch (error) {
      console.error('Payment verification error:', error);
      return false;
    }
  }

  /**
   * Generate access token from payment proof
   */
  async generateAccessToken(
    proof: PaymentProof,
    resource?: string
  ): Promise<string> {
    // Verify payment first
    const isValid = await this.verifyPayment(proof);
    if (!isValid) {
      throw new Error('Invalid payment proof');
    }

    // Mark payment as used
    await this.db.query(
      `UPDATE x402_payments SET used = true WHERE transaction_hash = $1`,
      [proof.transactionHash]
    );

    // Create access token
    const tokenData: AccessToken = {
      paymentHash: proof.transactionHash,
      amount: proof.amount,
      currency: proof.currency,
      issuedAt: Date.now(),
      expiresAt: Date.now() + this.tokenValidityPeriod,
      scope: resource ? [resource] : ['*'] // All resources or specific
    };

    const token = jwt.sign(tokenData, this.secretKey, {
      expiresIn: this.tokenValidityPeriod / 1000 // Convert to seconds
    });

    // Store access token
    const tokenHash = ethers.keccak256(ethers.toUtf8Bytes(token));
    await this.db.query(
      `INSERT INTO access_tokens (
        token_hash, payment_id, scope, issued_at, expires_at
      ) VALUES ($1, (SELECT id FROM x402_payments WHERE transaction_hash = $2), $3, NOW(), $4)`,
      [
        tokenHash,
        proof.transactionHash,
        tokenData.scope,
        new Date(tokenData.expiresAt)
      ]
    );

    return token;
  }

  /**
   * Verify access token
   */
  async verifyAccessToken(token: string): Promise<boolean> {
    try {
      // Verify JWT signature
      const decoded = jwt.verify(token, this.secretKey) as AccessToken;

      // Check expiry
      if (Date.now() > decoded.expiresAt) {
        return false;
      }

      // Check if token is revoked
      const tokenHash = ethers.keccak256(ethers.toUtf8Bytes(token));
      const result = await this.db.query(
        `SELECT revoked FROM access_tokens WHERE token_hash = $1`,
        [tokenHash]
      );

      if (result.rows.length === 0) {
        return false; // Token not found
      }

      if (result.rows[0].revoked) {
        return false; // Token revoked
      }

      // Verify payment still valid (not refunded, etc.)
      const paymentResult = await this.db.query(
        `SELECT used FROM x402_payments WHERE transaction_hash = $1`,
        [decoded.paymentHash]
      );

      if (paymentResult.rows.length === 0 || !paymentResult.rows[0].used) {
        return false; // Payment not found or not used
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Calculate payment amount for a resource
   */
  private calculateAmount(resource: string): string {
    const pricing: Record<string, string> = {
      '/api/v1/feed': '0.001',
      '/api/v1/posts': '0.002',
      '/api/v1/search': '0.0005',
      '/api/v1/profile': '0.0001'
    };

    // Find matching pricing
    for (const [path, amount] of Object.entries(pricing)) {
      if (resource.startsWith(path)) {
        return amount;
      }
    }

    // Default pricing
    return '0.001';
  }

  /**
   * Generate unique nonce
   */
  private generateNonce(): string {
    return ethers.randomBytes(32).toString('hex');
  }

  /**
   * Get payment recipient address
   */
  private async getPaymentRecipient(): Promise<string> {
    // In production, would get from config or contract
    // For now, return a placeholder
    return process.env.PAYMENT_RECIPIENT || '0x0000000000000000000000000000000000000000';
  }
}

