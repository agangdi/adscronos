import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resource = await prisma.premiumResource.findUnique({
      where: {
        id: params.id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        tags: true,
        isPublic: true,
        adRequirement: true,
        previewContent: true,
        estimatedReadTime: true,
      },
    });

    if (!resource) {
      return NextResponse.json(
        { success: false, error: 'Resource not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      resource,
    });
  } catch (error) {
    console.error('Error fetching resource:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch resource' },
      { status: 500 }
    );
  }
}
