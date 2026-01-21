import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, AdType, CreativeStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const apiKey = searchParams.get('api_key');
    const adType = searchParams.get('type') as AdType;

    // Validate API key
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      );
    }

    // Validate ad type
    if (!adType || !Object.values(AdType).includes(adType)) {
      return NextResponse.json(
        { error: 'Valid ad type is required (VIDEO, IMAGE, TEXT, HTML)' },
        { status: 400 }
      );
    }

    // Verify API key belongs to a publisher
    const publisher = await prisma.publisher.findUnique({
      where: { apiKey },
      select: { id: true, siteName: true }
    });

    if (!publisher) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Find all approved creatives of the requested type
    const creatives = await prisma.creative.findMany({
      where: {
        type: adType,
        // status: CreativeStatus.APPROVED,
      },
      include: {
        advertiser: {
          select: {
            id: true,
            name: true,
          }
        },
        campaign: {
          select: {
            id: true,
            name: true,
            status: true,
            startAt: true,
            endAt: true,
          }
        }
      }
    });

    // Filter creatives by active campaigns
    const activeCreatives = creatives.filter(creative => {
      if (!creative.campaign) return false;
      
      const now = new Date();
      const isActive = creative.campaign.status === 'ACTIVE';
      const isInDateRange = 
        (!creative.campaign.startAt || creative.campaign.startAt <= now) &&
        (!creative.campaign.endAt || creative.campaign.endAt >= now);
      
      return isActive && isInDateRange;
    });

    if (activeCreatives.length === 0) {
      return NextResponse.json(
        { error: 'No available ads for the requested type' },
        { status: 404 }
      );
    }

    // Randomly select one creative
    const randomIndex = Math.floor(Math.random() * activeCreatives.length);
    const selectedCreative = activeCreatives[randomIndex];

    // Create a playback record with UUID
    const playback = await prisma.adPlayback.create({
      data: {
        creativeId: selectedCreative.id,
        apiKey,
        publisherId: publisher.id,
        requestedType: adType,
        status: 'STARTED',
        metadata: {
          userAgent: request.headers.get('user-agent'),
          referer: request.headers.get('referer'),
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        }
      }
    });

    // Return ad data with playback UUID
    return NextResponse.json({
      playbackId: playback.id,
      ad: {
        id: selectedCreative.id,
        name: selectedCreative.name,
        type: selectedCreative.type,
        assetUrl: selectedCreative.assetUrl,
        clickUrl: selectedCreative.clickUrl,
        durationMs: selectedCreative.durationMs,
        width: selectedCreative.width,
        height: selectedCreative.height,
        advertiser: {
          name: selectedCreative.advertiser.name,
        },
        campaign: {
          name: selectedCreative.campaign?.name,
        }
      },
      instructions: {
        message: 'Please call the playback completion endpoint when the ad finishes playing',
        endpoint: '/api/public/ads/playback',
        method: 'POST',
        requiredFields: ['playbackId', 'status', 'viewDuration']
      }
    });

  } catch (error) {
    console.error('Error fetching random ad:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
