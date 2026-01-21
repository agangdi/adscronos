import { prisma } from '@/lib/prisma';

export interface PaymentProvider {
  processPayment(amount: number, currency: string, metadata: Record<string, unknown>): Promise<PaymentResult>;
  createSubscription(customerId: string, priceId: string): Promise<SubscriptionResult>;
  cancelSubscription(subscriptionId: string): Promise<boolean>;
  handleWebhook(payload: string, signature: string): Promise<WebhookResult>;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface SubscriptionResult {
  success: boolean;
  subscriptionId?: string;
  customerId: string;
  status: 'active' | 'inactive' | 'cancelled';
  error?: string;
}

export interface WebhookResult {
  success: boolean;
  eventType: string;
  data: Record<string, unknown>;
  error?: string;
}

// Stripe Payment Provider Implementation
export class StripePaymentProvider implements PaymentProvider {
  private apiKey: string;
  private webhookSecret: string;

  constructor(apiKey: string, webhookSecret: string) {
    this.apiKey = apiKey;
    this.webhookSecret = webhookSecret;
  }

  async processPayment(
    amount: number,
    currency: string,
    metadata: Record<string, unknown>
  ): Promise<PaymentResult> {
    try {
      // Simulate Stripe payment processing
      // In real implementation, use Stripe SDK:
      // const stripe = new Stripe(this.apiKey);
      // const paymentIntent = await stripe.paymentIntents.create({...});

      const transactionId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate 95% success rate
      const success = Math.random() > 0.05;

      if (success) {
        return {
          success: true,
          transactionId,
          amount,
          currency,
          status: 'completed',
        };
      } else {
        return {
          success: false,
          amount,
          currency,
          status: 'failed',
          error: 'Payment declined by bank',
        };
      }

    } catch (error) {
      return {
        success: false,
        amount,
        currency,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async createSubscription(customerId: string, priceId: string): Promise<SubscriptionResult> {
    try {
      // Simulate Stripe subscription creation
      const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        success: true,
        subscriptionId,
        customerId,
        status: 'active',
      };

    } catch (error) {
      return {
        success: false,
        customerId,
        status: 'inactive',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      // Simulate Stripe subscription cancellation
      return true;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return false;
    }
  }

  async handleWebhook(payload: string, signature: string): Promise<WebhookResult> {
    try {
      // Simulate webhook verification and processing
      // In real implementation, verify signature with Stripe
      
      const event = JSON.parse(payload);
      
      return {
        success: true,
        eventType: event.type,
        data: event.data,
      };

    } catch (error) {
      return {
        success: false,
        eventType: 'unknown',
        data: {},
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Payment Service
export class PaymentService {
  private provider: PaymentProvider;

  constructor(provider: PaymentProvider) {
    this.provider = provider;
  }

  async processAdPayment(
    sessionId: string,
    amount: number,
    currency: string = 'USD'
  ): Promise<PaymentResult> {
    try {
      const metadata = {
        sessionId,
        type: 'ad_completion',
        timestamp: new Date().toISOString(),
      };

      const result = await this.provider.processPayment(amount, currency, metadata);

      if (result.success && result.transactionId) {
        // Record payment in database
        await this.recordPayment({
          sessionId,
          transactionId: result.transactionId,
          amount,
          currency,
          status: result.status,
          provider: 'stripe',
        });
      }

      return result;

    } catch (error) {
      console.error('Error processing ad payment:', error);
      return {
        success: false,
        amount,
        currency,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async createUserSubscription(
    userId: string,
    tier: 'basic' | 'premium' | 'enterprise'
  ): Promise<SubscriptionResult> {
    try {
      const priceIds = {
        basic: 'price_basic_monthly',
        premium: 'price_premium_monthly',
        enterprise: 'price_enterprise_monthly',
      };

      const result = await this.provider.createSubscription(userId, priceIds[tier]);

      if (result.success && result.subscriptionId) {
        // Update user subscription in database
        await this.updateUserSubscription(userId, {
          subscriptionId: result.subscriptionId,
          tier,
          status: result.status,
        });
      }

      return result;

    } catch (error) {
      console.error('Error creating subscription:', error);
      return {
        success: false,
        customerId: userId,
        status: 'inactive',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async recordPayment(payment: {
    sessionId: string;
    transactionId: string;
    amount: number;
    currency: string;
    status: string;
    provider: string;
  }): Promise<void> {
    try {
      // Get session details
      const session = await prisma.adSession?.findUnique({
        where: { id: payment.sessionId },
        include: {
          creative: {
            include: {
              advertiser: true,
            },
          },
        },
      });

      if (!session) {
        throw new Error('Session not found');
      }

      // Create billing record for advertiser
      await prisma.billing.create({
        data: {
          advertiserId: session.creative.advertiserId,
          amountCents: Math.round(payment.amount * 100),
          currency: payment.currency,
          status: payment.status === 'completed' ? 'PAID' : 'PENDING',
          description: `Ad completion payment - Session ${payment.sessionId}`,
          transactionId: payment.transactionId,
          paymentMethod: payment.provider,
          paidAt: payment.status === 'completed' ? new Date() : null,
        },
      });

    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  }

  private async updateUserSubscription(userId: string, subscription: {
    subscriptionId: string;
    tier: string;
    status: string;
  }): Promise<void> {
    try {
      await prisma.chatGPTUser?.upsert({
        where: { chatgptUserId: userId },
        update: {
          subscriptionTier: subscription.tier,
          lastActiveAt: new Date(),
        },
        create: {
          chatgptUserId: userId,
          subscriptionTier: subscription.tier,
          isActive: true,
        },
      });

    } catch (error) {
      console.error('Error updating user subscription:', error);
      throw error;
    }
  }
}

// Revenue sharing calculation
export class RevenueService {
  static calculateRevenueSplit(
    totalAmount: number,
    publisherShare: number = 0.7, // 70% to publisher
    platformShare: number = 0.3   // 30% to platform
  ): { publisherAmount: number; platformAmount: number } {
    const publisherAmount = totalAmount * publisherShare;
    const platformAmount = totalAmount * platformShare;

    return {
      publisherAmount: Math.round(publisherAmount * 100) / 100,
      platformAmount: Math.round(platformAmount * 100) / 100,
    };
  }

  static async processRevenueDistribution(
    sessionId: string,
    totalAmount: number
  ): Promise<void> {
    try {
      const session = await prisma.adSession?.findUnique({
        where: { id: sessionId },
        include: {
          creative: {
            include: {
              advertiser: true,
              campaign: true,
            },
          },
        },
      });

      if (!session) {
        throw new Error('Session not found');
      }

      const { publisherAmount, platformAmount } = this.calculateRevenueSplit(totalAmount);

      // Create revenue entries
      await Promise.all([
        // Publisher revenue
        prisma.ledgerEntry.create({
          data: {
            advertiserId: session.creative.advertiserId,
            amountCents: Math.round(publisherAmount * 100),
            currency: 'USD',
            direction: 'DEBIT',
            description: `Revenue share - Publisher (${Math.round(publisherAmount * 100 / totalAmount)}%)`,
          },
        }),
        // Platform revenue
        prisma.ledgerEntry.create({
          data: {
            advertiserId: session.creative.advertiserId,
            amountCents: Math.round(platformAmount * 100),
            currency: 'USD',
            direction: 'CREDIT',
            description: `Revenue share - Platform (${Math.round(platformAmount * 100 / totalAmount)}%)`,
          },
        }),
      ]);

    } catch (error) {
      console.error('Error processing revenue distribution:', error);
      throw error;
    }
  }
}

// Initialize payment service
export const paymentService = new PaymentService(
  new StripePaymentProvider(
    process.env.STRIPE_SECRET_KEY || '',
    process.env.STRIPE_WEBHOOK_SECRET || ''
  )
);
