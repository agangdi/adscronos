import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, PlaybackStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playbackId, status, viewDuration, metadata } = body;

    // Validate required fields
    if (!playbackId) {
      return NextResponse.json(
        { error: 'playbackId is required' },
        { status: 400 }
      );
    }

    if (!status || !Object.values(PlaybackStatus).includes(status as PlaybackStatus)) {
      return NextResponse.json(
        { error: 'Valid status is required (STARTED, COMPLETED, SKIPPED, ERROR)' },
        { status: 400 }
      );
    }

    // Find the playback record
    const playback = await prisma.adPlayback.findUnique({
      where: { id: playbackId },
      include: {
        creative: {
          include: {
            advertiser: true,
            campaign: true,
          }
        }
      }
    });

    if (!playback) {
      return NextResponse.json(
        { error: 'Playback record not found' },
        { status: 404 }
      );
    }

    // Validate that the playback hasn't already been completed
    if (playback.status === 'COMPLETED' && status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Playback already marked as completed' },
        { status: 400 }
      );
    }

    // Update the playback record
    const updatedPlayback = await prisma.adPlayback.update({
      where: { id: playbackId },
      data: {
        status: status as PlaybackStatus,
        viewDuration: viewDuration || playback.viewDuration,
        completedAt: status === 'COMPLETED' ? new Date() : playback.completedAt,
        metadata: metadata ? {
          ...(playback.metadata as object || {}),
          ...metadata,
          lastUpdated: new Date().toISOString(),
        } : playback.metadata,
      }
    });

    // If completed, create an ad event for tracking
    if (status === 'COMPLETED') {
      // Find the publisher by API key
      const publisher = await prisma.publisher.findUnique({
        where: { apiKey: playback.apiKey },
      });

      if (publisher) {
        // Get publisher's first ad unit
        const publisherWithUnits = await prisma.publisher.findUnique({
          where: { id: publisher.id },
          include: { adUnits: { take: 1 } }
        });

        const adUnitId = publisherWithUnits?.adUnits[0]?.id;

        if (adUnitId) {
          // Create impression event
          await prisma.adEvent.create({
            data: {
              eventType: 'IMPRESSION',
              publisherId: publisher.id,
              adUnitId,
              campaignId: playback.creative.campaignId,
              creativeId: playback.creative.id,
              advertiserId: playback.creative.advertiserId,
              requestId: playbackId,
            }
          });

          // Create complete event
          await prisma.adEvent.create({
            data: {
              eventType: 'COMPLETE',
              publisherId: publisher.id,
              adUnitId,
              campaignId: playback.creative.campaignId,
              creativeId: playback.creative.id,
              advertiserId: playback.creative.advertiserId,
              requestId: playbackId,
            }
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      playbackId: updatedPlayback.id,
      status: updatedPlayback.status,
      message: `Playback status updated to ${status}`,
      data: {
        viewDuration: updatedPlayback.viewDuration,
        completedAt: updatedPlayback.completedAt,
        creative: {
          id: playback.creative.id,
          name: playback.creative.name,
          type: playback.creative.type,
        },
        campaign: playback.creative.campaign ? {
          id: playback.creative.campaign.id,
          name: playback.creative.campaign.name,
        } : null,
      }
    });

  } catch (error) {
    console.error('Error updating playback status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve playback status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const playbackId = searchParams.get('playbackId');
    const apiKey = searchParams.get('api_key');

    if (!playbackId) {
      return NextResponse.json(
        { error: 'playbackId is required' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'api_key is required' },
        { status: 401 }
      );
    }

    // Find the playback record
    const playback = await prisma.adPlayback.findUnique({
      where: { id: playbackId },
      include: {
        creative: {
          select: {
            id: true,
            name: true,
            type: true,
            assetUrl: true,
          }
        }
      }
    });

    if (!playback) {
      return NextResponse.json(
        { error: 'Playback record not found' },
        { status: 404 }
      );
    }

    // Verify API key matches
    if (playback.apiKey !== apiKey) {
      return NextResponse.json(
        { error: 'Unauthorized access to playback record' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      playbackId: playback.id,
      status: playback.status,
      requestedType: playback.requestedType,
      viewDuration: playback.viewDuration,
      completedAt: playback.completedAt,
      createdAt: playback.createdAt,
      creative: playback.creative,
    });

  } catch (error) {
    console.error('Error fetching playback status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
