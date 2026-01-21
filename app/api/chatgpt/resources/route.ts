import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface PremiumResource {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  adRequirement: {
    minViewDuration: number;
    adType: 'video' | 'image' | 'text' | 'interactive';
    cost: number;
  };
  previewContent: string;
  estimatedReadTime: number;
}

async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const tags = searchParams.get('tags')?.split(',').map(tag => tag.trim());
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build filter conditions
    const where: Record<string, unknown> = {
      status: 'PUBLISHED',
      isPublic: true,
    };

    if (category) {
      where.category = category;
    }

    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags,
      };
    }

    // Fetch premium resources from database
    const [resources, total] = await Promise.all([
      prisma.premiumResource.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          tags: true,
          adRequirement: true,
          previewContent: true,
          estimatedReadTime: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.premiumResource.count({ where }),
    ]);

    const formattedResources: PremiumResource[] = resources.map((resource: {
      id: string;
      title: string;
      description: string;
      category: string;
      tags: string[];
      adRequirement: unknown;
      previewContent: string;
      estimatedReadTime: number;
      createdAt: Date;
    }) => ({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      category: resource.category,
      tags: resource.tags,
      adRequirement: resource.adRequirement as PremiumResource['adRequirement'],
      previewContent: resource.previewContent,
      estimatedReadTime: resource.estimatedReadTime,
    }));

    return NextResponse.json({
      resources: formattedResources,
      total,
      hasMore: offset + limit < total,
      pagination: {
        offset,
        limit,
        total,
      },
    });

  } catch (error) {
    console.error('Error fetching premium resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch premium resources' },
      { status: 500 }
    );
  }
}

export { GET };

// Apply middleware for authentication and rate limiting
export const dynamic = 'force-dynamic';
