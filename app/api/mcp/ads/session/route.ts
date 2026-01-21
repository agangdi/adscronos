import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resourceId, userId } = body;

    const resource = await prisma.premiumResource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      return NextResponse.json(
        { success: false, error: 'Resource not found' },
        { status: 404 }
      );
    }

    const activeCampaigns = await prisma.campaign.findMany({
      where: {
        status: 'ACTIVE',
        startAt: { lte: new Date() },
        OR: [
          { endAt: null },
          { endAt: { gte: new Date() } },
        ],
      },
      include: {
        creatives: {
          where: {
            status: 'APPROVED',
          },
          take: 1,
        },
      },
    });

    if (activeCampaigns.length === 0 || !activeCampaigns[0].creatives[0]) {
      return NextResponse.json(
        { success: false, error: 'No ads available' },
        { status: 503 }
      );
    }

    const creative = activeCampaigns[0].creatives[0];
    
    const session = await prisma.adSession.create({
      data: {
        resourceId,
        userId,
        adId: creative.id,
        requiredViewDuration: 15,
        expiresAt: new Date(Date.now() + 300000),
      },
    });

    const adDuration = 15;

    return NextResponse.json({
      success: true,
      session: {
        adId: session.id,
        adUrl: creative.assetUrl || `https://example.com/ad/${creative.id}`,
        duration: adDuration,
        resourceId,
      },
    });
  } catch (error) {
    console.error('Error creating ad session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create ad session' },
      { status: 500 }
    );
  }
}
