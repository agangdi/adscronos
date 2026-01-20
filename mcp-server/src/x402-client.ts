import axios from 'axios';
import { config } from './config.js';
import type { PaymentRequirements, PaymentHeader, VerifyResponse, SettleResponse } from './types.js';

export class X402Client {
  private facilitatorUrl: string;

  constructor() {
    this.facilitatorUrl = config.facilitatorUrl;
  }

  async verifyPayment(
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
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return {
          isValid: false,
          invalidReason: error.response.data?.invalidReason || error.message,
        };
      }
      throw error;
    }
  }

  async settlePayment(
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
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return {
          event: 'payment.failed',
          error: error.response.data?.error || error.message,
        };
      }
      throw error;
    }
  }

  createPaymentRequirements(
    resourceId: string,
    description: string,
    price?: string
  ): PaymentRequirements {
    return {
      scheme: 'exact',
      network: config.network,
      payTo: config.sellerWallet,
      asset: config.usdxContract,
      description,
      mimeType: 'application/json',
      maxAmountRequired: price || config.defaultPrice,
      maxTimeoutSeconds: config.paymentTimeout,
    };
  }
}
