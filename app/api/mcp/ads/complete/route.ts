import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, paymentTxHash } = body;

    const session = await prisma.adSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    await prisma.adCompletion.create({
      data: {
        sessionId,
        completed: true,
        viewDuration: session.requiredViewDuration,
        paymentProcessed: !!paymentTxHash,
        transactionId: paymentTxHash || undefined,
        completedAt: new Date(),
      },
    });

    await prisma.analyticsEvent.create({
      data: {
        eventType: 'AD_COMPLETED',
        creativeId: session.adId,
        metadata: {
          sessionId,
          paymentTxHash,
          resourceId: session.resourceId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Ad session completed',
    });
  } catch (error) {
    console.error('Error completing ad session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to complete ad session' },
      { status: 500 }
    );
  }
}
