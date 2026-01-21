import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface AccessRequest {
  userId: string;
  paymentTxHash?: string;
  sessionId?: string;
}

interface AccessResponse {
  success: boolean;
  content: string;
  format: string;
  accessedAt: string;
  expiresAt: string;
  payment?: {
    txHash: string;
    amount: string;
    timestamp: string;
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: { resourceId: string } }
) {
  try {
    const { resourceId } = params;
    const body: AccessRequest = await request.json();
    const { userId, paymentTxHash, sessionId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Fetch the premium resource with content
    const resource = await prisma.premiumResource.findUnique({
      where: { id: resourceId },
      include: {
        content: true,
      },
    });

    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    if (!resource.content) {
      return NextResponse.json(
        { error: 'Resource content not available' },
        { status: 404 }
      );
    }

    // Check if this is a free resource
    const adRequirement = resource.adRequirement as {
      minViewDuration: number;
      adType: string;
      cost: number;
    };

    const isFreeResource = adRequirement.cost === 0;

    // Verify access authorization
    let accessGranted = isFreeResource;
    let adSession = null;

    if (!isFreeResource) {
      if (sessionId) {
        // Verify ad session completion
        adSession = await prisma.adSession.findUnique({
          where: { 
            id: sessionId,
            resourceId: resourceId,
          },
          include: {
            adCompletion: true,
          },
        });

        if (adSession?.adCompletion?.completed && adSession.adCompletion.paymentProcessed) {
          accessGranted = true;
        }
      } else if (paymentTxHash) {
        // Verify direct payment (X402)
        // In a real implementation, verify the payment with X402 facilitator
        accessGranted = true;
      }
    }

    if (!accessGranted) {
      return NextResponse.json(
        { 
          error: 'Access denied. Please complete ad viewing or payment.',
          requiresPayment: true,
          cost: adRequirement.cost,
        },
        { status: 402 }
      );
    }

    // Grant access - create access record
    const accessExpiresAt = new Date();
    accessExpiresAt.setHours(accessExpiresAt.getHours() + 24); // 24-hour access

    await prisma.resourceAccess.create({
      data: {
        resourceId: resource.id,
        userId: userId,
        accessMethod: paymentTxHash ? 'DIRECT_PAYMENT' : 'AD_COMPLETION',
        sessionId: sessionId || null,
        expiresAt: accessExpiresAt,
      },
    });

    // Prepare response
    const response: AccessResponse = {
      success: true,
      content: resource.content.fullContent,
      format: resource.content.format,
      accessedAt: new Date().toISOString(),
      expiresAt: accessExpiresAt.toISOString(),
    };

    // Include payment info if available
    if (paymentTxHash) {
      response.payment = {
        txHash: paymentTxHash,
        amount: adRequirement.cost.toString(),
        timestamp: new Date().toISOString(),
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error accessing premium resource:', error);
    return NextResponse.json(
      { error: 'Failed to access premium resource' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
