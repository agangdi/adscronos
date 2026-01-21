import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface ResourceContent {
  id: string;
  title: string;
  content: string;
  format: 'text' | 'markdown' | 'html' | 'json';
  metadata: Record<string, unknown>;
  accessedAt: string;
  expiresAt: string;
}

interface AdPaywallResponse {
  message: string;
  adRequired: boolean;
  adSession: {
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
  };
  estimatedCost: number;
}

async function GET(
  request: NextRequest,
  { params }: { params: { resourceId: string } }
) {
  try {
    const { resourceId } = params;
    const { searchParams } = new URL(request.url);
    const adSessionId = searchParams.get('adSessionId');

    // Fetch the premium resource
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

    // Check if ad session is provided and valid
    if (adSessionId) {
      const adSession = await prisma.adSession.findUnique({
        where: { 
          id: adSessionId,
          resourceId: resourceId,
        },
        include: {
          adCompletion: true,
        },
      });

      if (adSession && adSession.adCompletion && adSession.adCompletion.completed) {
        // Ad was completed, return the full content
        const accessExpiresAt = new Date();
        accessExpiresAt.setHours(accessExpiresAt.getHours() + 24); // 24-hour access

        // Log the access
        await prisma.resourceAccess.create({
          data: {
            resourceId: resource.id,
            userId: adSession.userId,
            accessMethod: 'AD_COMPLETION',
            sessionId: adSession.id,
            expiresAt: accessExpiresAt,
          },
        });

        const resourceContent: ResourceContent = {
          id: resource.id,
          title: resource.title,
          content: resource.content?.fullContent || '',
          format: (resource.content?.format as ResourceContent['format']) || 'text',
          metadata: resource.metadata as Record<string, unknown>,
          accessedAt: new Date().toISOString(),
          expiresAt: accessExpiresAt.toISOString(),
        };

        return NextResponse.json(resourceContent);
      }
    }

    // No valid ad session, return paywall response
    const adRequirement = resource.adRequirement as {
      minViewDuration: number;
      adType: string;
      cost: number;
    };

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

    // Create ad session
    const sessionExpiresAt = new Date();
    sessionExpiresAt.setMinutes(sessionExpiresAt.getMinutes() + 30); // 30-minute session

    const newAdSession = await prisma.adSession.create({
      data: {
        resourceId: resource.id,
        adId: availableAd.id,
        userId: 'chatgpt-user', // Will be replaced with actual ChatGPT user ID
        expiresAt: sessionExpiresAt,
        requiredViewDuration: adRequirement.minViewDuration,
      },
    });

    const paywallResponse: AdPaywallResponse = {
      message: 'This premium content requires viewing an advertisement to access.',
      adRequired: true,
      adSession: {
        sessionId: newAdSession.id,
        resourceId: resource.id,
        adId: availableAd.id,
        adContent: {
          type: (adRequirement.adType as AdPaywallResponse['adSession']['adContent']['type']),
          url: availableAd.assetUrl,
          duration: adRequirement.minViewDuration,
          title: availableAd.name,
          description: availableAd.clickUrl || 'Premium advertisement',
        },
        expiresAt: sessionExpiresAt.toISOString(),
        viewingUrl: `/api/chatgpt/ads/view/${newAdSession.id}`,
      },
      estimatedCost: adRequirement.cost,
    };

    return NextResponse.json(paywallResponse, { status: 402 });

  } catch (error) {
    console.error('Error fetching premium resource:', error);
    return NextResponse.json(
      { error: 'Failed to fetch premium resource' },
      { status: 500 }
    );
  }
}

export { GET };

export const dynamic = 'force-dynamic';
