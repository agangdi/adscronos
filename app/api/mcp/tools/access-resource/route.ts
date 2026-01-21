import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resourceId, userId } = body;

    if (!resourceId || !userId) {
      return NextResponse.json(
        {
          content: [{ type: 'text', text: 'Missing resourceId or userId' }],
          isError: true,
        },
        { status: 400 }
      );
    }

    const resource = await prisma.premiumResource.findUnique({
      where: {
        id: resourceId,
      },
      include: {
        content: true,
      },
    });

    if (!resource) {
      return NextResponse.json(
        {
          content: [{ type: 'text', text: 'Resource not found' }],
          isError: true,
        },
        { status: 404 }
      );
    }

    if (resource.isPublic && !resource.adRequirement) {
      return NextResponse.json({
        content: [
          {
            type: 'text',
            text: `Access granted to: ${resource.title}`,
          },
        ],
        structuredContent: {
          resourceId: resource.id,
          title: resource.title,
          hasAccess: true,
        },
        _meta: {
          content: resource.content?.fullContent || resource.previewContent,
          'openai/outputTemplate': 'ui://widget/mcp-widget.html',
        },
      });
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
        {
          content: [{ type: 'text', text: 'No ads available at this time' }],
          isError: true,
        },
        { status: 503 }
      );
    }

    const creative = activeCampaigns[0].creatives[0];

    const session = await prisma.adSession.create({
      data: {
        resourceId,
        adId: creative.id,
        userId,
        requiredViewDuration: 15,
        expiresAt: new Date(Date.now() + 300000),
      },
    });

    const adDuration = 15;

    return NextResponse.json({
      content: [
        {
          type: 'text',
          text: `Please watch the ad to access: ${resource.title}`,
        },
      ],
      structuredContent: {
        resourceId: resource.id,
        title: resource.title,
        requiresAd: true,
        adDuration,
      },
      _meta: {
        sessionId: session.id,
        adUrl: creative.assetUrl || `https://example.com/ad/${creative.id}`,
        price: resource.adRequirement,
        'openai/outputTemplate': 'ui://widget/mcp-widget.html',
      },
    });
  } catch (error) {
    console.error('Error accessing resource:', error);
    return NextResponse.json(
      {
        content: [{ type: 'text', text: 'Failed to access resource' }],
        isError: true,
      },
      { status: 500 }
    );
  }
}
