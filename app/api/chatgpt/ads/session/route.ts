import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface AdSession {
  sessionId: string;
  resourceId: string;
  adId: string;
  adContent: {
    type: 'video' | 'image' | 'text' | 'interactive';
    url: string;
    duration: number;
    title: string;
    description: string;
  };
  expiresAt: string;
  viewingUrl: string;
}

async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resourceId, userId } = body;

    if (!resourceId || !userId) {
      return NextResponse.json(
        { error: 'resourceId and userId are required' },
        { status: 400 }
      );
    }

    // Fetch the premium resource
    const resource = await prisma.premiumResource?.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    // Find a suitable ad for this resource
    const availableAd = await prisma.creative.findFirst({
      where: {
        status: 'APPROVED',
        campaign: {
          status: 'ACTIVE',
          startAt: { lte: new Date() },
          endAt: { gte: new Date() },
        },
      },
      include: {
        campaign: {
          include: {
            advertiser: true,
          },
        },
      },
    });

    if (!availableAd) {
      return NextResponse.json(
        { error: 'No ads available for this resource' },
        { status: 503 }
      );
    }

    // Get ad requirement from resource
    const adRequirement = resource.adRequirement as {
      minViewDuration: number;
      adType: string;
      cost: number;
    };

    // Create ad session
    const sessionExpiresAt = new Date();
    sessionExpiresAt.setMinutes(sessionExpiresAt.getMinutes() + 30); // 30-minute session

    const newAdSession = await prisma.adSession?.create({
      data: {
        resourceId: resource.id,
        adId: availableAd.id,
        userId: userId,
        expiresAt: sessionExpiresAt,
        requiredViewDuration: adRequirement.minViewDuration,
      },
    });

    if (!newAdSession) {
      return NextResponse.json(
        { error: 'Failed to create ad session' },
        { status: 500 }
      );
    }

    const adSession: AdSession = {
      sessionId: newAdSession.id,
      resourceId: resource.id,
      adId: availableAd.id,
      adContent: {
        type: adRequirement.adType as AdSession['adContent']['type'],
        url: availableAd.assetUrl,
        duration: adRequirement.minViewDuration,
        title: availableAd.name,
        description: availableAd.clickUrl || 'Premium advertisement',
      },
      expiresAt: sessionExpiresAt.toISOString(),
      viewingUrl: `/api/chatgpt/ads/view/${newAdSession.id}`,
    };

    return NextResponse.json(adSession, { status: 201 });

  } catch (error) {
    console.error('Error creating ad session:', error);
    return NextResponse.json(
      { error: 'Failed to create ad session' },
      { status: 500 }
    );
  }
}

export { POST };

export const dynamic = 'force-dynamic';
