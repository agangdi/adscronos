import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface CreatePremiumResourceRequest {
  title: string;
  description: string;
  category: string;
  tags: string[];
  content: string;
  format: 'TEXT' | 'MARKDOWN' | 'HTML' | 'JSON';
  adRequirement: {
    minViewDuration: number;
    adType: 'video' | 'image' | 'text' | 'interactive';
    cost: number;
  };
  previewContent: string;
  estimatedReadTime: number;
  isPublic: boolean;
}

// GET - List all premium resources (admin only)
async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = {};
    
    if (status) {
      where.status = status;
    }
    
    if (category) {
      where.category = category;
    }

    const [resources, total] = await Promise.all([
      prisma.premiumResource?.findMany({
        where,
        include: {
          content: true,
          _count: {
            select: {
              accesses: true,
              adSessions: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }) || [],
      prisma.premiumResource?.count({ where }) || 0,
    ]);

    return NextResponse.json({
      resources,
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

// POST - Create new premium resource
async function POST(request: NextRequest) {
  try {
    const body: CreatePremiumResourceRequest = await request.json();
    
    const {
      title,
      description,
      category,
      tags,
      content,
      format,
      adRequirement,
      previewContent,
      estimatedReadTime,
      isPublic,
    } = body;

    // Validate required fields
    if (!title || !description || !category || !content || !adRequirement) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate ad requirement
    if (
      !adRequirement.minViewDuration ||
      !adRequirement.adType ||
      typeof adRequirement.cost !== 'number'
    ) {
      return NextResponse.json(
        { error: 'Invalid ad requirement configuration' },
        { status: 400 }
      );
    }

    // Create the premium resource with content
    const resource = await prisma.premiumResource?.create({
      data: {
        title,
        description,
        category,
        tags: tags || [],
        adRequirement,
        previewContent: previewContent || description.substring(0, 200) + '...',
        estimatedReadTime: estimatedReadTime || 5,
        isPublic: isPublic !== false,
        status: 'DRAFT',
        content: {
          create: {
            fullContent: content,
            format: format || 'TEXT',
          },
        },
      },
      include: {
        content: true,
      },
    });

    return NextResponse.json(resource, { status: 201 });

  } catch (error) {
    console.error('Error creating premium resource:', error);
    return NextResponse.json(
      { error: 'Failed to create premium resource' },
      { status: 500 }
    );
  }
}

export { GET, POST };

export const dynamic = 'force-dynamic';
