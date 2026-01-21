import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface AdCompletionResponse {
  success: boolean;
  paymentProcessed: boolean;
  resourceUnlocked: boolean;
  accessToken: string;
  billingAmount: number;
  transactionId: string;
}

async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, adId, viewDuration, interactionData } = body;

    if (!sessionId || !adId || typeof viewDuration !== 'number') {
      return NextResponse.json(
        { error: 'sessionId, adId, and viewDuration are required' },
        { status: 400 }
      );
    }

    // Fetch the ad session
    const adSession = await prisma.adSession?.findUnique({
      where: { id: sessionId },
      include: {
        resource: true,
        creative: {
          include: {
            campaign: {
              include: {
                advertiser: true,
              },
            },
          },
        },
      },
    });

    if (!adSession) {
      return NextResponse.json(
        { error: 'Ad session not found' },
        { status: 404 }
      );
    }

    // Check if session has expired
    if (new Date() > adSession.expiresAt) {
      return NextResponse.json(
        { error: 'Ad session has expired' },
        { status: 410 }
      );
    }

    // Validate minimum viewing duration
    if (viewDuration < adSession.requiredViewDuration) {
      return NextResponse.json(
        { 
          error: `Minimum viewing duration of ${adSession.requiredViewDuration} seconds not met`,
          requiredDuration: adSession.requiredViewDuration,
          actualDuration: viewDuration,
        },
        { status: 400 }
      );
    }

    // Check if already completed
    const existingCompletion = await prisma.adCompletion?.findUnique({
      where: { sessionId: sessionId },
    });

    if (existingCompletion?.completed) {
      return NextResponse.json(
        { error: 'Ad session already completed' },
        { status: 409 }
      );
    }

    // Calculate billing amount
    const adRequirement = adSession.resource.adRequirement as {
      cost: number;
    };
    const billingAmount = adRequirement.cost;

    // Generate transaction ID
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create or update ad completion
    const adCompletion = await prisma.adCompletion?.upsert({
      where: { sessionId: sessionId },
      update: {
        completed: true,
        viewDuration: viewDuration,
        interactionData: interactionData || {},
        paymentProcessed: true,
        billingAmount: billingAmount,
        transactionId: transactionId,
        completedAt: new Date(),
      },
      create: {
        sessionId: sessionId,
        completed: true,
        viewDuration: viewDuration,
        interactionData: interactionData || {},
        paymentProcessed: true,
        billingAmount: billingAmount,
        transactionId: transactionId,
        completedAt: new Date(),
      },
    });

    if (!adCompletion) {
      return NextResponse.json(
        { error: 'Failed to process ad completion' },
        { status: 500 }
      );
    }

    // Create billing record for the advertiser
    await prisma.billing.create({
      data: {
        advertiserId: adSession.creative.advertiserId,
        amountCents: Math.round(billingAmount * 100),
        currency: 'USD',
        status: 'PAID',
        description: `Ad view for resource: ${adSession.resource.title}`,
        transactionId: transactionId,
        paidAt: new Date(),
      },
    });

    // Generate access token for the resource
    const accessToken = `access_${sessionId}_${Date.now()}`;

    const response: AdCompletionResponse = {
      success: true,
      paymentProcessed: true,
      resourceUnlocked: true,
      accessToken: accessToken,
      billingAmount: billingAmount,
      transactionId: transactionId,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error completing ad viewing:', error);
    return NextResponse.json(
      { error: 'Failed to complete ad viewing' },
      { status: 500 }
    );
  }
}

export { POST };

export const dynamic = 'force-dynamic';
