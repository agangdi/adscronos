import axios from 'axios';

export interface PaymentRequirements {
  scheme: string;
  network: string;
  payTo: string;
  asset: string;
  description: string;
  mimeType: string;
  maxAmountRequired: string;
  maxTimeoutSeconds: number;
}

export interface PaymentHeader {
  x402Version: number;
  scheme: string;
  network: string;
  payload: {
    from: string;
    to: string;
    value: string;
    validAfter: number;
    validBefore: number;
    nonce: string;
    signature: string;
    asset: string;
  };
}

export interface VerifyResponse {
  isValid: boolean;
  invalidReason?: string;
}

export interface SettleResponse {
  event: string;
  txHash?: string;
  from?: string;
  to?: string;
  value?: string;
  blockNumber?: number;
  timestamp?: number;
  error?: string;
}

export class X402Client {
  private facilitatorUrl: string;

  constructor(facilitatorUrl: string) {
    this.facilitatorUrl = facilitatorUrl;
  }

  async verify(
    paymentHeader: string,
    paymentRequirements: PaymentRequirements
  ): Promise<VerifyResponse> {
    try {
      const response = await axios.post(
        `${this.facilitatorUrl}/verify`,
        {
          x402Version: 1,
          paymentHeader,
          paymentRequirements,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X402-Version': '1',
          },
        }
      );

      return response.data;
    } catch (error: unknown) {
      console.error('X402 verification error:', error);
      throw new Error(
        `Payment verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async settle(
    paymentHeader: string,
    paymentRequirements: PaymentRequirements
  ): Promise<SettleResponse> {
    try {
      const response = await axios.post(
        `${this.facilitatorUrl}/settle`,
        {
          x402Version: 1,
          paymentHeader,
          paymentRequirements,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X402-Version': '1',
          },
        }
      );

      return response.data;
    } catch (error: unknown) {
      console.error('X402 settlement error:', error);
      throw new Error(
        `Payment settlement failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
