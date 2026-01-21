import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/payment';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature') || '';

    // Process webhook with payment service
    const result = await paymentService['provider'].handleWebhook(body, signature);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Webhook verification failed' },
        { status: 400 }
      );
    }

    // Handle different event types
    switch (result.eventType) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(result.data);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(result.data);
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(result.data);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(result.data);
        break;
      
      default:
        console.log(`Unhandled event type: ${result.eventType}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Error processing payment webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(data: Record<string, unknown>) {
  try {
    const paymentIntent = data.object as {
      id: string;
      amount: number;
      currency: string;
      metadata: {
        sessionId?: string;
        userId?: string;
      };
    };

    if (paymentIntent.metadata.sessionId) {
      // Update ad completion
      await prisma.adCompletion?.updateMany({
        where: {
          session: {
            id: paymentIntent.metadata.sessionId,
          },
        },
        data: {
          paymentProcessed: true,
          transactionId: paymentIntent.id,
          billingAmount: paymentIntent.amount / 100, // Convert from cents
        },
      });

      console.log(`Payment processed for session: ${paymentIntent.metadata.sessionId}`);
    }

  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailure(data: Record<string, unknown>) {
  try {
    const paymentIntent = data.object as {
      id: string;
      metadata: {
        sessionId?: string;
      };
    };

    if (paymentIntent.metadata.sessionId) {
      // Mark payment as failed
      await prisma.adCompletion?.updateMany({
        where: {
          session: {
            id: paymentIntent.metadata.sessionId,
          },
        },
        data: {
          paymentProcessed: false,
        },
      });

      console.log(`Payment failed for session: ${paymentIntent.metadata.sessionId}`);
    }

  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handleSubscriptionCreated(data: Record<string, unknown>) {
  try {
    const subscription = data.object as {
      id: string;
      customer: string;
      status: string;
      items: {
        data: Array<{
          price: {
            id: string;
          };
        }>;
      };
    };

    // Map price IDs to subscription tiers
    const tierMapping: Record<string, string> = {
      'price_basic_monthly': 'basic',
      'price_premium_monthly': 'premium',
      'price_enterprise_monthly': 'enterprise',
    };

    const priceId = subscription.items.data[0]?.price.id;
    const tier = tierMapping[priceId] || 'basic';

    // Update user subscription
    await prisma.chatGPTUser?.upsert({
      where: { chatgptUserId: subscription.customer },
      update: {
        subscriptionTier: tier,
        lastActiveAt: new Date(),
      },
      create: {
        chatgptUserId: subscription.customer,
        subscriptionTier: tier,
        isActive: true,
      },
    });

    console.log(`Subscription created for customer: ${subscription.customer}`);

  } catch (error) {
    console.error('Error handling subscription creation:', error);
  }
}

async function handleSubscriptionCancelled(data: Record<string, unknown>) {
  try {
    const subscription = data.object as {
      id: string;
      customer: string;
    };

    // Downgrade to free tier
    await prisma.chatGPTUser?.update({
      where: { chatgptUserId: subscription.customer },
      data: {
        subscriptionTier: 'free',
        lastActiveAt: new Date(),
      },
    });

    console.log(`Subscription cancelled for customer: ${subscription.customer}`);

  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}

export const dynamic = 'force-dynamic';
