import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { userId, paymentTxHash } = body;

    const resource = await prisma.premiumResource.findUnique({
      where: {
        id: params.id,
      },
      include: {
        content: true,
      },
    });

    if (!resource) {
      return NextResponse.json(
        { success: false, error: 'Resource not found' },
        { status: 404 }
      );
    }

    const requiresPayment = !resource.isPublic || !!resource.adRequirement;

    if (requiresPayment && !paymentTxHash) {
      return NextResponse.json(
        { success: false, error: 'Payment required' },
        { status: 402 }
      );
    }

    let accessRecord = null;
    if (paymentTxHash) {
      accessRecord = await prisma.resourceAccess.create({
        data: {
          resourceId: params.id,
          userId,
          accessMethod: 'DIRECT_PAYMENT',
          expiresAt: new Date(Date.now() + 86400000),
        },
      });
    }

    return NextResponse.json({
      success: true,
      content: resource.content?.fullContent || resource.previewContent,
      payment: paymentTxHash
        ? {
            txHash: paymentTxHash,
            accessedAt: accessRecord?.accessedAt,
          }
        : undefined,
    });
  } catch (error) {
    console.error('Error accessing resource:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to access resource' },
      { status: 500 }
    );
  }
}
